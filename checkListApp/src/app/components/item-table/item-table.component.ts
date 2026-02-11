import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { isBeforeToday } from '../../utils/date-utils';

@Component({
  selector: 'app-item-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, MatCardModule, MatMenuModule],
  template: `
    <table mat-table [dataSource]="computedItems" style="width:100%;" class="mat-elevation-z1 full-table">
      <!-- Status Column -->
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:var(--space-lg);">Status</th>
          <td mat-cell *matCellDef="let row" style="padding:var(--space-lg);">
          <div [style.cursor]="row.expired ? 'not-allowed' : 'pointer'" style="display:flex; align-items:center; gap:14px;"
             role="button" tabindex="0"
             (click)="onToggle(row.item, $event)"
             (mousedown)="onToggle(row.item, $event)"
             (keydown.enter)="onToggle(row.item, $event)"
             (keydown.space)="onToggle(row.item, $event)">
            <div [ngStyle]="row.checkboxStyle" style="width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; border:2px solid var(--color-border);">
              <mat-icon *ngIf="row.expired" style="opacity:0.5; color:var(--color-danger);">block</mat-icon>
              <mat-icon *ngIf="!row.expired && row.item.checked && row.item.status === 'satisfactory'" style="color:var(--color-success);">check_circle</mat-icon>
              <mat-icon *ngIf="!row.expired && row.item.checked && row.item.status === 'insufficient'" style="color:var(--color-warning);">warning</mat-icon>
              <mat-icon *ngIf="!row.expired && row.item.checked && row.item.status === 'excessive'" style="color:var(--color-info);">add_circle</mat-icon>
              <mat-icon *ngIf="!row.expired && row.item.checked && row.item.status === 'depleted'" style="color:var(--color-danger);">remove_circle</mat-icon>
            </div>
            <div>
              <div *ngIf="row.statusLabel" [style.color]="row.statusColor" style="font-weight:700;">
                {{ row.statusLabel }}
              </div>
            </div>
          </div>
        </td>
      </ng-container>

      <!-- Item Column -->
      <ng-container matColumnDef="item">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:var(--space-lg);">Item</th>
        <td mat-cell *matCellDef="let row" style="padding:var(--space-lg);">
          <div style="display:flex; gap:12px; align-items:center;">
            <div style="width:56px; height:56px; border-radius:10px; display:flex; align-items:center; justify-content:center; background:var(--bg-pale);">
              <mat-icon>{{ row.categoryIcon }}</mat-icon>
            </div>
            <div>
              <div style="font-weight:700; color:var(--color-text);">{{row.item.name}}</div>
              <div style="color:var(--color-muted); font-size:0.9rem;">
                <ng-container *ngIf="(row.item.controlQuantity ?? 0) > 1; else singleExpiry">
                  {{ row.expiredCount }} expired
                </ng-container>
                <ng-template #singleExpiry>
                  <div style="display:flex; gap:var(--space-sm); align-items:center;">
                    <div style="font-weight:600;">Expires:</div>
                    <div style="color:var(--color-danger); font-weight:700;">{{ row.expiryDisplay }}</div>
                    <div *ngIf="row.expired" style="background:var(--bg-danger); color:var(--color-danger); padding:4px 8px; border-radius:6px; font-weight:700;">EXPIRED</div>
                  </div>
                </ng-template>
              </div>
              <div *ngIf="row.item.syringes" style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
                <div *ngFor="let s of row.item.syringes; let i = index" style="display:flex; align-items:center; gap:8px;">
                  <div (click)="row.expired ? null : toggleSubitem.emit({ itemId: row.item.id, index: i })" [style.cursor]="row.expired ? 'not-allowed' : 'pointer'" style="width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; border:2px solid var(--color-border);" [ngStyle]="{ background: s.checked ? (s.available ? 'var(--bg-success)' : 'var(--bg-danger)') : 'white', borderColor: s.checked ? (s.available ? 'var(--color-success)' : 'var(--color-danger)') : 'var(--color-border)' }">
                    <mat-icon *ngIf="s.checked">{{ s.available ? 'check' : 'close' }}</mat-icon>
                  </div>
                  <div style="font-size:0.9rem; color:var(--color-subtle);">{{s.size}} — <span style="color:var(--color-muted);">{{ s.available ? 'Satisfactory' : 'Depleted' }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </ng-container>

      <!-- Actions Column -->
     <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:var(--space-lg);">Actions</th>
        <td mat-cell *matCellDef="let row" style="padding:var(--space-lg);">
          <div style="display:flex; gap:10px; align-items:center; background:var(--color-surface);">
            <button mat-icon-button [matMenuTriggerFor]="actionMenu" aria-label="More actions">
              <mat-icon>more_vert</mat-icon>
            </button>
              <mat-menu #actionMenu="matMenu" panelClass="action-menu-panel">
              <button mat-menu-item (click)="viewItem.emit(row.item)">
                <mat-icon>visibility</mat-icon>
                <span>View Details</span>
              </button>
              <button mat-menu-item (click)="editItem.emit(row.item)">
                <mat-icon>edit</mat-icon>
                <span>Edit</span>
              </button>
            </mat-menu>
            <button mat-flat-button style="background:linear-gradient(90deg,var(--color-primary),var(--color-primary-600)); color:white; box-shadow:var(--card-shadow);"
          *ngIf="row.canReplace" (click)="replaceItem.emit(row.item)"> Replace</button>
 
          </div>
        </td>
      </ng-container>

      <!-- Available Column -->
      <ng-container matColumnDef="available">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:var(--space-lg);">Available</th>
        <td mat-cell *matCellDef="let row" style="padding:var(--space-lg); color:var(--color-subtle);">
          <div>
            {{ row.item.usedToday != null ? row.item.usedToday : '-' }}
          </div>
        </td>
      </ng-container>

      <!-- Required Column -->
      <ng-container matColumnDef="required">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:var(--space-lg);">Required</th>
        <td mat-cell *matCellDef="let row" style="padding:var(--space-lg); color:var(--color-subtle);">
          <div>
            {{ row.item.controlQuantity != null ? row.item.controlQuantity : '-' }}
          </div>
        </td>
      </ng-container>

      <!-- Checked Date Column -->
      <ng-container matColumnDef="checkedDate">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:var(--space-lg);">Checked</th>
        <td mat-cell *matCellDef="let row" style="padding:var(--space-lg);">
          <div style="color:var(--color-subtle); font-weight:600;">
            {{ row.item.checkedDate ? (row.item.checkedDate | date:'dd/MM/yyyy HH:mm':'Africa/Johannesburg') : '-' }}
          </div>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="['status','item','required','available','checkedDate','actions']"></tr>
      <tr mat-row *matRowDef="let row; columns: ['status','item','required','available','checkedDate','actions'];"></tr>
    </table>
  `,
    styles: [`
    .full-table { width: 100%; }
    ::ng-deep .action-menu-panel {
      background-color: var(--color-surface) !important;
      opacity: 1 !important;
    }
    ::ng-deep .mat-mdc-menu-panel {
      background-color: var(--color-surface) !important;
      opacity: 1 !important;
    }
    ::ng-deep .mat-mdc-menu-content {
      background-color: var(--color-surface) !important;
      opacity: 1 !important;
    }
  `]
})
export class ItemTableComponent {
  private _items: any[] = [];
  @Input()
  set items(v: any[]) { this._items = v || []; this.computeViewModel(); }
  get items() { return this._items; }
  @Input() categories: Array<{ name: string; icon: string; count: number }> | null = null;
  @Output() viewItem = new EventEmitter<any>();
  @Output() editItem = new EventEmitter<any>();
  @Output() replaceItem = new EventEmitter<any>();
  @Output() toggleCheckbox = new EventEmitter<any>();
  @Output() toggleSubitem = new EventEmitter<{ itemId: number; index: number }>();

