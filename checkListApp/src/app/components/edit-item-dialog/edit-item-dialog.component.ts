import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { parseAnyDate, formatDDMMYYYY } from '../../utils/date-utils';
// Use runtime `any` for dialog data to avoid coupling to the static `Item` model

@Component({
  selector: 'app-edit-item-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <div style="display:flex; align-items:center; gap:8px;">
      <h2 mat-dialog-title style="margin:0;">Edit Item</h2>
      <button mat-icon-button aria-label="Close dialog" style="margin-left:auto;" (click)="close()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content style="max-height:60vh; overflow:auto; padding:8px; box-sizing:border-box;">
      <div style="display:flex; flex-direction:column; gap:12px;">
        <mat-form-field appearance="fill">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="name" disabled/>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Expiry Date</mat-label>
          <input matInput [matDatepicker]="picker" placeholder="dd/MM/yyyy" [(ngModel)]="expiryDateObj" />
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Quantity</mat-label>
          <input matInput type="number" min="0" [(ngModel)]="quantity" />
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="close()" class="eid-cancel-btn">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [
    `.eid-cancel-btn {
      min-width: 128px;
      font-weight: 800;
      border-width: 2px;
      border-color: var(--color-primary-600);
      color: var(--color-primary-700);
      background: var(--bg-pale);
      box-shadow: var(--shadow-md);
      animation: eid-pop 1.15s ease-in-out infinite alternate;
      transition: transform .16s ease, box-shadow .16s ease;
    }
    .eid-cancel-btn:hover {
      transform: translateY(-1px) scale(1.04);
      box-shadow: var(--shadow-md);
    }
    @keyframes eid-pop {
      from { transform: scale(1); }
      to { transform: scale(1.03); }
    }
    `
  ]
})
export class EditItemDialogComponent {
  name: string;
  expiryDate: string | Date | null;
  expiryDateObj: Date | null;
  expiryDateString: string | null;
  quantity: number | null;

  constructor(private dialogRef: MatDialogRef<EditItemDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    const item = (this.data && this.data.item) ? this.data.item : this.data;
    this.name = item?.name ?? '';
    this.expiryDate = item?.expiryDate ?? null;
    this.expiryDateObj = parseAnyDate(this.expiryDate);
    this.expiryDateString = this.expiryDateObj ? formatDDMMYYYY(this.expiryDateObj) : (typeof this.expiryDate === 'string' ? this.expiryDate : null);
    this.quantity = item?.controlQuantity ?? null;
  }

  save() {
    // return the dd/MM/yyyy string (use adapter/format helper)
    const expiryStr = this.expiryDateObj ? formatDDMMYYYY(this.expiryDateObj) : null;
    this.dialogRef.close({ name: this.name, expiryDate: expiryStr, controlQuantity: this.quantity });
  }

  close() {
    this.dialogRef.close();
  }

}
