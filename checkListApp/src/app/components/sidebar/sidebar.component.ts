import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
// runtime items match inventory JSON; use `any` in component inputs
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
import { parseAnyDate, isBeforeToday } from '../../utils/date-utils';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatDividerModule, FormsModule, MatCardModule, MatDialogModule],
  template: `
    <mat-card style="margin-bottom:var(--space-md); padding:var(--space-md); background:linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 10%, var(--color-surface) 100%); border-top:4px solid var(--color-primary); box-shadow:0 4px 12px rgba(99,102,241,0.15);">
      <div style="display:flex; gap:10px; align-items:center; justify-content:space-between;">
        <div style="flex:1;">
          <div style="font-weight:800; font-size:1.25rem; color:var(--color-primary); display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <mat-icon style="font-size:1.5rem; width:1.5rem; height:1.5rem;">checklist</mat-icon>
            Checklist Summary
          </div>
          <div style="font-size:0.9rem; color:#64748b; font-weight:500;">Status overview & key items</div>
        </div>
      </div>

      <div style="display:flex; gap:10px; margin-top:var(--space-md); flex-direction:column; flex-wrap:nowrap; align-items:stretch; overflow:auto;">
        <mat-card style="flex:1 1 0; min-width:0; display:flex; align-items:stretch; cursor:pointer;" (click)="openExpired()">
          <mat-card-content style="display:flex; align-items:center; gap:12px;">
            <div style="width:52px; height:52px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:var(--color-surface-3); border-left:6px solid var(--color-danger);">
              <mat-icon style="color:var(--color-danger);">block</mat-icon>
            </div>
            <div>
              <div style="font-weight:700;">Expired:</div>
              <div style="color:var(--color-danger);">{{ expiredItems.length }} item(s)</div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card style="flex:1 1 0; min-width:0; display:flex; align-items:stretch; cursor:pointer;" (click)="openDepleted()">
          <mat-card-content style="display:flex; align-items:center; gap:12px;">
            <div style="width:52px; height:52px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:var(--bg-danger); border-left:6px solid var(--color-danger);">
              <mat-icon style="color:var(--color-danger);">remove_circle</mat-icon>
            </div>
            <div>
              <div style="font-weight:700;">Depleted:</div>
              <div style="color:var(--color-danger);">{{ depletedItems.length }} item(s)</div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card style="flex:1 1 0; min-width:0; display:flex; align-items:stretch; cursor:pointer;" (click)="openInsufficient()">
          <mat-card-content style="display:flex; align-items:center; gap:12px;">
            <div style="width:52px; height:52px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:var(--bg-warning); border-left:6px solid var(--color-warning);">
              <mat-icon style="color:var(--color-warning);">warning</mat-icon>
            </div>
            <div>
              <div style="font-weight:700;">Insufficient:</div>
              <div style="color:var(--color-warning);">{{ insufficientItems.length }} item(s)</div>
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
        return this.items.filter(i => i.expiryDate && isBeforeToday(i.expiryDate));
      }
      openExpired() {
        if (!this.expiredItems.length) return;
        const ref = this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'expired', items: this.expiredItems } });
        ref.afterClosed().subscribe((result: any) => {
          if (result?.action === 'replace' && result?.item) this.replaceItem.emit(result.item);
        });
      }
    @Input() previousUnavailable: Array<{ id: number; name: string; status: string }> = [];

    openPreviousUnavailable() {
      if (!this.previousUnavailable || this.previousUnavailable.length === 0) return;
      this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'checklist', items: this.previousUnavailable } });
    }
  @Input() categories: Array<{ name: string; icon: string; count: number }> = [];
  @Input() selectedCategory = 'All Items';
  @Input() items: any[] = [];
    get depletedItems() {
        return this.items.filter((i: any) => i.status === 'depleted');
      }
      get excessiveItems() {
        return this.items.filter((i: any) => i.status === 'excessive');
      }
      get insufficientItems() {
        return this.items.filter((i: any) => i.status === 'insufficient');
      }

    openDepleted() {
      if (!this.depletedItems.length) return;
      const ref = this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'depleted', items: this.depletedItems } });
      ref.afterClosed().subscribe((result: any) => {
        if (result?.action === 'replace' && result?.item) this.replaceItem.emit(result.item);
      });
    }
    openExcessive() {
      if (!this.excessiveItems.length) return;
      this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'excessive', items: this.excessiveItems } });
    }
    openInsufficient() {
      if (!this.insufficientItems.length) return;
      const ref = this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'insufficient', items: this.insufficientItems } });
      ref.afterClosed().subscribe((result: any) => {
        if (result?.action === 'replace' && result?.item) this.replaceItem.emit(result.item);
      });
    }
  @Input() expiredNeedsReplacement: any[] = [];
  @Output() selectCategory = new EventEmitter<string>();
  @Output() replaceItem = new EventEmitter<any>();

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
    const ref = this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'expiring', items: this.expiredNeedsReplacement } });
    ref.afterClosed().subscribe((result: any) => {
      if (result?.action === 'replace' && result?.item) this.replaceItem.emit(result.item);
    });
  }
}
