import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Item } from '../../models/item';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DetailsDialogComponent } from '../details-dialog/details-dialog.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatDividerModule, FormsModule, MatCardModule, MatDialogModule],
  template: `
     <mat-card style="margin-bottom:12px; padding:12px;">
      <div style="display:flex; gap:10px; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-weight:700;">Check List Summary</div>
          <div style="font-size:0.85rem; color:#6b7280;">Quick overview of the Checklist</div>
        </div>
      </div>

      <div style="display:flex; gap:10px; margin-top:12px; flex-direction:column; flex-wrap:nowrap; align-items:stretch; overflow:auto;">
        <mat-card style="flex:1 1 0; min-width:0; display:flex; align-items:stretch; cursor:pointer;" (click)="openExpired()">
          <mat-card-content style="display:flex; align-items:center; gap:12px;">
            <div style="width:52px; height:52px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#f3f4f6; border-left:6px solid #b91c1c;">
              <mat-icon style="color:#b91c1c;">block</mat-icon>
            </div>
            <div>
              <div style="font-weight:700;">Expired:</div>
              <div style="color:#b91c1c;">{{ expiredItems.length }} item(s)</div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card style="flex:1 1 0; min-width:0; display:flex; align-items:stretch; cursor:pointer;" (click)="openDepleted()">
          <mat-card-content style="display:flex; align-items:center; gap:12px;">
            <div style="width:52px; height:52px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#fee2e2; border-left:6px solid #b91c1c;">
              <mat-icon style="color:#b91c1c;">remove_circle</mat-icon>
            </div>
            <div>
              <div style="font-weight:700;">Depleted:</div>
              <div style="color:#b91c1c;">{{ depletedItems.length }} item(s)</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card style="flex:1 1 0; min-width:0; display:flex; align-items:stretch; cursor:pointer;" (click)="openExcessive()">
          <mat-card-content style="display:flex; align-items:center; gap:12px;">
            <div style="width:52px; height:52px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#dbeafe; border-left:6px solid #3b82f6;">
              <mat-icon style="color:#3b82f6;">add_circle</mat-icon>
            </div>
            <div>
              <div style="font-weight:700;">Excessive:</div>
              <div style="color:#3b82f6;">{{ excessiveItems.length }} item(s)</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card style="flex:1 1 0; min-width:0; display:flex; align-items:stretch; cursor:pointer;" (click)="openInsufficient()">
          <mat-card-content style="display:flex; align-items:center; gap:12px;">
            <div style="width:52px; height:52px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#fef3c7; border-left:6px solid #f59e42;">
              <mat-icon style="color:#f59e42;">warning</mat-icon>
            </div>
            <div>
              <div style="font-weight:700;">Insufficient:</div>
              <div style="color:#f59e42;">{{ insufficientItems.length }} item(s)</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </mat-card>
      <mat-divider style="margin:16px 0;"></mat-divider>
    <div class="header">
      <mat-icon>dashboard</mat-icon>
      <span>Categories</span>
    </div>

    <mat-form-field class="search" appearance="outline">
      <mat-label>Filter categories</mat-label>
      <input matInput [(ngModel)]="filterTerm" placeholder="Type to filter" />
    </mat-form-field>

    <mat-nav-list role="listbox">
      <mat-list-item
        *ngFor="let cat of filteredCategories()"
        (click)="onSelect(cat.name)"
        [ngClass]="{ 'list-item': true, active: selectedCategory === cat.name }"
      >
        <div class="item-title">{{cat.name}}</div>
        <mat-chip class="count-chip" color="accent" style="height:24px; text-align:center;">{{cat.count}}</mat-chip>
      </mat-list-item>
    </mat-nav-list>  
  `,
  styles: [
    `
    :host { display: block; }
    .header { display:flex; align-items:center; gap:8px; margin:0 0 12px 0; color:#0f172a; font-weight:700; }
    .search { width:100%; margin-bottom:12px; }
    .list-item { border-radius:8px; padding:10px 12px; margin-bottom:16px; }
    .list-item:last-child { margin-bottom: 0; }
    .list-item:hover { background:#f8fafc; }
    .list-item.active { background:#e3f2fd; border-left:4px solid #1976d2; }
    .item-title { font-weight:600; }
    .count-chip { margin-left:auto; }
    `
  ]
})
export class SidebarComponent {
      get expiredItems() {
        const now = new Date();
        return this.items.filter(i => i.expiryDate && new Date(i.expiryDate) < now);
      }

      openExpired() {
        if (!this.expiredItems.length) return;
        this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'expired', items: this.expiredItems } });
      }
    @Input() previousUnavailable: Array<{ id: number; name: string; status: string }> = [];

    openPreviousUnavailable() {
      if (!this.previousUnavailable || this.previousUnavailable.length === 0) return;
      this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'checklist', items: this.previousUnavailable } });
    }
  @Input() categories: Array<{ name: string; icon: string; count: number }> = [];
  @Input() selectedCategory = 'All Items';
  @Input() items: Item[] = [];
    get depletedItems() {
      return this.items.filter(i => i.status === 'depleted');
    }
    get excessiveItems() {
      return this.items.filter(i => i.status === 'excessive');
    }
    get insufficientItems() {
      return this.items.filter(i => i.status === 'insufficient');
    }

    openDepleted() {
      if (!this.depletedItems.length) return;
      this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'depleted', items: this.depletedItems } });
    }
    openExcessive() {
      if (!this.excessiveItems.length) return;
      this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'excessive', items: this.excessiveItems } });
    }
    openInsufficient() {
      if (!this.insufficientItems.length) return;
      this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'insufficient', items: this.insufficientItems } });
    }
  @Input() expiredNeedsReplacement: Item[] = [];
  @Output() selectCategory = new EventEmitter<string>();

  private dialog = inject(MatDialog);

  filterTerm = '';

  onSelect(name: string) {
    this.selectCategory.emit(name);
  }

  filteredCategories() {
    const term = this.filterTerm.trim().toLowerCase();
    if (!term) return this.categories;
    return this.categories.filter(c => c.name.toLowerCase().includes(term));
  }


  openExpiredNeedsReplacement() {
    if (!this.expiredNeedsReplacement || this.expiredNeedsReplacement.length === 0) return;
    this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'expiring', items: this.expiredNeedsReplacement } });
  }
}
