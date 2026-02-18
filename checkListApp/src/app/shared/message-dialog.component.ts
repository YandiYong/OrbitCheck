import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface MessageDialogData {
  title?: string;
  message?: string;
  buttonText?: string;
  result?: string;
  cancelButtonText?: string;
  cancelResult?: string;
}

@Component({
  selector: 'app-message-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="md-header">
      <h2 mat-dialog-title class="md-title">{{ data?.title || 'Message' }}</h2>
      <button mat-icon-button aria-label="Close dialog" class="md-close-btn" (click)="cancel()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content class="md-content">
      <p class="md-message">{{ data?.message || '' }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="md-actions">
      <button *ngIf="data?.cancelButtonText" cdkFocusInitial mat-stroked-button class="md-btn md-btn-secondary" (click)="cancel()">{{ data?.cancelButtonText }}</button>
      <button mat-flat-button color="primary" class="md-btn" (click)="close()">{{ data?.buttonText || 'OK' }}</button>
    </mat-dialog-actions>
  `,
  styles: [
    `:host {
      display: block;
      font-family: 'Roboto', 'Helvetica', Arial, sans-serif;
    }
    .md-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-text);
      letter-spacing: 0.01em;
    }
    .md-header {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
    }
    .md-close-btn {
      margin-left: auto;
      color: var(--color-subtle);
    }
    .md-content {
      padding-top: var(--space-xs);
    }
    .md-message {
      margin: 0;
      padding: var(--space-md);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-surface-3);
      border-left: 4px solid var(--color-primary);
      background: var(--bg-info);
      color: var(--color-text);
      line-height: 1.45;
      box-shadow: var(--shadow-sm);
    }
    .md-actions {
      padding-top: var(--space-sm);
    }
    .md-btn {
      min-width: 120px;
      box-shadow: var(--shadow-sm);
      transition: transform .16s ease, box-shadow .16s ease;
    }
    .md-btn:hover {
      transform: translateY(-1px) scale(1.02);
    }
    .md-btn:focus-visible {
      outline: 2px solid var(--color-primary-600);
      outline-offset: 2px;
    }
    .md-btn-secondary {
      min-width: 128px;
      border-color: var(--color-primary-600);
      color: var(--color-primary-700);
      background: var(--bg-pale);
      font-weight: 800;
      box-shadow: var(--shadow-md);
      animation: md-pop 1.15s ease-in-out infinite alternate;
    }
    .md-btn-secondary:hover {
      transform: translateY(-1px) scale(1.04);
      box-shadow: var(--shadow-md);
    }
    @keyframes md-pop {
      from { transform: scale(1); }
      to { transform: scale(1.03); }
    }
    `
  ]
})
export class MessageDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<MessageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MessageDialogData
  ) {}

  close() {
    this.dialogRef.close(this.data?.result ?? true);
  }

  cancel() {
    this.dialogRef.close(this.data?.cancelResult ?? 'cancel');
  }
}
