import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface SignatureDialogData {
  image: string;
  user: string;
  purpose: string;
  date: string;
}

@Component({
  selector: 'dsv-signature-view-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Signature Preview</h2>
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
      <button mat-stroked-button (click)="close()">Close</button>
    </div>
  `,
  styles: [
    `
      .content { display: grid; grid-template-columns: 1fr; gap: var(--space-md); }
      .image-wrap { display: flex; align-items: center; justify-content: center; background: var(--bg-pale); border: 1px solid var(--color-border); padding: var(--space-md); }
      .image-wrap img { max-width: 100%; height: auto; }
      .meta p { margin: 0; color: var(--color-muted); }
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
