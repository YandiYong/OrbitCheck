import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  signal,
  effect,
  computed,
  OnDestroy,
  Inject,
  Optional,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DsvStore } from './dsv.store';
import { SignatureApiService } from './signature-api.service';

@Component({
  selector: 'dsv-signature-form',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatSliderModule,
  ],
  template: `
    <mat-card class="panel">
      <h2 class="panel-title">Create Digital Signature</h2>

      <div class="canvas-block">
        <label>Sign Here</label>
        <div class="controls">
          <input type="color" [value]="store.penColor()" (input)="onColor($event)" aria-label="Pen color" />
          <mat-slider>
            <input matSliderThumb [value]="store.lineWidth()" (input)="onWidth($event)" min="1" max="12" step="1" />
          </mat-slider>
        </div>
        <canvas
          #canvas
          class="canvas"
          width="400"
          height="200"
          (pointerdown)="start($event)"
          (pointermove)="move($event)"
          (pointerup)="stop()"
          (pointerleave)="stop()"
        ></canvas>
      </div>

      <div class="form-grid">
        <mat-form-field >
          <mat-label>Signature For</mat-label>
          <mat-select [value]="store.signatureFor()" (selectionChange)="store.setSignatureFor($event.value)">
            <mat-option value="">Select who signs</mat-option>
            <mat-option value="Patient">Patient</mat-option>
            <mat-option value="Guardian">Guardian</mat-option>
            <mat-option value="Healthcare Provider">Healthcare Provider</mat-option>
            <mat-option value="Witness">Witness</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Select Purpose</mat-label>
          <mat-select [value]="store.purpose()" (selectionChange)="store.setPurpose($event.value)">
            <mat-option value="">Choose document type</mat-option>
            <mat-option value="Consent Form">Consent Form</mat-option>
            <mat-option value="Intervention Session">Intervention Session</mat-option>
            <mat-option value="Treatment Plan">Treatment Plan</mat-option>
            <mat-option value="Discharge Form">Discharge Form</mat-option>
            <mat-option value="Financial Agreement">Financial Agreement</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="actions">
        <button mat-stroked-button color="primary" (click)="undo()" [disabled]="!hasSignature()">Undo</button>
        <button mat-stroked-button color="primary" (click)="clear()">Clear</button>
        <button mat-raised-button color="primary" (click)="save()" [disabled]="!canSave()">Save Signature</button>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .panel { padding: var(--space-lg, 16px); }
      .panel-title { font-weight: 700; margin-bottom: var(--space-sm, 8px); }
      .canvas-block label { display: block; margin-bottom: var(--space-xs, 6px); color: var(--color-muted, #6b7280); }
      .controls { display: flex; align-items: center; gap: var(--space-sm, 8px); margin-bottom: var(--space-sm, 8px); }
      .canvas { width: 100%; border: 2px solid var(--color-border, #e5e7eb); border-radius: var(--radius-md, 8px); background: var(--color-surface, #ffffff); touch-action: none; cursor: crosshair; }
      .form-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-md, 12px); margin: var(--space-lg, 16px) 0; }
      @media (min-width: 768px) { .form-grid { grid-template-columns: 1fr 1fr; } }
      .actions { display: flex; gap: var(--space-md, 12px); }
    `,
  ],
})
export class DsvSignatureFormComponent implements AfterViewInit, OnDestroy {
  // Reference to the signature canvas element
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Drawing state flags managed via Angular signals
  readonly isDrawing = signal(false);
  readonly hasSignature = signal(false);
  // Computed flag enabling save only when canvas has content and fields are filled
  readonly canSave = computed(() =>
    this.hasSignature() && !!this.store.signatureFor() && !!this.store.purpose()
  );
  // 2D drawing context and observer to keep canvas in sync with display size
  private ctx!: CanvasRenderingContext2D;
  private resizeObserver?: ResizeObserver;

  // Stroke model and history for undo support
  private strokes: { color: string; width: number; points: Array<{ x: number; y: number }> }[] = [];
  private currentStroke?: { color: string; width: number; points: Array<{ x: number; y: number }> };
  private activePointerId: number | null = null;

  // Keep canvas pen settings synced with store values; defined in a field initializer
  // to ensure effect is created in Angular's injection context.
  readonly penSettingsEffect = effect(() => {
    if (!this.ctx) return;
    this.ctx.strokeStyle = this.store.penColor();
    this.ctx.lineWidth = this.store.lineWidth();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  });

  constructor(
    public store: DsvStore,
    private api: SignatureApiService,
    @Optional() @Inject(MAT_DIALOG_DATA) private dialogData: any
  ) {}

  ngAfterViewInit(): void {
    // Initialize 2D context and set up resizing + pen settings reactions
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.resizeToDisplaySize();
    this.resizeObserver = new ResizeObserver(() => this.resizeToDisplaySize());
    this.resizeObserver.observe(canvas);
  }

  ngOnDestroy(): void {
    // Stop listening to size changes when component is destroyed
    this.resizeObserver?.disconnect();
  }

