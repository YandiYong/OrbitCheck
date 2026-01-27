import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Item } from '../../models/item';

@Component({
  selector: 'app-item-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, MatCardModule, MatMenuModule],
  template: `
    <table mat-table [dataSource]="items" style="width:100%;" class="mat-elevation-z1 full-table">
      <!-- Status Column -->
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:12px;">Status</th>
           <td mat-cell *matCellDef="let item" style="padding:12px;">
           <div [style.cursor]="isExpired(item.expiryDate) ? 'not-allowed' : 'pointer'" style="display:flex; align-items:center; gap:12px;"
             role="button" tabindex="0"
             (click)="onToggle(item, $event)"
             (mousedown)="onToggle(item, $event)"
             (keydown.enter)="onToggle(item, $event)"
             (keydown.space)="onToggle(item, $event)">
            <div [ngStyle]="getCheckboxStyle(item)" style="width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; border:2px solid #d1d5db;">
              <mat-icon *ngIf="isExpired(item.expiryDate)" style="opacity:0.5; color:#b91c1c;">block</mat-icon>
              <mat-icon *ngIf="!isExpired(item.expiryDate) && item.checked && item.status === 'satisfactory'" style="color:#16a34a;">check_circle</mat-icon>
              <mat-icon *ngIf="!isExpired(item.expiryDate) && item.checked && item.status === 'insufficient'" style="color:#f59e42;">warning</mat-icon>
              <mat-icon *ngIf="!isExpired(item.expiryDate) && item.checked && item.status === 'excessive'" style="color:#3b82f6;">add_circle</mat-icon>
              <mat-icon *ngIf="!isExpired(item.expiryDate) && item.checked && item.status === 'depleted'" style="color:#b91c1c;">remove_circle</mat-icon>
            </div>
            <div>
              <div *ngIf="getStatusLabel(item)" [style.color]="getStatusColor(getStatusLabel(item))" style="font-weight:700;">
                {{ getStatusLabel(item) }}
              </div>
            </div>
          </div>
        </td>
      </ng-container>

      <!-- Item Column -->
      <ng-container matColumnDef="item">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:12px;">Item</th>
        <td mat-cell *matCellDef="let item" style="padding:12px;">
          <div style="display:flex; gap:12px; align-items:center;">
            <div style="width:48px; height:48px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#f3f4f6;">
              <mat-icon>{{ getCategoryIcon(item.category) }}</mat-icon>
            </div>
            <div>
              <div style="font-weight:700; color:#111827;">{{item.name}}</div>
              <div style="color:#6b7280; font-size:0.85rem;">
                Expires: {{item.expiryDate}} <span *ngIf="isExpired(item.expiryDate)" style="color:#b91c1c; font-weight:700; margin-left:6px;">(EXPIRED)</span>
              </div>
              <div *ngIf="item.syringes" style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
                <div *ngFor="let s of item.syringes; let i = index" style="display:flex; align-items:center; gap:8px;">
                  <div (click)="isExpired(item.expiryDate) ? null : toggleSubitem.emit({ itemId: item.id, index: i })" [style.cursor]="isExpired(item.expiryDate) ? 'not-allowed' : 'pointer'" style="width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; border:2px solid #d1d5db;" [ngStyle]="{ background: s.checked ? (s.available ? '#ecfdf5' : '#fff1f2') : 'white', borderColor: s.checked ? (s.available ? '#16a34a' : '#ef4444') : '#d1d5db' }">
                    <mat-icon *ngIf="s.checked">{{ s.available ? 'check' : 'close' }}</mat-icon>
                  </div>
                  <div style="font-size:0.9rem; color:#374151;">{{s.size}} — <span style="color:#6b7280;">{{ s.available ? 'Satisfactory' : 'Depleted' }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </ng-container>

      <!-- Actions Column -->
     <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:12px;">Actions</th>
        <td mat-cell *matCellDef="let item" style="padding:12px;">
          <div style="display:flex; gap:8px; align-items:center; background:#fff;">
            <button mat-icon-button [matMenuTriggerFor]="actionMenu" aria-label="More actions">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #actionMenu="matMenu" panelClass="action-menu-panel">
              <button mat-menu-item (click)="viewItem.emit(item)">
                <mat-icon>visibility</mat-icon>
                <span>View Details</span>
              </button>
              <button mat-menu-item (click)="editItem.emit(item)">
                <mat-icon>edit</mat-icon>
                <span>Edit</span>
              </button>
            </mat-menu>
           <button mat-flat-button color="accent"
        *ngIf="isExpired(item.expiryDate) || ['insufficient', 'excessive', 'depleted'].includes(item.status)"(click)="replaceItem.emit(item)"> Replace Item</button>
 
          </div>
        </td>
      </ng-container>

      <!-- Available Column -->
      <ng-container matColumnDef="available">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:12px;">Available</th>
        <td mat-cell *matCellDef="let item" style="padding:12px; color:#374151;">
          <div>
            {{ item.usedToday != null ? item.usedToday : '-' }}
          </div>
        </td>
      </ng-container>

      <!-- Required Column -->
      <ng-container matColumnDef="required">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:12px;">Required</th>
        <td mat-cell *matCellDef="let item" style="padding:12px; color:#374151;">
          <div>
            {{ item.controlQuantity != null ? item.controlQuantity : '-' }}
          </div>
        </td>
      </ng-container>

      <!-- Checked Date Column -->
      <ng-container matColumnDef="checkedDate">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:12px;">Checked</th>
        <td mat-cell *matCellDef="let item" style="padding:12px;">
          <div style="color:#374151;">
            {{ item.checkedDate ? (item.checkedDate | date:'dd/MM/yyyy HH:mm a') : '-' }}
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
      background-color: white !important;
      opacity: 1 !important;
    }
    ::ng-deep .mat-mdc-menu-panel {
      background-color: white !important;
      opacity: 1 !important;
    }
    ::ng-deep .mat-mdc-menu-content {
      background-color: white !important;
      opacity: 1 !important;
    }
  `]
})
export class ItemTableComponent {
  @Input() items: Item[] = [];
  @Input() categories: Array<{ name: string; icon: string; count: number }> | null = null;
  @Output() viewItem = new EventEmitter<Item>();
  @Output() editItem = new EventEmitter<Item>();
  @Output() replaceItem = new EventEmitter<Item>();
  @Output() toggleCheckbox = new EventEmitter<Item>();
  @Output() toggleSubitem = new EventEmitter<{ itemId: number; index: number }>();

