import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Item } from '../../models/item';

@Component({
  selector: 'app-replace-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>Replace Item</h2>
    <mat-dialog-content style="max-height:60vh; overflow:auto; padding:8px; box-sizing:border-box;">
      <div style="display:flex; flex-direction:column; gap:12px; width:100%; margin-top:8px;">
        <mat-form-field appearance="fill">
          <mat-label>Item Name</mat-label>
          <input matInput [value]="data.item.name" disabled />
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Replacement Quantity</mat-label>
          <input matInput type="number" min="0" [(ngModel)]="quantity" />
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>New Expiry Date</mat-label>
          <input matInput placeholder="dd/MM/yyyy" [(ngModel)]="expiryDateString" />
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Replacement Date</mat-label>
          <input matInput placeholder="dd/MM/yyyy" [(ngModel)]="replacementDateString" />
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `
})
export class ReplaceDialogComponent {
  expiryDateString: string = '';
  replacementDateString: string = '';
  quantity: number | null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ReplaceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item: Item }
  ) {
    this.expiryDateString = data.item.expiryDate || '';
    this.replacementDateString = this.formatDate(new Date());
    this.quantity = data.item.quantity ?? 0;
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  save() {
    if (!this.expiryDateString || !this.replacementDateString) {
      return;
    }
    this.dialogRef.close({ expiryDate: this.expiryDateString, replacementDate: this.replacementDateString, quantity: this.quantity });
  }

  close() {
    this.dialogRef.close();
  }
}
