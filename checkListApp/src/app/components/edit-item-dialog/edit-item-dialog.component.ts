import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Item } from '../../models/item';

@Component({
  selector: 'app-edit-item-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <h2 mat-dialog-title>Edit Item</h2>
    <mat-dialog-content style="max-height:60vh; overflow:auto; padding:8px; box-sizing:border-box;">
      <div style="display:flex; flex-direction:column; gap:12px;">
        <mat-form-field appearance="fill">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="name" disabled/>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Expiry Date</mat-label>
          <input matInput placeholder="dd/MM/yyyy" [(ngModel)]="expiryDateString" />
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Quantity</mat-label>
          <input matInput type="number" min="0" [(ngModel)]="quantity" />
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `
})
export class EditItemDialogComponent {
  name: string;
  expiryDate: string | null;
  expiryDateString: string | null;
  quantity: number | null;

  constructor(private dialogRef: MatDialogRef<EditItemDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { item: Item }) 
  {
    this.name = data.item.name ?? '';
    this.expiryDate = data.item.expiryDate ?? null;
    this.expiryDateString = this.normalizeToDdMmYyyy(this.expiryDate);
    this.quantity = data.item.controlQuantity ?? null;
  }

  save() {
    // return the dd/MM/yyyy string
    this.dialogRef.close({ name: this.name, expiryDate: this.expiryDateString, controlQuantity: this.quantity });
  }

  close() {
    this.dialogRef.close();
  }

  private normalizeToDdMmYyyy(dateStr: string | null): string | null {
    if (!dateStr) return null;
    // if ISO format YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
    if (dateStr.indexOf('-') >= 0) {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    // assume already dd/MM/yyyy
    return dateStr;
  }
}
