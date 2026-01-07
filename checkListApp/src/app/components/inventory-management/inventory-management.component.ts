import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Item } from '../../models/item';
import inventoryData from '../../../inventoryData.json';
import { ReplaceDialogComponent } from '../replace-dialog/replace-dialog.component';
import { DetailsDialogComponent } from '../details-dialog/details-dialog.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { StatsCardComponent } from '../stats-card/stats-card.component';
import { ItemTableComponent } from '../item-table/item-table.component';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    MatChipsModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    ReplaceDialogComponent,
    DetailsDialogComponent,
    SidebarComponent,
    StatsCardComponent,
    MatDatepickerModule,
    ItemTableComponent,
    FormsModule
  ],
  template: `
  <mat-toolbar color="primary" style="display:flex; justify-content:space-between;">
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="font-weight:700; font-size:2.5rem;">Emergency Trolley Check List</span>
    </div>
    <div style="display:flex; align-items:center; gap:8px;">
      <button mat-icon-button aria-label="search"><mat-icon>search</mat-icon></button>
      <button mat-icon-button aria-label="notifications"><mat-icon>notifications</mat-icon></button>
      <button mat-icon-button aria-label="user"><mat-icon>account_circle</mat-icon></button>
    </div>
  </mat-toolbar>

  <div style="display:flex; gap:16px; padding:12px;">
    <mat-sidenav-container style="height:calc(100vh - 64px); width:100%;">
      <mat-sidenav mode="side" opened style="width:260px; padding:12px; background:white; box-shadow:0 6px 18px rgba(16,24,40,0.06);">
        <app-sidebar [categories]="categories()" [selectedCategory]="selectedCategory()" (selectCategory)="toggleCategory($event)"></app-sidebar>
      </mat-sidenav>

      <mat-sidenav-content style="padding:8px 16px;">
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:12px;">
          <app-stats-card [count]="expiringSoonCount()" title="Items Expiring Soon" subtitle="Due within 7 days" [subtitleColor]="'#f97316'" borderColor="#f97316" (clicked)="openDetailsForType('expiring')"></app-stats-card>
          <app-stats-card [count]="replacedThisMonthCount()" title="Replacements" subtitle="Replaced items" [subtitleColor]="'#0284c7'" borderColor="#0284c7" (clicked)="openDetailsForType('replaced')"></app-stats-card>
          <app-stats-card [count]="getChecklistStats().checked" title="Checklists Completed" borderColor="#7c3aed" (clicked)="openDetailsForType('checklist')">
            <div *ngIf="getChecklistStats().unavailable > 0" style="display:flex; gap:6px; align-items:center; color:#ef4444; margin-top:6px;">
              <mat-icon>error</mat-icon>
              <span>{{getChecklistStats().unavailable}} Not Available</span>
            </div>
            <div *ngIf="getChecklistStats().checked > 0 && getChecklistStats().unavailable === 0" style="display:flex; gap:6px; align-items:center; color:#16a34a; margin-top:6px;">
              <mat-icon>check_circle</mat-icon>
              <span>All Available</span>
            </div>
          </app-stats-card>
        </div>
          <mat-card  style="margin-left:75rem; width:300px;">
           <mat-form-field  style="width:100%; appearance:outline;">
           <mat-label>Select Date Range</mat-label>   
           <mat-date-range-input [rangePicker]="picker">
               <input matStartDate placeholder="Start date" [ngModel]="rangeStart()" (ngModelChange)="rangeStart.set($event)" name="start">
               <input matEndDate placeholder="End date" [ngModel]="rangeEnd()" (ngModelChange)="rangeEnd.set($event)" name="end">
          </mat-date-range-input>
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-date-range-picker #picker></mat-date-range-picker>
          </mat-form-field>
        </mat-card>
        
      
        <mat-card style="background:white; box-shadow:0 8px 30px rgba(2,6,23,0.04);">
          <mat-card-header style="background:#e8f4ff;">
            <mat-card-title>Item List</mat-card-title>
            <mat-card-subtitle style="margin-left:8px; color:#374151; font-size:0.9rem;">Total: {{filteredInventory().length}} • Shown: {{dateFilteredItems().length}}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <app-item-table [items]="dateFilteredItems()" [categories]="categories()" (viewItem)="openDetailsForItem($event)" (replaceItem)="openReplaceDialog($event)" (toggleCheckbox)="handleCheckboxClick($event)"></app-item-table>
          </mat-card-content>
        </mat-card>
      </mat-sidenav-content>
    </mat-sidenav-container>
  </div>
  `,
  styles: [`
    :host { display:block; height:100%; font-family: 'Roboto', sans-serif; background:#f3f6f9; }
    .full-table { width:100%; }
  `]
})
export class InventoryManagementComponent {
  private dialog = inject(MatDialog);

  // date range signals bound from template
  rangeStart = signal<Date | null>(null);
  rangeEnd = signal<Date | null>(null);