  private resizeToDisplaySize() {
    // Scale canvas for device pixel ratio while preserving CSS size
    const canvas = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const displayHeight = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
      // Re-apply pen settings after scaling
      this.ctx.strokeStyle = this.store.penColor();
      this.ctx.lineWidth = this.store.lineWidth();
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
    // Redraw all stored strokes after resize to keep content visible
    this.redrawAll();
  }

  private getClampedPoint(ev: PointerEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const rawX = ev.clientX - rect.left;
    const rawY = ev.clientY - rect.top;
    const maxX = Math.max(0, rect.width - 1);
    const maxY = Math.max(0, rect.height - 1);
    return {
      x: Math.min(maxX, Math.max(0, rawX)),
      y: Math.min(maxY, Math.max(0, rawY)),
    };
  }

  private clearCanvasPixels() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.restore();
  }

  start(ev: PointerEvent) {
    // Begin path and capture pointer to track drawing within the canvas
    const canvas = this.canvasRef.nativeElement;
    const p = this.getClampedPoint(ev);
    this.isDrawing.set(true);
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y);
    canvas.setPointerCapture(ev.pointerId);
    this.activePointerId = ev.pointerId;
    // Mark that the canvas has content once drawing starts
    this.hasSignature.set(true);
    // Start a new stroke with current pen settings
    this.currentStroke = {
      color: this.store.penColor(),
      width: this.store.lineWidth(),
      points: [{ x: p.x, y: p.y }],
    };
  }

  move(ev: PointerEvent) {
    // Extend path while drawing and render the stroke
    if (!this.isDrawing()) return;
    if (this.activePointerId !== null && ev.pointerId !== this.activePointerId) return;
    const p = this.getClampedPoint(ev);
    this.ctx.lineTo(p.x, p.y);
    this.ctx.stroke();
    // Record the point for undo/redo redraws
    this.currentStroke?.points.push({ x: p.x, y: p.y });
  }

  stop() {
    // End current drawing gesture
    this.isDrawing.set(false);
    const canvas = this.canvasRef.nativeElement;
    try {
      if (this.activePointerId !== null && canvas.hasPointerCapture(this.activePointerId)) {
        canvas.releasePointerCapture(this.activePointerId);
      }
    } catch {}
    this.activePointerId = null;
    if (this.currentStroke) {
      this.strokes.push(this.currentStroke);
      this.currentStroke = undefined;
    }
  }

  clear() {
    // Clear the canvas and reset signature presence flag
    this.isDrawing.set(false);
    this.currentStroke = undefined;
    this.clearCanvasPixels();
    this.hasSignature.set(false);
    this.strokes = [];
  }

  save() {
    // Validate and snapshot canvas as PNG.
    // For checklist completion flow, signature is sent inside /api/checklist/completed only.
    if (!this.canSave()) {
      alert('Please fill in all fields');
      return;
    }
    const canvas = this.canvasRef.nativeElement;
    const dataUrl = canvas.toDataURL('image/png');
    // Add locally so parent flow can pick it up from the store
    this.store.addSignature(dataUrl);

    const isChecklistCompletion = this.dialogData?.source === 'checklist-completion';
    if (!isChecklistCompletion) {
      const payload = {
        image: dataUrl,
        user: this.store.currentUser(),
        purpose: this.store.purpose(),
        signedFor: this.store.signatureFor(),
        date: new Date(),
      };
      this.api.save(payload).subscribe({
        next: () => {},
        error: (e) => console.error('API save failed', e),
      });
    }

    this.clear();
    this.store.setSignatureFor('');
    this.store.setPurpose('');
  }

  onColor(ev: Event) {
    // Update pen color in store and apply immediately to context
    const value = (ev.target as HTMLInputElement).value;
    this.store.setPenColor(value);
    // Apply immediately to current drawing context
    this.ctx.strokeStyle = value;
  }

  onWidth(ev: Event) {
    // Update line width used for future strokes
    const value = Number((ev.target as HTMLInputElement).value);
    if (!Number.isNaN(value)) {
      this.store.setLineWidth(value);
      // Apply immediately to current drawing context
      this.ctx.lineWidth = value;
    }
  }

  // Undo the last stroke by removing it from history and redrawing the canvas
  undo() {
    if (this.isDrawing()) return; // avoid conflicts while drawing
    if (this.strokes.length === 0) return;
    this.strokes.pop();
    this.redrawAll();
    this.hasSignature.set(this.strokes.length > 0);
  }

  // Redraw all recorded strokes onto the canvas
  private redrawAll() {
    this.clearCanvasPixels();
    for (const s of this.strokes) {
      this.ctx.strokeStyle = s.color;
      this.ctx.lineWidth = s.width;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      if (s.points.length > 0) {
        this.ctx.beginPath();
        this.ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
          this.ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        this.ctx.stroke();
      }
    }
    // Reapply current pen settings after redraw (to not leak stroke styles)
    this.ctx.strokeStyle = this.store.penColor();
    this.ctx.lineWidth = this.store.lineWidth();
  }
}
