import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { parseAnyDate, parseDDMMYYYY, formatDDMMYYYY, isBeforeToday } from '../../utils/date-utils';
import { Item } from '../../models/item';
// Use runtime `any` for items to match inventory JSON shape

@Component({
  selector: 'app-details-dialog',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDialogModule, MatDividerModule, MatIconModule],
  template: `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px;">
      <h2 style="margin:0">
        <ng-container *ngIf="hasType(); else singleTitle">
          <ng-container [ngSwitch]="getType()">
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

    <div style="max-height:70vh; overflow:auto; padding:var(--space-sm); box-sizing:border-box;">
      <div *ngIf="getItems(); else singleView">
      <div style="display:flex; flex-direction:column; gap:10px;">
        <mat-card *ngFor="let item of getItems()" style="padding:var(--space-md);">
          <mat-card-title style="font-weight:700;">{{item.name}}</mat-card-title>
          <mat-card-subtitle>{{item.category}}</mat-card-subtitle>
          <mat-card-content style="margin-top:var(--space-sm); color:var(--color-subtle);">
            <div *ngIf="item.replacementDate">Replaced: {{ formatDateString(item.replacementDate) }}</div>
            <div>Status: <strong>{{ getDisplayStatus(item) }}</strong></div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <ng-template #singleView>
      <mat-card>
        <mat-card-subtitle style="padding:var(--space-md);">{{ getItem()?.category }}</mat-card-subtitle>
        <mat-card-title style="padding:var(--space-md);">{{ getItem()?.name }}</mat-card-title>
        <mat-card-content style="margin-top:var(--space-sm);">
          <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:8px;">
          <div style="font-size:12px;color:var(--color-muted)">Status:</div>
          <div [style.color]="getStatusColor(getItem())" style="font-weight: 700;">
            {{ getDisplayStatus(getItem()) }}
          </div>
            <div>
              <div style="font-size:12px;color:var(--color-muted)">Checked:</div>
              <div style="font-weight:700; color:#6b21a8">{{ getItem()?.checked ? 'Yes' : 'No' }}</div>
            </div>  
            <div>
              <div style="font-size:12px;color:var(--color-muted)">Expiry Date:</div>
              <div style="font-weight:700; color:var(--color-warning)">
                  {{ formatDateString(getItem()?.expiryDate) }} <span *ngIf="isExpired(getItem()?.expiryDate ?? null)" style="color:var(--color-danger); font-weight:700">(EXPIRED)</span>
                </div>
            </div>
            <div>
              <div style="font-size:12px;color:var(--color-muted)">Last Replacement:</div>
              <div style="font-weight:700; color:var(--color-success)">{{ formatDateString(getItem()?.replacementDate) || 'Never' }}</div>
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
  constructor(@Inject(MAT_DIALOG_DATA) public data: Item | { items?: Item[]; type?: string }) {}

  // Helpers to safely access union-shaped `data` from the template
  getItems(): Item[] | undefined {
    const d = this.data as any;
    return Array.isArray(d?.items) ? d.items as Item[] : undefined;
  }

  hasType(): boolean {
    return !!(this.data as any)?.type;
  }

  getType(): string | undefined {
    return (this.data as any)?.type;
  }

  getItem(): Item | null {
    // If `data` has an `items` array we treat it as the list view
    if (Array.isArray((this.data as any)?.items)) return null;
    return this.data as Item;
  }

  isExpired(date: string | Date | null | undefined): boolean {
    return isBeforeToday(date);
  }

  private parseDate(dateString: string | Date | null | undefined): Date | null {
    return parseAnyDate(dateString);
  }

  public formatDateString(date: string | Date | null | undefined): string | null {
    // Use shared helpers to parse any incoming date shape and format strictly as dd/MM/yyyy
    const parsed = parseAnyDate(date);
    return formatDDMMYYYY(parsed);
  }

  getDisplayStatus(item: Item | null | undefined): string {
    // Check if the item is expired
    if (item?.expiryDate && this.isExpired(item.expiryDate)) {
      return 'expired';
    }
    // If the item is not checked, show "pending"
    if (!item?.checked) {
      return 'pending';
    }
    // Otherwise show the actual status
    return item.status || 'unknown';
  }

  countAvailable(items: Item[] = []): number {
    return items.filter(i => {
      const s = this.getDisplayStatus(i);
      return !['depleted', 'expired', 'pending'].includes(s);
    }).length;
  }

  countUnavailable(items: Item[] = []): number {
    return items.filter(i => {
      const s = this.getDisplayStatus(i);
      return ['depleted', 'expired', 'pending'].includes(s);
    }).length;
  }

  getStatusColor(item: Item | null | undefined): string {
    const s = this.getDisplayStatus(item);
    const map: Record<string, string> = {
      'pending': 'var(--color-warning)',
      'expired': 'var(--color-danger)',
      'depleted': 'var(--color-danger)',
      'insufficient': 'var(--color-warning)',
      'satisfactory': 'var(--color-success)',
      'excessive': 'var(--color-primary)'
    };
    return map[s] || 'var(--color-muted)';
  }
}
