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
  imports: [CommonModule, MatListModule, MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatDividerModule, FormsModule, MatCardModule, MatDialogModule, DetailsDialogComponent],
  template: `
    <div class="header">
      <mat-icon>dashboard</mat-icon>
      <span>Categories</span>
    </div>

    <mat-form-field class="search" appearance="outline">
      <mat-label>Filter categories</mat-label>
      <input matInput [(ngModel)]="filterTerm" placeholder="Type to filter" />
    </mat-form-field>

    <mat-divider></mat-divider>

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
    <mat-divider style="margin:16px 0;"></mat-divider>
    <mat-card style="margin-bottom:12px; padding:12px;">
      <div style="display:flex; gap:10px; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-weight:700;">Yesterday's Summary</div>
          <div style="font-size:0.85rem; color:#6b7280;">Quick overview of yesterday's Checklist</div>
        </div>
      </div>

      <div style="display:flex; gap:10px; margin-top:12px; flex-direction:column; flex-wrap:nowrap; align-items:stretch; overflow:auto;">
        <mat-card style="flex:1 1 0; min-width:0; display:flex; align-items:stretch; cursor:pointer;" (click)="openPreviousUnavailable()">
          <mat-card-content style="display:flex; align-items:center; gap:12px;">
            <div style="width:52px; height:52px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#fff1f2; border-left:6px solid #ef4444;">
              <mat-icon color="warn">error</mat-icon>
            </div>
            <div>
              <div style="font-weight:700;">Previously Not Available</div>
              <div style="color:#ef4444;">{{ previousUnavailable.length }} item(s)</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card style="flex:1 1 0; min-width:0; display:flex; align-items:stretch; cursor:pointer;" (click)="openExpiredNeedsReplacement()">
          <mat-card-content style="display:flex; align-items:center; gap:12px; width:100%;">
            <div style="width:52px; height:52px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#fff7ed; border-left:6px solid #f97316;">
              <mat-icon style="color:#f97316;">schedule</mat-icon>
            </div>
            <div>
              <div style="font-weight:700;">Expired / Replace</div>
              <div style="color:#b91c1c;">{{ expiredNeedsReplacement.length }} item(s)</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </mat-card>
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
  @Input() categories: Array<{ name: string; icon: string; count: number }> = [];
  @Input() selectedCategory = 'All Items';
  @Input() previousUnavailable: Array<{ id: number; name: string; status: string }> = [];
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

  openPreviousUnavailable() {
    if (!this.previousUnavailable || this.previousUnavailable.length === 0) return;
    this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'checklist', items: this.previousUnavailable } });
  }

  openExpiredNeedsReplacement() {
    if (!this.expiredNeedsReplacement || this.expiredNeedsReplacement.length === 0) return;
    this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'expiring', items: this.expiredNeedsReplacement } });
  }
}
