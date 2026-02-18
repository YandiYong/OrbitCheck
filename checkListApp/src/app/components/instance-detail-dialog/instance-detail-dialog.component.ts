import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-instance-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div style="display:flex; align-items:center; gap:8px;">
      <h3 mat-dialog-title style="margin:0;">Item details</h3>
      <button mat-icon-button aria-label="Close dialog" style="margin-left:auto;" (click)="close()"><mat-icon>close</mat-icon></button>
    </div>
    <div mat-dialog-content>
      <p><strong>Name:</strong> {{ data?.name || '—' }}</p>
      <p><strong>Category:</strong> {{ data?.category || '—' }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button (click)="close()" class="id-close-btn">Close</button>
    </div>
  `,
  styles: [
    `.id-close-btn {
      min-width: 128px;
      font-weight: 800;
      border-width: 2px;
      border-color: var(--color-primary-600);
      color: var(--color-primary-700);
      background: var(--bg-pale);
      box-shadow: var(--shadow-md);
      animation: id-pop 1.15s ease-in-out infinite alternate;
      transition: transform .16s ease, box-shadow .16s ease;
    }
    .id-close-btn:hover {
      transform: translateY(-1px) scale(1.04);
      box-shadow: var(--shadow-md);
    }
    @keyframes id-pop {
      from { transform: scale(1); }
      to { transform: scale(1.03); }
    }
    `
  ]
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
