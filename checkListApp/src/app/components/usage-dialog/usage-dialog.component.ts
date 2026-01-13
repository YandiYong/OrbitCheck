import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Item } from '../../models/item';

@Component({
  selector: 'app-usage-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Record Usage</h2>
    <mat-dialog-content style="max-height:50vh; overflow:auto; padding:8px; box-sizing:border-box;">
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="font-weight:700;">{{ data.item.name }}</div>
        <div style="color:#6b7280; font-size:0.95rem;">Available: {{ data.item.quantity ?? 0 }}</div>

        <mat-form-field appearance="fill">
          <mat-label>Quantity used today</mat-label>
          <input matInput type="number" min="0" [max]="data.item.quantity ?? 0" [(ngModel)]="used" />
        </mat-form-field>

        <div *ngIf="error" style="color:#b91c1c">{{ error }}</div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()">Save</button>
    </mat-dialog-actions>
  `
})
export class UsageDialogComponent {
  used: number = 0;
  error: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<UsageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item: Item }
  ) {
    this.used = 0;
  }

  save() {
    const q = this.data.item.quantity ?? 0;
    if (this.used == null || isNaN(this.used) || this.used < 0) {
      this.error = 'Enter a valid number.';
      return;
    }
    if (this.used > q) {
      this.error = `Cannot use more than available (${q}).`;
      return;
    }
    this.dialogRef.close({ used: this.used });
  }

  close() {
    this.dialogRef.close();
  }
}
