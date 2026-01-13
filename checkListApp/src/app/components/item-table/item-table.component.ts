import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Item } from '../../models/item';

@Component({
  selector: 'app-item-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, MatCardModule],
  template: `
     
    <table mat-table [dataSource]="items" style="width:100%;" class="mat-elevation-z1 full-table">
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:12px;">Status</th>
        <td mat-cell *matCellDef="let item" style="padding:12px;">
          <div [style.cursor]="isExpired(item.expiryDate) ? 'not-allowed' : 'pointer'" style="display:flex; align-items:center; gap:12px;" (click)="isExpired(item.expiryDate) ? null : toggleCheckbox.emit(item)">
            <div [ngStyle]="getCheckboxStyle(item)" style="width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; border:2px solid #d1d5db;">
              <mat-icon *ngIf="isExpired(item.expiryDate)" style="opacity:0.5;">block</mat-icon>
              <mat-icon *ngIf="!isExpired(item.expiryDate) && item.checked && item.status === 'available'">check</mat-icon>
              <mat-icon *ngIf="!isExpired(item.expiryDate) && item.checked && item.status === 'unavailable'">close</mat-icon>
            </div>
            <div>
              <div *ngIf="!item.checked" style="color:#6b7280;">Unchecked</div>
              <div *ngIf="item.checked && item.status === 'available'" style="color:#16a34a; font-weight:700;">Available</div>
              <div *ngIf="item.checked && item.status === 'unavailable'" style="color:#ef4444; font-weight:700;">Not Available</div>
            </div>
          </div>
        </td>
      </ng-container>

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
                  <div style="font-size:0.9rem; color:#374151;">{{s.size}} — <span style="color:#6b7280;">{{ s.available ? 'Available' : 'Not Available' }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:12px;">Actions</th>
        <td mat-cell *matCellDef="let item" style="padding:12px;">
          <div style="display:flex; gap:8px;">
            <button mat-stroked-button color="primary" (click)="viewItem.emit(item)">View Details</button>
            <button mat-flat-button color="accent" *ngIf="(isExpired(item.expiryDate) || item.status === 'unavailable')" (click)="replaceItem.emit(item)">Replace Item</button>
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="usedToday">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:12px;">Used (of Available)</th>
        <td mat-cell *matCellDef="let item" style="padding:12px; color:#374151;">
          <div>
            <ng-container *ngIf="item.usedToday != null; else emptyUsed">
              {{ item.usedToday }} of {{ item.quantity != null ? item.quantity : '-' }}
            </ng-container>
            <ng-template #emptyUsed>- of {{ item.quantity != null ? item.quantity : '-' }}</ng-template>
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="checkedDate">
        <th mat-header-cell *matHeaderCellDef style="text-align:left; padding:12px;">Checked</th>
        <td mat-cell *matCellDef="let item" style="padding:12px;">
          <div style="color:#374151;">
            {{ item.checkedDate ? (item.checkedDate | date:'short') : '-' }}
          </div>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="['status','item','usedToday','checkedDate','actions']"></tr>
      <tr mat-row *matRowDef="let row; columns: ['status','item','usedToday','checkedDate','actions'];"></tr>
    </table>
  `,
  styles: [`
    .full-table { width: 100%; }
  `]
})
export class ItemTableComponent {
  @Input() items: Item[] = [];
  @Input() categories: Array<{ name: string; icon: string; count: number }> | null = null;
  @Output() viewItem = new EventEmitter<Item>();
  @Output() replaceItem = new EventEmitter<Item>();
  @Output() toggleCheckbox = new EventEmitter<Item>();
  @Output() toggleSubitem = new EventEmitter<{ itemId: number; index: number }>();

  isExpired(date?: string | null) {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  getCheckboxStyle(item: Item) {
    if (item.checked && item.status === 'unavailable') {
      return { borderColor: '#ef4444', backgroundColor: '#fff1f2' };
    } else if (item.checked) {
      return { borderColor: '#16a34a', backgroundColor: '#ecfdf5' };
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
