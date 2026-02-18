import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface SignatureDialogData {
  image: string;
  user: string;
  purpose: string;
  date: string;
}

@Component({
  selector: 'dsv-signature-view-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div style="display:flex; align-items:center; gap:8px;">
      <h2 mat-dialog-title style="margin:0;">Signature Preview</h2>
      <button mat-icon-button aria-label="Close dialog" style="margin-left:auto;" (click)="close()"><mat-icon>close</mat-icon></button>
    </div>
    <div mat-dialog-content class="content">
      <div class="image-wrap">
        <img [src]="data.image" alt="Signature" />
      </div>
      <div class="meta">
        <p><strong>Signed by:</strong> {{ data.user }}</p>
        <p><strong>Signed for:</strong> {{ data.purpose }}</p>
        <p><strong>Date:</strong> {{ data.date | date:'dd/MM/yyyy HH:mm a' }}</p>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button class="sd-close-btn" (click)="close()">Close</button>
    </div>
  `,
  styles: [
    `
      .content { display: grid; grid-template-columns: 1fr; gap: var(--space-md); }
      .image-wrap { display: flex; align-items: center; justify-content: center; background: var(--bg-pale); border: 1px solid var(--color-border); padding: var(--space-md); }
      .image-wrap img { max-width: 100%; height: auto; }
      .meta p { margin: 0; color: var(--color-muted); }
      .sd-close-btn {
        min-width: 128px;
        font-weight: 800;
        border-width: 2px;
        border-color: var(--color-primary-600);
        color: var(--color-primary-700);
        background: var(--bg-pale);
        box-shadow: var(--shadow-md);
        animation: sd-pop 1.15s ease-in-out infinite alternate;
        transition: transform .16s ease, box-shadow .16s ease;
      }
      .sd-close-btn:hover {
        transform: translateY(-1px) scale(1.04);
        box-shadow: var(--shadow-md);
      }
      @keyframes sd-pop {
        from { transform: scale(1); }
        to { transform: scale(1.03); }
      }
      @media (min-width: 640px) { .content { grid-template-columns: 1fr 1fr; } }
    `,
  ],
})
export class SignatureViewDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SignatureDialogData,
    private dialogRef: MatDialogRef<SignatureViewDialogComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }
}
