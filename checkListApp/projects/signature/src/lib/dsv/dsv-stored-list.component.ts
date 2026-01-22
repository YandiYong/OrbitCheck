import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SignatureViewDialogComponent } from './signature-view-dialog.component';
import { DsvStore } from './dsv.store';

@Component({
  selector: 'dsv-stored-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <mat-card class="panel">
      <div class="panel-head">
        <h2 class="panel-title">Stored Signatures</h2>
       
      </div>
      <div class="list" *ngIf="store.signatures().length > 0; else empty">
        <div class="item" *ngFor="let sig of store.signatures()">
          <mat-card class="item-card">
            <div class="preview">
              <img *ngIf="sig.image?.startsWith('data:')" [src]="sig.image" alt="Signature" />
              <span *ngIf="!sig.image?.startsWith('data:')" class="placeholder">Your Signature</span>
            </div>
            <div class="meta">
              <p><strong>Signed by:</strong> {{ sig.user }}</p>
              <p><strong>Signed for:</strong> {{ sig.signedFor }}</p>
              <p><strong>Purpose:</strong> {{ sig.purpose }}</p>
              <p><strong>Date:</strong> {{ sig.date | date:'dd/MM/yyyy HH:mm ' }}</p>
            </div>
            <div class="actions">
              <button mat-raised-button color="primary" (click)="view(sig)"><mat-icon>visibility</mat-icon> View</button>
            </div>
          </mat-card>
        </div>
      </div>
      <ng-template #empty>
        <p class="empty">No signatures saved yet</p>
      </ng-template>
    </mat-card>
  `,
  styles: [
    `
      .panel { padding: 16px; }
      .panel-title { font-weight: 700; }
      .panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
      .panel-actions { display: flex; gap: 8px; }
      .list { display: flex; flex-direction: column; gap: 12px; max-height: 384px; overflow: auto; }
      .item-card { padding: 12px; display: grid; grid-template-columns: 200px 1fr auto; align-items: center; gap: 12px; }
      .preview { display: flex; align-items: center; justify-content: center; min-height: 80px; background: #fafafa; border: 1px solid #e0e0e0; }
      .preview img { max-width: 100%; max-height: 64px; }
      .placeholder { color: #aaa; font-style: italic; }
      .meta p { margin: 0; color: #555; }
      .actions { display: flex; justify-content: flex-end; }
      .empty { color: #777; text-align: center; padding: 24px; }
    `,
  ],
})
export class DsvStoredListComponent {
  // Inject store for data and dialog for previewing signatures
  constructor(public store: DsvStore, private dialog: MatDialog) {}

  // Open a dialog to view a larger preview of the signature
  view(sig: { image: string; user: string; purpose: string; date: string }) {
    this.dialog.open(SignatureViewDialogComponent, {
      data: {
        image: sig.image,
        user: sig.user,
        purpose: sig.purpose,
        date: sig.date,
      },
      width: '720px',
      maxWidth: '90vw',
    });
  }

  // Download the current signatures as a JSON file (backend-ready schema)
  exportJson() {
    const blob = this.store.exportAsJson();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signatures.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}
