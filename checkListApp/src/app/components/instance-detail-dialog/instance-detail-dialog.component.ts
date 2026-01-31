import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-instance-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h3 mat-dialog-title>Item details</h3>
    <div mat-dialog-content>
      <p><strong>Name:</strong> {{ data?.name || '—' }}</p>
      <p><strong>Category:</strong> {{ data?.category || '—' }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </div>
  `
})
export class InstanceDetailDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<InstanceDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { name?: string; category?: string }
  ) {}

  close() {
    this.dialogRef.close();
  }
}
