import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { parseAnyDate, parseDDMMYYYY, formatDDMMYYYY, isBeforeToday } from '../../utils/date-utils';
import { StatusColorPipe } from '../../shared/status-color.pipe';
// Use runtime `any` for items to match inventory JSON shape

@Component({
  selector: 'app-details-dialog',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDialogModule, MatDividerModule, MatIconModule, StatusColorPipe],
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
      <button mat-icon-button mat-dialog-close aria-label="Close dialog" style="margin-left:auto;"><mat-icon>close</mat-icon></button>
    </div>

    <mat-divider style="margin:12px 0"></mat-divider>

    <div style="max-height:70vh; overflow:auto; padding:var(--space-sm); box-sizing:border-box;">
      <div *ngIf="getItems(); else singleView">
      <div style="display:flex; flex-direction:column; gap:10px;">
          <mat-card *ngFor="let item of getItems()" style="padding:var(--space-md); border-left:6px solid var(--color-primary-600); background:var(--color-surface); box-shadow:var(--card-shadow); border-radius:var(--radius-sm);">
            <mat-card-title style="font-weight:800; font-size:1.18rem; color:var(--color-primary-600);">{{ (item.description && item.description !== '-' ? item.description : (item.name || ('Variant ' + (item.id ?? '')))) }}</mat-card-title>
            <mat-card-content style="margin-top:var(--space-sm); color:var(--color-subtle);">
              <ng-container *ngIf="isArray(item.items) && item.items.length; else topLevelInfo">
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <mat-card *ngFor="let v of item.items" style="padding:14px; border-left:6px solid var(--color-primary); background:var(--color-surface); border-radius:var(--radius-sm); box-shadow:var(--card-shadow);">
                    <mat-card-title style="font-weight:900; font-size:1.36rem; color:var(--color-primary-600); letter-spacing:0.2px;">
                      {{ (v.description && v.description !== '-') ? v.description : (v.name || ('Variant ' + (v.id ?? '')) ) }}
                    </mat-card-title>
                    <mat-card-content style="margin-top:10px; display:flex; gap:16px; align-items:center; font-size:1.04rem; color:var(--color-text);">
                      <div style="font-weight:700; color:var(--color-muted); font-size:0.98rem;">Expiry:</div>
                      <div style="font-weight:900; color:var(--color-warning); font-size:1.04rem;">{{ formatDateString(v.expiryDate) || '-' }}</div>
                      <div *ngIf="v.replacementDate" style="font-weight:800; color:var(--color-success); background:var(--bg-success); padding:6px 10px; border-radius:8px;">Replaced: {{ formatDateString(v.replacementDate) }}</div>
                      <div style="margin-left:auto; font-weight:900; padding:6px 10px; border-radius:8px;" [style.color]="v | statusColor">{{ getDisplayStatus(v) }}</div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </ng-container>
              <ng-template #topLevelInfo>
                <div style="display:flex; gap:12px; align-items:center; padding:6px 0;">
                  <div style="font-weight:700; color:var(--color-muted);">Expiry:</div>
                  <div style="font-weight:900; color:var(--color-warning);">{{ formatDateString(item.expiryDate) || '-' }}</div>
                  <div *ngIf="item.replacementDate" style="margin-left:12px; font-weight:700; color:var(--color-success);">Replaced: {{ formatDateString(item.replacementDate) }}</div>
                  <div style="margin-left:auto; font-weight:900;" [style.color]="item | statusColor">{{ getDisplayStatus(item) }}</div>
                </div>
              </ng-template>
            </mat-card-content>
          </mat-card>
      </div>
    </div>

    <ng-template #singleView>
      <mat-card>
        
        <mat-card-title style="padding:var(--space-md); font-size:1.4rem; font-weight:900; color:var(--color-primary-600);">{{ (getItem()?.description && getItem()?.description !== '-' ? getItem()?.description : (getItem()?.name || '')) }}</mat-card-title>
        
        <mat-card-content style="margin-top:var(--space-sm);">
          <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:12px; align-items:center;">
          <div style="font-size:0.98rem;color:var(--color-muted); font-weight:700">Status:</div>
          <div [style.color]="getItem() | statusColor" style="font-weight: 900; font-size:1.06rem;">
            {{ getDisplayStatus(getItem()) }}
          </div>
            <div>
              <div style="font-size:0.98rem;color:var(--color-muted); font-weight:700">Checked:</div>
              <div style="font-weight:800; color:#6b21a8; font-size:1.02rem">{{ getItem()?.checked ? 'Yes' : 'No' }}</div>
            </div>  
            <div>
              <div style="font-size:0.98rem;color:var(--color-muted); font-weight:700">Expiry Date:</div>
              <div style="font-weight:900; color:var(--color-warning); font-size:1.02rem">
                  {{ formatDateString(getItem()?.expiryDate) }} <span *ngIf="isExpired(getItem()?.expiryDate ?? null)" style="color:var(--color-danger); font-weight:900">(EXPIRED)</span>
                </div>
            </div>
            <div>
              <div style="font-size:0.98rem;color:var(--color-muted); font-weight:700">Last Replacement:</div>
              <div style="font-weight:800; color:var(--color-success); font-size:1.02rem">{{ formatDateString(getItem()?.replacementDate) || 'Never' }}</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </ng-template>

    <mat-dialog-actions align="end" style="margin-top:12px;">
      <button mat-stroked-button mat-dialog-close class="dd-close-btn">Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `.dd-close-btn {
      min-width: 128px;
      font-weight: 800;
      border-width: 2px;
      border-color: var(--color-primary-600);
      color: var(--color-primary-700);
      background: var(--bg-pale);
      box-shadow: var(--shadow-md);
      animation: dd-pop 1.15s ease-in-out infinite alternate;
      transition: transform .16s ease, box-shadow .16s ease;
    }
    .dd-close-btn:hover {
      transform: translateY(-1px) scale(1.04);
      box-shadow: var(--shadow-md);
    }
    @keyframes dd-pop {
      from { transform: scale(1); }
      to { transform: scale(1.03); }
    }
    `
  ]
})
export class DetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  // Helpers to safely access union-shaped `data` from the template
  getItems(): any[] | undefined {
    const d = this.data as any;
    return Array.isArray(d?.items) ? d.items as any[] : undefined;
  }

  hasType(): boolean {
    return !!(this.data as any)?.type;
  }

  getType(): string | undefined {
    return (this.data as any)?.type;
  }

  getItem(): any | null {
    // If `data` has an `items` array we treat it as the list view
    if (Array.isArray((this.data as any)?.items)) return null;
    return this.data as any;
  }

  // Expose Array.isArray to the template to satisfy Angular's template type checking
  isArray(v: any): boolean { return Array.isArray(v); }

  isExpired(date: string | Date | null | undefined): boolean {
    return isBeforeToday(date);
  }

  public formatDateString(date: string | Date | null | undefined): string | null {
    // Use shared helpers to parse any incoming date shape and format strictly as dd/MM/yyyy
    const parsed = parseAnyDate(date);
    return formatDDMMYYYY(parsed);
  }

  getDisplayStatus(item: any | null | undefined): string {
    // Check if the item is expired
    if (item?.expiryDate && this.isExpired(item.expiryDate)) {
      return 'expired';
    }
    // If the item is not checked, show "pending"
    if (!item?.checked) {
      return 'pending';
    }
    // Otherwise show the actual status
    return item?.status || 'unknown';
  }

  countAvailable(items: any[] = []): number {
    return items.filter(i => {
      const s = this.getDisplayStatus(i);
      return !['depleted', 'expired', 'pending'].includes(s);
    }).length;
  }

  countUnavailable(items: any[] = []): number {
    return items.filter(i => {
      const s = this.getDisplayStatus(i);
      return ['depleted', 'expired', 'pending'].includes(s);
    }).length;
  }

  
}
