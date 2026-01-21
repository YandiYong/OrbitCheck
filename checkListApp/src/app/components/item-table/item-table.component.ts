import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Item } from '../../models/item';
import { MatRadioModule } from '@angular/material/radio';

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
          <div [style.cursor]="isExpired(item.expiryDate) ? 'not-allowed' : 'pointer'" style="display:flex; align-items:center; gap:12px;" (click)="isExpired(item.expiryDate) ? null : toggleCheckbox.emit(item)">
            <div [ngStyle]="getCheckboxStyle(item)" style="width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; border:2px solid #d1d5db;">
              <mat-icon *ngIf="isExpired(item.expiryDate)" style="opacity:0.5; color:#b91c1c;">block</mat-icon>
              <mat-icon *ngIf="!isExpired(item.expiryDate) && item.checked && item.status === 'onTrolley'" style="color:#16a34a;">check_circle</mat-icon>
              <mat-icon *ngIf="!isExpired(item.expiryDate) && item.checked && item.status === 'insufficient'" style="color:#f59e42;">warning</mat-icon>
              <mat-icon *ngIf="!isExpired(item.expiryDate) && item.checked && item.status === 'satisfactory'" style="color:#22c55e;">task_alt</mat-icon>
              <mat-icon *ngIf="!isExpired(item.expiryDate) && item.checked && item.status === 'excessive'" style="color:#3b82f6;">add_circle</mat-icon>
              <mat-icon *ngIf="!isExpired(item.expiryDate) && item.checked && item.status === 'depleted'" style="color:#b91c1c;">remove_circle</mat-icon>
              <mat-icon *ngIf="!isExpired(item.expiryDate) && item.checked && item.status === 'offTrolley'" style="color:#ef4444;">close</mat-icon>
            </div>
            <div>
              <div *ngIf="item.checked && item.status === 'onTrolley'" style="color:#16a34a; font-weight:700;">On Trolley</div>
              <div *ngIf="item.checked && item.status === 'insufficient'" style="color:#f59e42; font-weight:700;">Insufficient</div>
              <div *ngIf="item.checked && item.status === 'satisfactory'" style="color:#22c55e; font-weight:700;">Satisfactory</div>
              <div *ngIf="item.checked && item.status === 'excessive'" style="color:#3b82f6; font-weight:700;">Excessive</div>
              <div *ngIf="item.checked && item.status === 'depleted'" style="color:#b91c1c; font-weight:700;">Depleted</div>
              <div *ngIf="item.checked && item.status === 'offTrolley'" style="color:#ef4444; font-weight:700;">Not Available</div>
              <div *ngIf="isExpired(item.expiryDate)" style="color:#b91c1c; font-weight:700;">Expired</div>
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
                  <div (click)="isExpired(item.expiryDate) ? null : toggleSubitem.emit({ itemId: item.id, index: i })" [style.cursor]="isExpired(item.expiryDate) ? 'not-allowed' : 'pointer'" style="width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; border:2px solid #d1d5db;" [ngStyle]="{ background: s.checked ? (s.onTrolley ? '#ecfdf5' : '#fff1f2') : 'white', borderColor: s.checked ? (s.onTrolley ? '#16a34a' : '#ef4444') : '#d1d5db' }">
                    <mat-icon *ngIf="s.checked">{{ s.onTrolley ? 'check' : 'close' }}</mat-icon>
                  </div>
                  <div style="font-size:0.9rem; color:#374151;">{{s.size}} — <span style="color:#6b7280;">{{ s.onTrolley ? 'On Trolley' : 'Off Trolley' }}</span></div>
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
            <mat-menu #actionMenu="matMenu" class="custom-menu">
              <button mat-menu-item (click)="viewItem.emit(item)">
                <mat-icon>visibility</mat-icon>
                <span>View Details</span>
              </button>
              <button mat-menu-item (click)="editItem.emit(item)">
                <mat-icon>edit</mat-icon>
                <span>Edit</span>
              </button>
            </mat-menu>
            <button mat-flat-button color="accent" *ngIf="['insufficient', 'excessive', 'expired', 'depleted'].includes(item.status)" (click)="replaceItem.emit(item)">
              Replace Item
            </button>
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
            {{ item.quantity != null ? item.quantity : '-' }}
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
    ::ng-deep .custom-menu {
      background-color: white;
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

  isExpired(date?: string | null) {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  getCheckboxStyle(item: Item) {
    if (this.isExpired(item.expiryDate)) {
      return { borderColor: '#b91c1c', backgroundColor: '#fee2e2' };
    }
    if (item.checked) {
      switch (item.status) {
        case 'onTrolley':
          return { borderColor: '#16a34a', backgroundColor: '#ecfdf5' };
        case 'insufficient':
          return { borderColor: '#f59e42', backgroundColor: '#fef3c7' };
        case 'satisfactory':
          return { borderColor: '#22c55e', backgroundColor: '#dcfce7' };
        case 'excessive':
          return { borderColor: '#3b82f6', backgroundColor: '#dbeafe' };
        case 'depleted':
          return { borderColor: '#b91c1c', backgroundColor: '#fee2e2' };
        case 'offTrolley':
          return { borderColor: '#ef4444', backgroundColor: '#fff1f2' };
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
}