  // computed list: if a date range is selected, show checked items within that range
  dateFilteredItems = computed(() => {
    const rs = this.rangeStart();
    const re = this.rangeEnd();
    // If no date range selected, show all items (default view)
    if (!rs || !re) return this.filteredInventory();

    const start = new Date(rs);
    start.setHours(0, 0, 0, 0);
    const end = new Date(re);
    end.setHours(23, 59, 59, 999);

    // Show items (within the currently selected category) that were checked during the selected range (history),
    // regardless of current `status` (available/unavailable).
    return this.filteredInventory().filter(i => {
      if (!i.checkedDate) return false;
      const d = new Date(i.checkedDate);
      return d >= start && d <= end;
    });
  });

  inventory = signal<Item[]>((inventoryData as any[]).flatMap(cat => (cat.items || []).map((it: any) => ({
    ...it,
    name: it.itemName ?? it.name,
    category: it.category ?? cat.category
  }))) as Item[]);

  selectedCategory = signal<string>('All Items');
  selectedItem = signal<Item | { type: string; items: Item[] } | null>(null);

  selectedStyle = { background: '#1976d2', color: 'white' } as any;

  categories = computed(() => {
    const inv = this.inventory();
    const iconMap: Record<string, string> = {
      'TOP': '',
      'AIRWAYS': '',
      'BREATHING': '',
      'CIRCULATION': '',
      'DRUGS': '',
      'EXTRAS': '',
      'RESUSCITATION Algorithm & Documents': '',
    };

    const map = new Map<string, { name: string; icon: string; count: number }>();
    for (const item of inv) {
      const cat = item.category ?? 'Uncategorized';
      if (!map.has(cat)) {
        map.set(cat, { name: cat, icon: iconMap[cat] ?? 'inventory_2', count: 0 });
      }
      map.get(cat)!.count++;
    }

    return [
      { name: 'All Items', icon: 'inventory_2', count: inv.length },
      ...Array.from(map.values())
    ];
  });

  private isPast(date?: string | null) {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  isExpired(date?: string | null) { return this.isPast(date); }

  expiringSoonCount = computed(() => {
    const now = new Date();
    const seven = new Date();
    seven.setDate(now.getDate() + 7);
    return this.filteredInventory().filter(item => {
      if (!item.expiryDate) return false;
      const d = new Date(item.expiryDate);
      return d <= seven && d >= now;
    }).length;
  });

  replacedThisMonthCount = computed(() => {
    const now = new Date();
    return this.filteredInventory().filter(item => {
      if (!item.replacementDate) return false;
      const r = new Date(item.replacementDate);
      return r.getMonth() === now.getMonth() && r.getFullYear() === now.getFullYear();
    }).length;
  });

  getChecklistStats = computed(() => {
    const inv = this.filteredInventory();
    const checked = inv.filter(i => i.checked).length;
    const unavailable = inv.filter(i => i.checked && i.status === 'unavailable').length;
    return { checked, unavailable, total: inv.length };
  });

  filteredInventory = computed(() => {
    if (this.selectedCategory() === 'All Items') return this.inventory();
    return this.inventory().filter(i => i.category === this.selectedCategory());
  });

  toggleCategory(name: string) {
    this.selectedCategory.set(name);
  }

  handleCheckboxClick(item: Item) {
    this.inventory.update(items => items.map(i => {
      if (i.id !== item.id) return i;
      if (!i.checked) {
        // mark checked and record timestamp (history)
        return { ...i, checked: true, status: 'available', checkedDate: new Date().toISOString() };
      } else if (i.status === 'available') {
        // toggle to unavailable while staying checked
        return { ...i, status: 'unavailable' };
      } else {
        // third click: uncheck — clear checkedDate so history column is cleared
        return { ...i, checked: false, status: 'available', checkedDate: null };
      }
    }));
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

  openReplaceDialog(item: Item) {
    const ref = this.dialog.open(ReplaceDialogComponent, { width: '420px', data: { item } });
    ref.afterClosed().subscribe((result: any) => {
      if (result && result.expiryDate && result.replacementDate) {
        this.inventory.update(items => items.map(i => i.id === item.id ? {
          ...i,
          expiryDate: result.expiryDate,
          replacementDate: result.replacementDate,
          status: 'available',
          checked: false
        } : i));
      }
    });
  }

  openDetailsForType(type: 'expiring' | 'replaced' | 'checklist') {
    if (type === 'expiring') {
      const now = new Date();
      const seven = new Date();
      seven.setDate(now.getDate() + 7);
      const items = this.filteredInventory().filter(i => i.expiryDate && new Date(i.expiryDate) <= seven && new Date(i.expiryDate) >= now);
      if (items.length) this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'expiring', items } });
    } else if (type === 'replaced') {
      const now = new Date();
      const items = this.filteredInventory().filter(i => i.replacementDate && new Date(i.replacementDate).getMonth() === now.getMonth() && new Date(i.replacementDate).getFullYear() === now.getFullYear());
      if (items.length) this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'replaced', items } });
    } else if (type === 'checklist') {
      const items = this.filteredInventory().filter(i => i.checked);
      if (items.length) this.dialog.open(DetailsDialogComponent, { width: '780px', data: { type: 'checklist', items } });
    }
  }

  openDetailsForItem(item: Item) {
    this.dialog.open(DetailsDialogComponent, { width: '780px', data: item });
  }
}