  onToggle(item: Item, event: Event) {
    if (this.isExpired(item.expiryDate)) {
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    this.toggleCheckbox.emit(item);
  }

  isExpired(date?: string | null) {
    if (!date) return false;
    // Support both ISO (YYYY-MM-DD) and dd/MM/yyyy formats
    if (date.indexOf('-') >= 0) {
      const d = new Date(date);
      return !isNaN(d.getTime()) && d < new Date();
    }
    const parts = date.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month - 1, day);
      return d < new Date();
    }
    return false;
  }

  getCheckboxStyle(item: Item) {
    if (this.isExpired(item.expiryDate)) {
      return { borderColor: '#b91c1c', backgroundColor: '#fee2e2' };
    }
    if (item.checked) {
      switch (item.status) {
          case 'satisfactory':
            return { borderColor: '#16a34a', backgroundColor: '#ecfdf5' };
          case 'insufficient':
            return { borderColor: '#f59e42', backgroundColor: '#fef3c7' };
        case 'excessive':
          return { borderColor: '#3b82f6', backgroundColor: '#dbeafe' };
        case 'depleted':
          return { borderColor: '#b91c1c', backgroundColor: '#fee2e2' };
        default:
          return { borderColor: '#d1d5db', backgroundColor: 'white' };
      }
    } else {
      return { borderColor: '#d1d5db', backgroundColor: 'white' };
    }
  }

  getCategoryIcon(category: string): string {
    const cats = this.categories ?? [];
    const found = cats.find((c) => c.name === category);
    return found?.icon ?? 'inventory_2';
  }

  getStatusLabel(item: Item): string {
    if (this.isExpired(item.expiryDate)) return 'Expired';
    // Only show a status label when the item is checked or it's expired
    if (!item.checked && !this.isExpired(item.expiryDate)) return '';
    const status = item.status;
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

}



