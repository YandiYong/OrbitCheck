import { Component, computed, inject, signal, OnInit } from '@angular/core';
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
import { DailyChecklistService } from '../../services/daily-checklist.service';
import { environment } from '../../../environments/environment';
import { ReplaceDialogComponent } from '../replace-dialog/replace-dialog.component';
import { DetailsDialogComponent } from '../details-dialog/details-dialog.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { StatsCardComponent } from '../stats-card/stats-card.component';
import { ItemTableComponent } from '../item-table/item-table.component';
import { UsageDialogComponent } from '../usage-dialog/usage-dialog.component';
import { EditItemDialogComponent } from '../edit-item-dialog/edit-item-dialog.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import{DsvSignatureFormComponent,DsvStoredListComponent,SignatureApiService} from 'signature';
import { SignatureWrapperModule } from '../../shared/signature-wrapper.module';


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
    UsageDialogComponent,
    EditItemDialogComponent,
    SidebarComponent,
    StatsCardComponent,
    MatDatepickerModule,
    ItemTableComponent,
    FormsModule,
    SignatureWrapperModule,
    HttpClientModule,
  ],
  providers: [SignatureApiService],
  template: `
  <mat-toolbar color="primary" style="display:flex; justify-content:space-between;">
    <div style="display:flex; align-items:center; gap:8px;">
      <div style="display:flex; ">
        <span style="font-weight:700; font-size:2.2rem;">Emergency Trolley Check List</span>
        <span style="font-size:2rem; opacity:0.9; margin-left:32px;">{{ today | date:'fullDate' }}</span>
      </div>
    </div>
    <div style="display:flex; align-items:center; margin-right:12px;"> 
      <mat-icon >trolley</mat-icon>
    </div>
  </mat-toolbar>

  <div style="display:flex; gap:16px; padding:12px;">
    <mat-sidenav-container style="height:calc(100vh - 64px); width:100%;">
      <mat-sidenav mode="side" opened style="width:260px; padding:12px; background:white; box-shadow:0 6px 18px rgba(16,24,40,0.06);">
        <app-sidebar
          [categories]="categories()"
          [selectedCategory]="selectedCategory()"
          [previousUnavailable]="previousDayUnavailableChecked()"
          [expiredNeedsReplacement]="expiredNeedsReplacement()"
          [items]="filteredInventory()"
          (selectCategory)="toggleCategory($event)">
        </app-sidebar>
      </mat-sidenav>

      <mat-sidenav-content style="padding:8px 16px;">
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:12px;">
          <app-stats-card [count]="expiringSoonCount()" title="Expiring in the next 3 months" subtitle="Due for ordering" [subtitleColor]="'#f97316'" borderColor="#f97316" (clicked)="openDetailsForType('expiring')"></app-stats-card>
          <app-stats-card [count]="replacedThisMonthCount()" title="Replacements" subtitle="Replaced items" [subtitleColor]="'#0284c7'" borderColor="#0284c7" (clicked)="openDetailsForType('replaced')"></app-stats-card>
          <app-stats-card [count]="getChecklistStats().checked" title="Checklists Completed" borderColor="#7c3aed" (clicked)="openDetailsForType('checklist')">
            <div *ngIf="getChecklistStats().checked > 0 && getChecklistStats().unavailable === 0" style="display:flex; gap:6px; align-items:center; color:#16a34a; margin-top:6px;">
              <mat-icon>check_circle</mat-icon>
              <span>Checked</span>
            </div>
          </app-stats-card>
        </div>
          <mat-card  style="margin-left:75rem; width:300px;">
           <mat-form-field  style="width:100%; appearance:fill;">
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
            <app-item-table [items]="dateFilteredItems()" [categories]="categories()" (viewItem)="openDetailsForItem($event)" (editItem)="openEditDialog($event)" (replaceItem)="openReplaceDialog($event)" (toggleCheckbox)="handleCheckboxClick($event)" (toggleSubitem)="handleSubitemToggle($event)"></app-item-table>
          
            
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
export class InventoryManagementComponent implements OnInit {
  constructor(private api: SignatureApiService) {}
  private http = inject(HttpClient);
  private readonly inventoryUrl = environment.inventoryApiUrl;
  private dialog = inject(MatDialog);
  private dailyService = inject(DailyChecklistService);

  // today's date for display
  today: Date = new Date();

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

  // initially empty; populated from API in ngOnInit
  // Use `any[]` here so the runtime objects can match the JSON shape
  // without requiring changes to the `Item` model file.
  inventory = signal<any[]>([]);

  ngOnInit(): void {
    this.loadInventory();
  }

  private loadInventory() {
    this.http.get<any>(this.inventoryUrl).subscribe({
      next: raw => {
        console.debug('Inventory API response:', raw);
        // Accept either { categories: [...] } or an array of categories
        // Also accept a flat array of items (common API shape) and wrap into a category
        let cats: any[] = [];
        if (Array.isArray(raw)) {
          // raw is an array — could be categories or a flat items list
          if (raw.length > 0 && (raw[0].itemName || raw[0].name || raw[0].id)) {
            // looks like a flat items array
            cats = [{ category: 'API Items', items: raw }];
          } else {
            cats = raw;
          }
        } else {
          cats = raw.categories || [];
        }

        // helper: choose earliest/valid expiry from multiple possible fields
        const choosePrimaryExpiry = (it: any): string | null => {
          const candidates: string[] = [];
          if (Array.isArray(it.expiryDates) && it.expiryDates.length) candidates.push(...it.expiryDates.filter(Boolean));
          const otherKeys = ['expiryDate', 'expiry', 'expirationDate', 'expiry_date', 'expiration_date', 'expires'];
          for (const k of otherKeys) if (it[k]) candidates.push(it[k]);
          // also gather expiry dates from variants (e.g., different sizes)
          const rawVariants = Array.isArray(it.variants) ? it.variants : (Array.isArray(it.items) ? it.items : undefined);
          if (Array.isArray(rawVariants)) {
            for (const v of rawVariants) {
              if (Array.isArray(v.expiryDates) && v.expiryDates.length) candidates.push(...v.expiryDates.filter(Boolean));
              if (v.expiryDate) candidates.push(v.expiryDate);
            }
          }
          if (candidates.length === 0) return null;

          // parse candidates into timestamps, prefer valid dates
          const parsed = candidates
            .map(s => ({ raw: s, t: Date.parse(String(s)) }))
            .filter(x => !isNaN(x.t));
          if (parsed.length > 0) {
            parsed.sort((a, b) => a.t - b.t);
            return parsed[0].raw;
          }
          // fallback to first candidate if none parse as Date
          return candidates[0] ?? null;
        };

        const pad = (n: number) => (n < 10 ? '0' + n : String(n));

        const items = (cats as unknown as any[]).flatMap(cat => (cat.items || []).map((it: any) => {
          const primaryExpiry = choosePrimaryExpiry(it);

          let expiryDateFormatted: string | null = null;
          if (primaryExpiry) {
            const parsed = new Date(primaryExpiry);
            if (!isNaN(parsed.getTime())) {
              expiryDateFormatted = `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
            } else if (String(primaryExpiry).indexOf('-') >= 0) {
              const p = String(primaryExpiry).split('-');
              if (p.length === 3) expiryDateFormatted = `${p[2]}/${p[1]}/${p[0]}`;
              else expiryDateFormatted = String(primaryExpiry);
            } else {
              expiryDateFormatted = String(primaryExpiry);
            }
          }

          const ctrlQty = it.controlQuantity ?? it.quantity ?? 1;
          // normalize variants expiry dates to dd/MM/yyyy for consistent display
          let normalizedVariants: any[] | undefined = undefined;
          const rawVariantsForNormalise = Array.isArray(it.variants) ? it.variants : (Array.isArray(it.items) ? it.items : undefined);
          if (Array.isArray(rawVariantsForNormalise)) {
            normalizedVariants = (rawVariantsForNormalise as any[]).map(v => {
              const dates = (Array.isArray(v.expiryDates) ? v.expiryDates : (v.expiryDate ? [v.expiryDate] : [])).filter(Boolean).map((d: any) => {
                const parsed = new Date(d);
                if (!isNaN(parsed.getTime())) return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
                if (String(d).indexOf('-') >= 0) {
                  const p = String(d).split('-');
                  if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
                }
                return String(d);
              });
              return { ...v, expiryDates: dates, expiryDate: dates[0] ?? null };
            });
          }
          let rawStatus = it.status ?? '';
          let normalizedStatus = String(rawStatus).toLowerCase();
          if (normalizedStatus === 'available' || normalizedStatus === 'unchecked' || normalizedStatus === 'available') {
            normalizedStatus = 'pending';
          }

          return {
            ...it,
            name: it.itemName ?? it.name,
            category: it.category ?? cat.category,
            expiryDate: expiryDateFormatted,
            controlQuantity: ctrlQty,
            status: normalizedStatus,
            ...(normalizedVariants ? { items: normalizedVariants } : {})
          } as any;
        }));

        this.inventory.set(items);
      },
      error: err => {
        console.error('Failed to load inventory from API', err);
      }
    });
  }

  selectedCategory = signal<string>('All Items');
  selectedItem = signal<any | { type: string; items: any[] } | null>(null);

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

  private isPast(date?: string | Date | null) {
    if (!date) return false;
    const d = date instanceof Date ? date : this.parseDate(date as string | null);
    if (!d) return false;
    return d.getTime() < new Date().getTime();
  }

  isExpired(date?: string | Date | null) { return this.isPast(date); }

  expiringSoonCount = computed(() => {
  const now = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(now.getMonth() + 3);

  return this.filteredInventory().filter(item => {
    if (!item.expiryDate) return false;

    const expiry = this.parseDate(item.expiryDate);
    if (!expiry) return false;
    
    return expiry >= now && expiry <= threeMonthsFromNow;
  }).length;
});


  replacedThisMonthCount = computed(() => {
    const now = new Date();
    return this.filteredInventory().filter(item => {
      if (!item.replacementDate) return false;
      const r = this.parseDate(item.replacementDate);
      if (!r) return false;
      return r.getMonth() === now.getMonth() && r.getFullYear() === now.getFullYear();
    }).length;
  });

  getChecklistStats = computed(() => {
    const inv = this.filteredInventory();
    const checked = inv.filter(i => i.checked).length;
    const unavailable = inv.filter(i => i.checked && i.status === 'depleted').length;
    return { checked, unavailable, total: inv.length };
  });

  filteredInventory = computed(() => {
    if (this.selectedCategory() === 'All Items') return this.inventory();
    return this.inventory().filter(i => i.category === this.selectedCategory());
  });

  toggleCategory(name: string) {
    this.selectedCategory.set(name);
  }

  private parseDate(dateString: string | Date | null): Date | null {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    const s = String(dateString);
    // Parse dd/MM/yyyy format
    const parts = s.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, month - 1, day);
    }
    // Fallback: try Date.parse
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) return parsed;
    return null;
  }

  // Open details dialog for a specific item
  handleCheckboxClick(item: any) {
    // prevent toggling if item is expired and awaiting replacement
    if (this.isExpired(item.expiryDate)) return;
    
    // If item is currently unchecked and has quantity > 1, show dialog with multiple instances
    if (!item.checked && (typeof item.controlQuantity === 'number' && item.controlQuantity > 1)) {
      // Generate instances for multiple-selection dialog.
      // If the item has `variants`, show each variant expiry as an instance so user can pick sizes.
      let instances: any[] = [];
      const itemVariants = Array.isArray((item as any).variants) ? (item as any).variants : (Array.isArray((item as any).items) ? (item as any).items : undefined);
      if (Array.isArray(itemVariants) && itemVariants.length) {
        for (let vi = 0; vi < itemVariants.length; vi++) {
          const v = itemVariants[vi];
          const vDates = Array.isArray(v.expiryDates) && v.expiryDates.length ? v.expiryDates : (v.expiryDate ? [v.expiryDate] : [null]);
          for (let di = 0; di < vDates.length; di++) {
            const expiry = vDates[di];
            instances.push({
              ...item,
              id: item.id * 1000 + vi * 10 + di,
              expiryDate: expiry,
              parsedDate: this.parseDate(expiry),
              checked: false,
              // metadata to map back to variant/item
              _variantIndex: vi,
              _variantDateIndex: di,
              // show unit/size in the dialog's second column
              name: item.name,
              category: v.description ?? v.size ?? (v.unit ?? ''),
            });
          }
        }
      } else {
        // Fallback: use top-level expiryDates or expiryDate
        const expiryDates = (item as any).expiryDates || [(item as any).expiryDate];
        instances = expiryDates.map((expiry: any, idx: number) => ({
          ...item,
          id: item.id * 1000 + idx, // unique ID for each instance
          expiryDate: expiry,
          parsedDate: this.parseDate(expiry), // Add parsed date for display
          checked: false
        }));
      }
      
      const ref = this.dialog.open(UsageDialogComponent, { 
        width: '700px', 
        data: { item, instances, isMultipleRequired: true } 
      });
      
      ref.afterClosed().subscribe((res: any) => {
        if (!res || typeof res.used !== 'number') return; // user cancelled or no value
        const totalSelected = res.used; // Total count of selected items
        const availableCount = res.availableCount || 0; // Count of items that are available
        const notAvailableCount = res.notAvailableCount || 0; // Count of items that are not available
        const updatedDates = res.updatedDates || {}; // Updated expiry dates for each instance (indexed by instance array)
        
        this.inventory.update(items => items.map(i => {
          if (i.id !== item.id) return i;
          // Do not change quantity, only usedToday and status
          const required = i.controlQuantity ?? 0;
          const history = (i.usageHistory ?? []).concat([{ date: new Date().toISOString(), used: availableCount }]);
          const now = new Date().toISOString();
          
          // Check if any date was changed (indicating a replacement)
          let hasReplacedDate = false;
          // If item uses per-item entries (previously 'variants'), updatedDates map will reference instance indexes with metadata
          const origItems = Array.isArray((i as any).variants) ? (i as any).variants : (Array.isArray((i as any).items) ? (i as any).items : undefined);
          if (Array.isArray(origItems) && origItems.length) {
            for (let k = 0; k < instances.length; k++) {
              const inst = instances[k];
              if (inst && inst._variantIndex != null && updatedDates[k] && updatedDates[k] !== ((origItems?.[inst._variantIndex]?.expiryDates?.[inst._variantDateIndex] ?? null))) {
                hasReplacedDate = true;
                break;
              }
            }
          } else {
            for (let idx = 0; idx < ((i as any).expiryDates?.length || 0); idx++) {
              if (updatedDates[idx] && updatedDates[idx] !== (i as any).expiryDates?.[idx]) {
                hasReplacedDate = true;
                break;
              }
            }
          }
          
          // Determine status based on available count
          let status: string;
          if (this.isExpired(i.expiryDate)) {
            status = 'expired';
          } else if (notAvailableCount > 0) {
            // If any item is not available, check how many are available
            if (availableCount === 0) {
              // All items are not available
              status = 'depleted';
            } else if (availableCount < required) {
              // Some items are not available, but we have some available
              status = 'insufficient';
            } else {
              // All required items are available despite some marked as not available
              status = 'satisfactory';
            }
          } else if (availableCount === required) {
            // All selected items are available and match required count
            status = 'satisfactory';
          } else if (availableCount > required && availableCount <= required + 5) {
            status = 'excessive';
            } else {
              status = 'satisfactory';
            }
          const newChecked = true;
          
          // Update expiryDates array if dates were changed
          const newItem: any = { ...i, checked: newChecked, status, checkedDate: now, usageHistory: history, usedToday: availableCount };
          
          if (hasReplacedDate) {
            if (Array.isArray(origItems) && origItems.length) {
              // Apply updates into per-item expiry arrays
              const newItems = origItems.map((v: any) => ({ ...v }));
              for (let k = 0; k < instances.length; k++) {
                const inst = instances[k];
                if (!inst || inst._variantIndex == null) continue;
                const vi = inst._variantIndex;
                const di = inst._variantDateIndex ?? 0;
                const newDate = updatedDates[k];
                if (newDate) {
                  newItems[vi].expiryDates = Array.isArray(newItems[vi].expiryDates) ? [...newItems[vi].expiryDates] : (newItems[vi].expiryDates ? [newItems[vi].expiryDates] : []);
                  newItems[vi].expiryDates[di] = newDate;
                }
              }
              newItem.items = newItems;
              // update primary expiryDate to earliest item expiry (if any)
              const allDates = newItems.flatMap((v: any) => v.expiryDates || []);
              newItem.expiryDate = allDates.length ? allDates.sort()[0] : newItem.expiryDate;
              newItem.replacementDate = now;
            } else {
              // Update the expiryDates array with new dates
              const newDates = ((i as any).expiryDates || []).map((date: any, idx: number) => updatedDates[idx] || date);
              newItem.expiryDates = newDates;
              newItem.expiryDate = newDates[0]; // Update primary expiryDate to first date
              newItem.replacementDate = now; // Mark as replacement
            }
          }
          
          return newItem;
        }));
        this.saveTodaySnapshot();
      });
      return;
    }
    
    // We'll handle the "checking" action specially so we can collect used quantity when present.
    // If item is currently unchecked and has a numeric quantity, open a dialog to record usage.
    if (!item.checked && (typeof item.controlQuantity === 'number')) {
      const ref = this.dialog.open(UsageDialogComponent, { width: '420px', data: { item } });
      ref.afterClosed().subscribe((res: any) => {
        if (!res || typeof res.used !== 'number') return; // user cancelled or no value
        let used = res.used;
        this.inventory.update(items => items.map(i => {
          if (i.id !== item.id) return i;
          // Do not change quantity, only usedToday and status
          const required = i.controlQuantity ?? 0;
          used = Math.max(0, used); // ensure non-negative
          const history = (i.usageHistory ?? []).concat([{ date: new Date().toISOString(), used }]);
          const now = new Date().toISOString();
          // Determine status based on usedToday and required (quantity)
          let status: string;
          if (this.isExpired(i.expiryDate)) {
            status = 'expired';
          } else if (typeof used === 'number' && typeof required === 'number') {
            if (used === 0) status = 'depleted';
            else if (used < required) status = 'insufficient';
            else if (used === required) status = 'satisfactory';
            else if (used > required && used <= required + 5) status = 'excessive';
            else status = 'satisfactory';
          } else {
            status = 'satisfactory';
          }
          const newChecked = true;
          return { ...i, checked: newChecked, status, checkedDate: now, usageHistory: history, usedToday: used };
        }));
        this.saveTodaySnapshot();
      });
      return;
    }

    // Otherwise fallback to previous toggle behavior (no quantity prompt)
    this.inventory.update(items => items.map(i => {
      if (i.id !== item.id) return i;
      if (!i.checked) {
        // mark checked and record timestamp (history)
        // if item has subitems, mark them checked too
        if ((i as any).syringes && Array.isArray((i as any).syringes)) {
          const syr = (i as any).syringes.map((s: any) => ({ ...s, checked: true }));
          return { ...i, checked: true, status: 'satisfactory', checkedDate: new Date().toISOString(), syringes: syr };
        }
        return { ...i, checked: true, status: 'satisfactory', checkedDate: new Date().toISOString() };
      } else {
        // second/next click: uncheck — clear checkedDate so history column is cleared
        // if item has subitems, clear their checked flags too
        if ((i as any).syringes && Array.isArray((i as any).syringes)) {
          const syr = (i as any).syringes.map((s: any) => ({ ...s, checked: false }));
          return { ...i, checked: false, status: 'satisfactory', checkedDate: null, syringes: syr };
        }
        return { ...i, checked: false, status: 'satisfactory', checkedDate: null };
      }
    }));
    // persist today's snapshot after change
    this.saveTodaySnapshot();
  }

  handleSubitemToggle(event: { itemId: number; index: number }) {
    this.inventory.update(items => items.map(i => {
      if (i.id !== event.itemId) return i;
      // prevent toggling subitems if the parent item is expired
      if (this.isExpired(i.expiryDate)) return i;
      const copy: any = { ...i };
      if (!copy.syringes || !Array.isArray(copy.syringes)) return i;

      // Toggle availability for the specific subitem; mark it as checked
      const syr = copy.syringes.map((s: any, idx: number) => {
        if (idx !== event.index) return s;
        return { ...s, available: !s.available, checked: true };
      });
      copy.syringes = syr;

      // Parent should be checked and have a checkedDate when subitem toggled
      copy.checked = true;
      copy.checkedDate = new Date().toISOString();

      // If any subitem is not available, parent becomes 'depleted'
      const anyNotAvailable = syr.some((s: any) => s.available === false);
      copy.status = anyNotAvailable ? 'depleted' : 'satisfactory';

      return copy;
    }));
    // persist today's snapshot after change
    this.saveTodaySnapshot();
  }

  getCheckboxStyle(item: any) {
    if (item.checked && item.status === 'depleted') {
      return { borderColor: '#ef4444', backgroundColor: '#fff1f2' };
    } else if (item.checked) {
      return { borderColor: '#16a34a', backgroundColor: '#ecfdf5' };
    } else {
      return { borderColor: '#d1d5db', backgroundColor: 'white' };
    }
  }

  openReplaceDialog(item: any) {
    const ref = this.dialog.open(ReplaceDialogComponent, { width: '900px', maxWidth: '95vw', data: { item } });
    ref.afterClosed().subscribe((result: any) => {
      if (result && result.expiryDate && result.replacementDate) {
        const ctrlQty = typeof result.controlQuantity === 'number' ? result.controlQuantity : (item.controlQuantity ?? 0);
        this.inventory.update(items => items.map(i => i.id === item.id ? {
          ...i,
          expiryDate: result.expiryDate,
          replacementDate: result.replacementDate,
          status: ctrlQty > 0 ? 'satisfactory' : 'depleted',
          checked: false,
          checkedDate: null,
          controlQuantity: ctrlQty,
          usedToday: null
        } : i));
        // persist after replacement
        this.saveTodaySnapshot();
        return;
      }

      // Support replacing per-item entries (formerly 'variants') returned as `items`
      if (result && Array.isArray(result.items)) {
        const now = new Date().toISOString();
        this.inventory.update(items => items.map(i => {
          if (i.id !== item.id) return i;
          const newItems = result.items;
          const allDates = newItems.flatMap((v: any) => (Array.isArray(v.expiryDates) ? v.expiryDates : (v.expiryDate ? [v.expiryDate] : []))).filter(Boolean);
          const primary = allDates.length ? allDates.sort()[0] : (newItems[0]?.expiryDate ?? i.expiryDate);
          return { ...i, items: newItems, expiryDate: primary, replacementDate: now, checked: false, checkedDate: null, usedToday: null };
        }));
        this.saveTodaySnapshot();
        return;
      }
    });
  }

  private saveTodaySnapshot() {
    // snapshot only essential fields to keep storage small
    const snapshot = this.inventory().map(i => ({ id: i.id, name: i.name, status: i.status, checked: i.checked ?? false, checkedDate: i.checkedDate ?? null }));
    this.dailyService.saveSnapshot(new Date(), snapshot);
  }

  // summary: previous day's items that were checked and not available
  previousDayUnavailableChecked() {
    const prev = this.dailyService.getPreviousSnapshot();
    if (!prev) return [];
    return (prev as any[]).filter((p: any) => p.checked && p.status === 'depleted');
  }

  // expired items needing replacement
  expiredNeedsReplacement() {
    const now = new Date();
    return this.filteredInventory().filter(i => {
      if (!i.expiryDate) return false;
      const e = this.parseDate(i.expiryDate);
      if (!e) return false;
      return e < now && !i.replacementDate;
    });
  }

  openDetailsForType(type: 'expiring' | 'replaced' | 'checklist') {
  if (type === 'expiring') {
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);

    const items = this.filteredInventory().filter(i => {
      if (!i.expiryDate) return false;

      const expiry = this.parseDate(i.expiryDate);
      if (!expiry) return false;
      
      return expiry >= now && expiry <= threeMonthsFromNow;
    });

    if (items.length) {
      this.dialog.open(DetailsDialogComponent, {
        width: '780px',
        data: { type: 'expiring', items }
      });
    }

  } else if (type === 'replaced') {
    const now = new Date();

    const items = this.filteredInventory().filter(i => {
      if (!i.replacementDate) return false;

      const replaced = this.parseDate(i.replacementDate);
      if (!replaced) return false;
      
      return (
        replaced.getMonth() === now.getMonth() &&
        replaced.getFullYear() === now.getFullYear()
      );
    });

    if (items.length) {
      this.dialog.open(DetailsDialogComponent, {
        width: '780px',
        data: { type: 'replaced', items }
      });
    }

  } else if (type === 'checklist') {
    const items = this.filteredInventory().filter(i => i.checked);

    if (items.length) {
      this.dialog.open(DetailsDialogComponent, {
        width: '780px',
        data: { type: 'checklist', items }
      });
    }
  }
}


  openDetailsForItem(item: any) {
    this.dialog.open(DetailsDialogComponent, { width: '780px', data: item });
  }

  openEditDialog(item: any) {
    const ref = this.dialog.open(EditItemDialogComponent, { width: '520px', data: { item } });
    ref.afterClosed().subscribe((res: any) => {
      if (!res) return;
      const { name, expiryDate, controlQuantity } = res;
      this.inventory.update(items => items.map(i => i.id === item.id ? {
        ...i,
        name: typeof name === 'string' ? name : i.name,
        expiryDate: expiryDate ?? i.expiryDate,
        controlQuantity: typeof controlQuantity === 'number' ? controlQuantity : i.controlQuantity
      } : i));
      this.saveTodaySnapshot();
    });
  }
   
}