  // Precomputed lightweight view-model for each row to avoid expensive template calls
  computedItems: Array<{ item: any; expired: boolean; statusLabel: string; statusColor: string; checkboxStyle: any; expiredCount: number; expiryDisplay: string; categoryIcon: string }> = [];

  onToggle(item: any, event: Event) {
    if (this.isExpired(item.expiryDate)) {
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    this.toggleCheckbox.emit(item);
  }

  isExpired(date?: string | null) {
    if (!date) return false;
    return isBeforeToday(date);
  }
  getCheckboxStyle(item: any) {
    if (this.isExpired(item.expiryDate)) {
      return { borderColor: '#dc2626', backgroundColor: '#fff1f2' };
    }
    if (item.checked) {
      switch (item.status) {
          case 'satisfactory':
            return { borderColor: '#16a34a', backgroundColor: '#ecfdf5' };
          case 'insufficient':
            return { borderColor: '#f59e42', backgroundColor: '#fff7ed' };
        case 'excessive':
          return { borderColor: '#2563eb', backgroundColor: '#eef2ff' };
        case 'depleted':
          return { borderColor: '#dc2626', backgroundColor: '#fff1f2' };
        default:
          return { borderColor: '#e5e7eb', backgroundColor: 'white' };
      }
    } else {
      return { borderColor: '#e5e7eb', backgroundColor: 'white' };
    }
  }

  getCategoryIcon(category: string): string {
    const cats = this.categories ?? [];
    const found = cats.find((c) => c.name === category);
    return found?.icon ?? 'inventory_2';
  }

  getStatusLabel(item: any): string {
    if (this.isExpired(item.expiryDate)) return 'Expired';
    // Only show a status label when the item is checked or it's expired
    if (!item.checked && !this.isExpired(item.expiryDate)) return '';
    const status = item.status ?? '';
    const visibleStatuses = new Set(['depleted', 'insufficient', 'satisfactory', 'excessive', 'expired']);
    if (!visibleStatuses.has(status)) return '';
    switch (status) {
      case 'depleted': return 'Depleted';
      case 'insufficient': return 'Insufficient';
      case 'satisfactory': return 'Satisfactory';
      case 'excessive': return 'Excessive';
      case 'expired': return 'Expired';
      default: return '';
    }
  }

  getStatusColor(label: string): string {
    const colors: Record<string, string> = {
      'Pending': '#f59e0b',
      'Expired': '#b91c1c',
      'Depleted': '#b91c1c',
      'Insufficient': '#f59e42',
      'Satisfactory': '#16a34a',
      'Excessive': '#0ea5e9'
    };
    return colors[label] || '#6b7280';
  }

  getExpiredCount(item: any): number {
    if (!item) return 0;
    const now = new Date();
    let candidates: any[] = [];
    if (Array.isArray(item.items) && item.items.length) candidates = item.items;
    else if (Array.isArray(item.variants) && item.variants.length) candidates = item.variants;
    else if (Array.isArray(item.syringes) && item.syringes.length) candidates = item.syringes;
    else return 0;

    return candidates.reduce((count, it) => {
      const date = it.expiryDate ?? (Array.isArray(it.expiryDates) ? it.expiryDates[0] : undefined) ?? it.expiry;
      if (!date) return count;
      try {
        // reuse existing isExpired logic by formatting date as string
        if (this.isExpired(String(date))) return count + 1;
      } catch (e) {
        // ignore parse errors
      }
      return count;
    }, 0 as number);
  }

  private computeViewModel() {
    try { console.log('ItemTable.computeViewModel running, items ids:', (this._items||[]).map(i=>i.id)); } catch(e) {}
    const cats = this.categories ?? [];
    this.computedItems = (this._items || []).map(item => {
      try { console.log('Item row', { id: item.id, checked: item.checked, status: item.status, usedToday: item.usedToday, controlQuantity: item.controlQuantity }); } catch(e) {}
      const expired = this.isExpired(item.expiryDate);
      const statusLabel = this.getStatusLabel(item);
      const statusColor = this.getStatusColor(statusLabel);
      const checkboxStyle = this.getCheckboxStyle(item);
      const expiredCount = this.getExpiredCount(item);
      const expiryDisplay = (() => {
        const d = item.expiryDate;
        if (!d) return '';
        return (d instanceof Date) ? (d.getDate().toString().padStart(2,'0') + '/' + (d.getMonth()+1).toString().padStart(2,'0') + '/' + d.getFullYear()) : String(d);
      })();
      const categoryIcon = this.getCategoryIcon(item.category ?? item.categoryName ?? '');
      // Determine whether Replace action should be shown.
      // Show Replace for expired/depleted/insufficient items unconditionally (for visibility),
      // and for per-variant items show Replace when at least one variant needs attention
      const baseReplace = expired || ['expired','insufficient', 'depleted'].includes(item.status);
      const hasVariants = Array.isArray(item.items) && item.items.length || Array.isArray(item.variants) && item.variants.length || Array.isArray(item.syringes) && item.syringes.length;
      let variantNeedsReplacement = false;
      if (hasVariants) {
        const candidates = Array.isArray(item.items) && item.items.length ? item.items : (Array.isArray(item.variants) && item.variants.length ? item.variants : (Array.isArray(item.syringes) && item.syringes.length ? item.syringes : []));
        // Consider a variant needing replacement if it is explicitly flagged, unavailable, or expired.
        // Do not exclude already-checked variants here — a checked-but-depleted variant still needs Replace.
        variantNeedsReplacement = candidates.some((v: any) => ((!!v.needsReplacement) || (v.available === false) || this.isExpired(v.expiryDate)) && !v.isReplacement);
      }
      // Show Replace when the item status indicates attention (expired/depleted/insufficient)
      // or when at least one variant specifically needs replacement.
      // (Matches the intent in the comment above.)
      const canReplace = baseReplace || variantNeedsReplacement;

      return { item, expired, statusLabel, statusColor, checkboxStyle, expiredCount, expiryDisplay, categoryIcon, canReplace };
    });
  }

}



