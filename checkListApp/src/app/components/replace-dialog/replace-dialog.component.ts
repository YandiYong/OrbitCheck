import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

// Runtime dialog data shape varies; use `any` to avoid adding fields to the `Item` model
import { parseAnyDate, formatDDMMYYYY } from '../../utils/date-utils';

@Component({
  selector: 'app-replace-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    FormsModule,
    MatIconModule
  ],
  template: `
    <div style="position:relative;">
      <h2 mat-dialog-title>Replace Item</h2>
      <button mat-icon-button mat-dialog-close aria-label="Close dialog" style="position:absolute; right:8px; top:8px; background:transparent; border:none; box-shadow:none;">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content style="max-height:60vh; overflow:auto; padding:8px; box-sizing:border-box;">
      <div style="display:flex; flex-direction:column; gap:12px; width:100%; margin-top:8px;">
        <mat-form-field appearance="fill">
          <mat-label>Item Name</mat-label>
          <input matInput [value]="data.item.name" disabled />
        </mat-form-field>
        </div>

            <ng-container *ngIf="hasVariants(); else singleExpiry">
              <div style="margin-top:12px;">
                <table style="width:100%; border-collapse:collapse;">
                  <thead>
                    <tr style="text-align:left; border-bottom:1px solid #e5e7eb;">
                      <th style="padding:6px 8px;">Description</th>
                      <th style="padding:6px 8px;">Expiring Date</th>
                      <th style="padding:6px 8px;">Replacement Date1</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let v of variants; let vi = index" style="border-bottom:1px solid #f3f4f6;" [style.background]="(v.isReplacement || v.checked) ? '#f3f4f6' : (v.needsReplacement ? '#fff7ed' : '')" [style.opacity]="(v.isReplacement || v.checked) ? '0.6' : '1'" [style.pointerEvents]="(v.isReplacement || v.checked) ? 'none' : 'auto'">
                      <td style="padding:8px;">{{ v.description ?? '-' }}</td>
                      <td style="padding:8px; width:260px;">
                        <mat-form-field appearance="fill" style="width:220px;">
                          <input matInput [matDatepicker]="picker" placeholder="dd/MM/yyyy" [(ngModel)]="v._expiryDateObj" (dateChange)="onVariantExpiryChanged(vi, $event)" [disabled]="v.isReplacement || v.checked" />
                          <mat-datepicker-toggle *ngIf="!v.isReplacement && !v.checked" matSuffix [for]="picker"></mat-datepicker-toggle>
                          <mat-datepicker #picker></mat-datepicker>
                        </mat-form-field>
                      </td>
                      <td style="padding:8px;">{{ v.replacementDate }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ng-container>
            <ng-template #singleExpiry>
              <mat-form-field appearance="fill" style="margin-top:10px; width:320px;">
                <mat-label>New Expiry Date</mat-label>
                <input matInput [matDatepicker]="expiryPicker" placeholder="dd/MM/yyyy" [(ngModel)]="expiryDateObj" (dateChange)="onExpiryChanged($event)" />
                <mat-datepicker-toggle matSuffix [for]="expiryPicker"></mat-datepicker-toggle>
                <mat-datepicker #expiryPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="fill" style="width:320px;">
                <mat-label>Replacement Date</mat-label>
                <input matInput [value]="replacementDateString" disabled />
              </mat-form-field>
            </ng-template>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `
})
export class ReplaceDialogComponent {
  expiryDateObj: Date | null = null;
  replacementDateString: string = '';
  variants: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<ReplaceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // initialize expiry date object from existing item expiry (expecting dd/MM/yyyy)
    const src = (data && data.item) ? data.item : data;
    const d = (src && (src as any).expiryDate) ? (src as any).expiryDate : null;
    this.expiryDateObj = parseAnyDate(d);
    this.replacementDateString = formatDDMMYYYY(new Date()) || '';

    // prepare per-variant state when present
    const vs = Array.isArray((src as any).variants) ? (src as any).variants : (Array.isArray((src as any).items) ? (src as any).items : undefined);
    if (Array.isArray(vs) && vs.length) {
      const today = this.replacementDateString;
      this.variants = vs.map((v: any) => {
        const expiry = v.expiryDate ?? (Array.isArray(v.expiryDates) ? v.expiryDates[0] : null) ?? null;
        return {
          ...v,
          // ensure `description` is present (some data uses `description` for size)
          description: v.description ?? v.size ?? v.unit ?? null,
          expiryDate: expiry,
          _expiryDateObj: parseAnyDate(expiry),
          replacementDate: v.replacementDate ?? today,
          // Treat any variant that is NOT greyed (not already replaced and not checked)
          // as needing replacement so the dialog highlights it for attention.
          needsReplacement: !!v.needsReplacement || (!(v.isReplacement || v.checked))
        };
      });
    }
  }

  // Use shared helper to parse dates (accepts Date or dd/MM/yyyy)
  private parseToDate(s: any): Date | null { return parseAnyDate(s); }

  public formatDate(date: Date | null): string | null { return formatDDMMYYYY(date); }

  onVariantExpiryChanged(index: number, event: any) {
    const v = this.variants[index];
    if (v && v.isReplacement) return;
    const val = event && event.value ? event.value : null;
    v._expiryDateObj = val;
    v.expiryDate = this.formatDate(v._expiryDateObj);
  }

  onExpiryChanged(event: any) {
    this.expiryDateObj = event && event.value ? event.value : null;
  }

  hasVariants(): boolean {
    return Array.isArray(this.variants) && this.variants.length > 0;
  }
  save() {
    if (this.hasVariants()) {
      const out = this.variants.map(v => {
        const expiryDate = this.formatDate(v._expiryDateObj);
        const orig = v.expiryDate ?? null;
        const isReplacement = !!expiryDate && expiryDate !== orig;
        return { ...v, expiryDate, replacementDate: isReplacement ? (v.replacementDate ?? this.replacementDateString) : v.replacementDate, isReplacement };
      });
      this.dialogRef.close({ items: out });
      return;
    }
    const expiry = this.formatDate(this.expiryDateObj);
    const isReplacement = !!expiry && expiry !== ((this.data.item as any)?.expiryDate ?? null);
    this.dialogRef.close({ expiryDate: expiry, replacementDate: isReplacement ? this.replacementDateString : (this.data.item as any)?.replacementDate ?? this.replacementDateString, isReplacement });
  }

  public onClose() {
    this.dialogRef.close();
  }

}
