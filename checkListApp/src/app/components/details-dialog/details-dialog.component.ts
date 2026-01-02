import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Item } from '../../models/item';

@Component({
  selector: 'app-details-dialog',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDialogModule, MatDividerModule, MatIconModule],
  template: `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h2 style="margin:0">
        <ng-container *ngIf="data?.type; else singleTitle">
          <ng-container [ngSwitch]="data.type">
            <span *ngSwitchCase="'expiring'">Items Expiring Soon</span>
            <span *ngSwitchCase="'replaced'">Replaced This Month</span>
            <span *ngSwitchCase="'checklist'">Daily Checklist</span>
            <span *ngSwitchDefault>Details</span>
          </ng-container>
        </ng-container>
        <ng-template #singleTitle>Item Details</ng-template>
      </h2>
    </div>

    <mat-divider style="margin:12px 0"></mat-divider>

    <div *ngIf="data?.items; else singleView">
      <div *ngIf="data.type === 'checklist'" style="display:flex; gap:12px; margin-bottom:12px;">
        <mat-card style="flex:1; background:#ecfdf5; border-left:4px solid #16a34a;">
          <mat-card-title>Available</mat-card-title>
          <mat-card-content>
            {{ countAvailable(data.items) }}
          </mat-card-content>
        </mat-card>
        <mat-card style="flex:1; background:#fff1f2; border-left:4px solid #ef4444;">
          <mat-card-title>Not Available</mat-card-title>
          <mat-card-content>
            {{ countUnavailable(data.items) }}
          </mat-card-content>
        </mat-card>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px;">
        <mat-card *ngFor="let item of data.items" style="padding:12px;">
          <mat-card-title style="font-weight:700">{{item.name}}</mat-card-title>
          <mat-card-subtitle>{{item.category}}</mat-card-subtitle>
          <mat-card-content style="margin-top:8px; color:#374151;">
            <div>Expiry: {{item.expiryDate}} <span *ngIf="isExpired(item.expiryDate)" style="color:#b91c1c">(EXPIRED)</span></div>
            <div *ngIf="item.replacementDate">Replaced: {{item.replacementDate}}</div>
            <div>Status: <strong>{{item.status}}</strong></div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <ng-template #singleView>
      <mat-card>
        <mat-card-title>{{data?.name}}</mat-card-title>
        <mat-card-subtitle>{{data?.category}}</mat-card-subtitle>
        <mat-card-content style="margin-top:8px;">
          <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:8px;">
            <div>
              <div style="font-size:12px;color:#6b7280">Status</div>
              <div style="font-weight:700; color:{{isExpired(data?.expiryDate) || data?.status === 'unavailable' ? '#b91c1c' : '#16a34a'}}">
                {{ data?.status === 'unavailable' ? 'Not Available' : 'Available' }}
              </div>
            </div>
            <div>
              <div style="font-size:12px;color:#6b7280">Checked</div>
              <div style="font-weight:700; color:#6b21a8">{{ data?.checked ? 'Yes' : 'No' }}</div>
            </div>
            <div>
              <div style="font-size:12px;color:#6b7280">Expiry Date</div>
              <div style="font-weight:700; color:#f97316">
                {{ data?.expiryDate }} <span *ngIf="isExpired(data?.expiryDate)" style="color:#b91c1c; font-weight:700">(EXPIRED)</span>
              </div>
            </div>
            <div>
              <div style="font-size:12px;color:#6b7280">Last Replacement</div>
              <div style="font-weight:700; color:#16a34a">{{ data?.replacementDate || 'Never' }}</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </ng-template>

    <mat-dialog-actions align="end" style="margin-top:12px;">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `
})
export class DetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  isExpired(date?: string | null) {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  countAvailable(items: Item[]) {
    return items.filter(i => i.status === 'available').length;
  }

  countUnavailable(items: Item[]) {
    return items.filter(i => i.status === 'unavailable').length;
  }
}
