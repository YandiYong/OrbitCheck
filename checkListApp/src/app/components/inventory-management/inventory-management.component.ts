import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Item } from '../../models/item';
import { parseAnyDate, formatDDMMYYYY, isBeforeToday, formatDateTimeSAST } from '../../utils/date-utils';
import { DailyChecklistService } from '../../services/daily-checklist.service';
import { InventoryApiService } from '../../services/inventory-api.service';
import { ReplaceDialogComponent } from '../replace-dialog/replace-dialog.component';
import { generateInstances } from '../../utils/instance-utils';
import { DetailsDialogComponent } from '../details-dialog/details-dialog.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { StatsCardComponent } from '../stats-card/stats-card.component';
import { ItemTableComponent } from '../item-table/item-table.component';
import { UsageDialogComponent } from '../usage-dialog/usage-dialog.component';
import { EditItemDialogComponent } from '../edit-item-dialog/edit-item-dialog.component';
import { HttpClientModule } from '@angular/common/http';

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
    MatSelectModule,
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
  providers: [SignatureApiService, InventoryApiService],
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
    <div *ngIf="loading()" style="padding:8px 12px;">
      <mat-card style="background:var(--bg-warning); color:var(--color-warning);">Loading inventory from API…</mat-card>
    </div>
    <div *ngIf="apiError()" style="padding:8px 12px;">
      <mat-card style="background:var(--bg-danger); color:var(--color-danger);">
        <div style="font-weight:700;">API Error</div>
        <div style="margin-top:6px;">{{ apiError() }}</div>
        <div *ngIf="showingCached()" style="margin-top:var(--space-sm); font-size:0.9rem; color:#4b5563;">Showing cached snapshot for today.</div>
      </mat-card>
    </div>
  <div style="display:flex; gap:var(--space-lg); padding:var(--space-md);">
    <mat-sidenav-container style="height:calc(100vh - 64px); width:100%;">
      <mat-sidenav mode="side" opened style="width:260px; padding:var(--space-md); background:var(--color-surface); box-shadow:0 6px 18px rgba(16,24,40,0.06);">
        <app-sidebar
          [categories]="categories()"
          [selectedCategory]="selectedCategory()"
          [previousUnavailable]="previousDayUnavailableChecked()"
          [expiredNeedsReplacement]="expiredNeedsReplacement()"
          [items]="filteredInventory()"
          (selectCategory)="toggleCategory($event)">
        </app-sidebar>
      </mat-sidenav>

      <mat-sidenav-content style="padding:var(--space-sm) var(--space-lg);">
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:var(--space-md); margin-bottom:var(--space-md);">
          <app-stats-card [count]="expiringSoonCount()" title="Expiring in the next 3 months" subtitle="Due for ordering" [subtitleColor]="'#f97316'" borderColor="#f97316" (clicked)="openDetailsForType('expiring')"></app-stats-card>
          <app-stats-card [count]="replacedThisMonthCount()" title="Replacements" subtitle="Replaced items" [subtitleColor]="'#0284c7'" borderColor="#0284c7" (clicked)="openDetailsForType('replaced')"></app-stats-card>
          <app-stats-card [count]="getChecklistStats().checked" title="Checklists Completed" borderColor="#7c3aed" (clicked)="openDetailsForType('checklist')">
            <div *ngIf="getChecklistStats().checked > 0 && getChecklistStats().unavailable === 0" style="display:flex; gap:6px; align-items:center; color:#16a34a; margin-top:6px;">
              <mat-icon>check_circle</mat-icon>
              <span>Checked</span>
            </div>
          </app-stats-card>
        </div>
          
        
        <mat-card style="width:320px; margin-left:1300px; display:inline-block; vertical-align:top;">
          <mat-form-field appearance="fill" style="width:100%; background:var(--color-surface); border-radius:var(--radius-sm); padding:var(--space-xs) var(--space-sm); box-shadow:0 1px 2px rgba(0,0,0,0.04);">
            <mat-label>Session</mat-label>
            <mat-select [value]="selectedSession()" (selectionChange)="selectedSession.set($event.value)">
              <mat-option *ngFor="let s of sessionTypes" [value]="s.key">{{s.label}}</mat-option>
            </mat-select>
          </mat-form-field>
          <div style="display:flex; gap:8px; align-items:center; margin-top:8px;">
            <button mat-flat-button (click)="startSession()" *ngIf="!activeSession()" style="background:var(--color-success); color:white;">Start</button>
            <button mat-flat-button (click)="finishSession()" *ngIf="activeSession()" style="background:var(--color-danger); color:white;">Finish</button>
            <div *ngIf="activeSession()" style="margin-left:var(--space-sm); font-weight:700;">{{ getSessionElapsed() }}</div>
          </div>
        </mat-card>
        
        <mat-card style="background:var(--color-surface); box-shadow:0 8px 30px rgba(2,6,23,0.04);">
          <mat-card-header style="background:var(--bg-info);">
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
    /* Ensure mat-select dropdown panel is opaque and readable */
    ::ng-deep .mat-mdc-select-panel, ::ng-deep .mat-select-panel {
      background-color: white !important;
      color: #111827 !important;
      box-shadow: 0 6px 18px rgba(2,6,23,0.08) !important;
      border-radius: 6px !important;
    }
    ::ng-deep .mat-mdc-select-panel .mat-mdc-list-item, ::ng-deep .mat-select-panel .mat-option {
      background-color: transparent !important;
      color: inherit !important;
    }
  `]
})
export class InventoryManagementComponent implements OnInit, OnDestroy {
  private timerId: any = null;
  sessionTypes = [
    { key: 'morning', label: 'Morning Shift' },
    { key: 'afternoon', label: 'Afternoon Shift' },
    { key: 'emergency', label: 'Emergency Event' }
  ];
  selectedSession = signal<string>('morning');
  activeSession = signal<any | null>(null);
  now = signal<Date>(new Date());
  loading = signal<boolean>(false);
  apiError = signal<string | null>(null);
  showingCached = signal<boolean>(false);
  constructor(private api: SignatureApiService, private inventoryApi: InventoryApiService, private dialog: MatDialog, private dailyService: DailyChecklistService) {}

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
    // update clock every second for timer display
    this.timerId = setInterval(() => this.now.set(new Date()), 1000);
    // restore any active session for today
    const active = this.dailyService.getActiveSession();
    if (active) this.activeSession.set(active);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  private loadInventory() {
    this.loading.set(true);
    this.apiError.set(null);
    this.showingCached.set(false);
    this.inventoryApi.getInventory().subscribe({
      next: raw => {
        console.debug('Inventory API response:', raw);
        this.loading.set(false);
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
          // Accept several shapes: { categories: [...] } or { items: [...] } or other
          if (Array.isArray(raw.categories) && raw.categories.length) {
            cats = raw.categories;
          } else if (Array.isArray(raw.items) && raw.items.length) {
            // top-level items array — wrap into a single category
            cats = [{ category: raw.categoryName ?? raw.category ?? raw.name ?? 'API Items', items: raw.items }];
          } else {
            cats = raw.categories || [];
          }
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
          // Use the component's `parseDate` to avoid ambiguous `Date.parse` behaviour
          const parsed = candidates
            .map(s => ({ raw: s, t: (this.parseDate(String(s)) ? this.parseDate(String(s))!.getTime() : NaN) }))
            .filter(x => !isNaN(x.t));
          if (parsed.length > 0) {
            parsed.sort((a, b) => a.t - b.t);
            return parsed[0].raw;
          }
          // fallback to first candidate if none parse as Date
          return candidates[0] ?? null;
        };

        const pad = (n: number) => (n < 10 ? '0' + n : String(n));

        console.debug('Parsed categories (loader):', cats);
        const items = (cats as unknown as any[]).flatMap(cat => (cat.items || []).map((it: any) => {
          const primaryExpiry = choosePrimaryExpiry(it);

          let expiryDateFormatted: string | null = null;
          if (primaryExpiry) {
            // Try to parse dd/MM/yyyy first (project format). Fall back to Date.parse for ISO-like strings.
            const parsedFromFormat = this.parseDate(String(primaryExpiry));
            if (parsedFromFormat) {
              expiryDateFormatted = `${pad(parsedFromFormat.getDate())}/${pad(parsedFromFormat.getMonth() + 1)}/${parsedFromFormat.getFullYear()}`;
            } else {
              const parsedFallback = this.parseDate(String(primaryExpiry));
              if (parsedFallback) {
                expiryDateFormatted = `${pad(parsedFallback.getDate())}/${pad(parsedFallback.getMonth() + 1)}/${parsedFallback.getFullYear()}`;
              } else if (String(primaryExpiry).indexOf('-') >= 0) {
                const p = String(primaryExpiry).split('-');
                if (p.length === 3) expiryDateFormatted = `${p[2]}/${p[1]}/${p[0]}`;
                else expiryDateFormatted = String(primaryExpiry);
              } else {
                expiryDateFormatted = String(primaryExpiry);
              }
            }
          }

          const ctrlQty = it.controlQuantity ?? 1;
          // normalize variants expiry dates to dd/MM/yyyy for consistent display
          let normalizedVariants: any[] | undefined = undefined;
          const rawVariantsForNormalise = Array.isArray(it.variants) ? it.variants : (Array.isArray(it.items) ? it.items : undefined);
          if (Array.isArray(rawVariantsForNormalise)) {
            normalizedVariants = (rawVariantsForNormalise as any[]).map(v => {
              const dates = (Array.isArray(v.expiryDates) ? v.expiryDates : (v.expiryDate ? [v.expiryDate] : [])).filter(Boolean).map((d: any) => {
                // prefer project dd/MM/yyyy parsing
                const parsedD = this.parseDate(String(d));
                if (parsedD) return `${pad(parsedD.getDate())}/${pad(parsedD.getMonth() + 1)}/${parsedD.getFullYear()}`;
                const parsedFallback = this.parseDate(String(d));
                if (parsedFallback) return `${pad(parsedFallback.getDate())}/${pad(parsedFallback.getMonth() + 1)}/${parsedFallback.getFullYear()}`;
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
            category: it.category ?? cat?.category ?? cat?.categoryName ?? it.categoryName ?? it.group ?? it.type ?? 'Uncategorized',
            expiryDate: expiryDateFormatted,
            controlQuantity: ctrlQty,
            status: normalizedStatus,
            ...(normalizedVariants ? { items: normalizedVariants } : {})
          } as any;
        }));

        this.inventory.set(items);
        console.debug('Mapped items (first 10):', items.slice(0, 10));
        this.loading.set(false);
        this.apiError.set(null);
      },
      error: err => {
        console.error('Failed to load inventory from API', err);
        this.loading.set(false);
        const msg = err?.message ?? (err?.statusText ?? String(err));
        this.apiError.set('Failed to load inventory from API: ' + msg);
        // attempt to show today's snapshot if available
        try {
          const snap = this.dailyService.getSnapshot(new Date());
          if (snap && Array.isArray(snap) && snap.length) {
            this.showingCached.set(true);
            // show minimal cached snapshot as items with limited fields
            const cachedItems = (snap as any[]).map(s => ({ id: s.id, name: s.name, status: s.status, checked: s.checked, checkedDate: s.checkedDate }));
            this.inventory.set(cachedItems);
          }
        } catch (e) {
          // ignore
        }
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

  private parseDate(dateString: string | Date | null): Date | null { return parseAnyDate(dateString); }

  private formatDate(d: Date | null): string | null { return formatDDMMYYYY(d); }

  

  // Open details dialog for a specific item
 public handleCheckboxClick(item: any) {
    // prevent toggling if item is expired and awaiting replacement
    if (this.isExpired(item.expiryDate)) return;

    // If item is currently unchecked and has quantity > 1, show dialog with multiple instances
    if (!item.checked && (typeof item.controlQuantity === 'number' && item.controlQuantity > 1)) {
      // Generate per-instance rows using shared helper, then enrich for the inventory UI
      let instances: any[] = generateInstances(item).map((inst: any) => ({
        ...inst,
        parsedDate: this.parseDate(inst.expiryDate),
        checked: false,
        category: inst.category ?? item.category ?? ''
      }));

      const ref = this.dialog.open(UsageDialogComponent, {
        width: '700px',
        data: {
          item,
          instances,
          isMultipleRequired: true,
          onReplaceImmediate: (index: number, newInst: any) => {
            // Apply a replacement immediately to inventory for visual update
                const now = this.formatDate(new Date()) ?? new Date().toISOString();
            this.inventory.update(items => items.map(i => {
              if (i.id !== item.id) return i;
              const required = i.controlQuantity ?? 0;
              let origItems = Array.isArray((i as any).items) ? (i as any).items : (Array.isArray((i as any).variants) ? (i as any).variants : undefined);
              if (Array.isArray(origItems) && origItems.length) {
                const inst = instances[index];
                const idx = inst?._itemIndex ?? inst?._variantIndex ?? index;
                const newItems = origItems.map((v: any) => ({ ...v }));
                if (newInst?.expiryDate) {
                  newItems[idx] = { ...(newItems[idx] || {}), expiryDate: newInst.expiryDate, replacementDate: now, isReplacement: true };
                }
                const allDates = newItems.map((v: any) => v.expiryDate).filter(Boolean);
                const primary = allDates.length ? allDates.sort()[0] : (newItems[0]?.expiryDate ?? i.expiryDate);
                // compute replacedCount from explicit `isReplacement` flags on instances
                const totalInstances = Math.max(origItems.length, i.controlQuantity || 0, 1);
                const actualReplacedCount = newItems.filter((v: any) => !!v.isReplacement).length;
                const allReplaced = actualReplacedCount >= totalInstances;
                return { ...i, items: newItems, expiryDate: primary, replacementDate: allReplaced ? now : i.replacementDate, replacedCount: actualReplacedCount, checked: false, checkedDate: null, usedToday: null };
              } else {
                // fallback: update top-level expiryDate
                return { ...i, expiryDate: newInst?.expiryDate ?? i.expiryDate, replacementDate: now, replacedCount: 1, checked: false, checkedDate: null, usedToday: null, status: (required > 0 ? 'satisfactory' : 'depleted') };
              }
            }));
            this.saveTodaySnapshot();
          }
        }
      });

      ref.afterClosed().subscribe((res: any) => {
        if (!res || typeof res.used !== 'number') return; // user cancelled or no value
        const availableCount = res.availableCount || 0;
        const notAvailableCount = res.notAvailableCount || 0;
        const updatedDates = res.updatedDates || {};
        const availableIndices: number[] = Array.isArray(res.availableIndices) ? res.availableIndices : [];
        const depletedIndices: number[] = Array.isArray(res.depletedIndices) ? res.depletedIndices : [];

        this.inventory.update(items => items.map(i => {
          if (i.id !== item.id) return i;
          const required = i.controlQuantity ?? 0;
          const nowIso = new Date().toISOString();
          const history = (i.usageHistory ?? []).concat([{ date: nowIso, used: availableCount }]);
          const now = nowIso;

          // Determine if any per-item expiry was updated
          let hasReplacedDate = false;
          const origItems = Array.isArray((i as any).items) ? (i as any).items : (Array.isArray((i as any).variants) ? (i as any).variants : undefined);

          // If the dialog returned per-instance indices, update per-instance availability flags so
          // the main UI and the Replace dialog can show which instances are depleted and which are present.
          if (Array.isArray(origItems) && origItems.length) {
            for (let idx = 0; idx < origItems.length; idx++) {
              const v = origItems[idx] as any;
              // mark available / not available based on indices from the dialog
              if (availableIndices.indexOf(idx) >= 0) {
                v.available = true;
                v.needsReplacement = false;
              } else if (depletedIndices.indexOf(idx) >= 0) {
                v.available = false;
                // flag 'needsReplacement' so ReplaceDialog renders it visually as needing attention
                v.needsReplacement = true;
              }
            }
          }

          if (Array.isArray(origItems) && origItems.length) {
            for (let k = 0; k < instances.length; k++) {
              const inst = instances[k];
              const idx = inst?._itemIndex ?? inst?._variantIndex ?? k;
              if (updatedDates[k] && updatedDates[k] !== (origItems[idx]?.expiryDate ?? (origItems[idx]?.expiryDates ? origItems[idx].expiryDates[0] : null))) {
                hasReplacedDate = true;
                break;
              }
            }
          }

          // Compute status based strictly on controlQuantity (required) and availableCount
          let status: string;
          if (this.isExpired(i.expiryDate)) {
            status = 'expired';
          } else {
            if (availableCount === 0) status = 'depleted';
            else if (availableCount < required) status = 'insufficient';
            else if (availableCount === required) status = 'satisfactory';
            else if (availableCount > required && availableCount <= required + 5) status = 'excessive';
            else status = 'satisfactory';
          }

          const newChecked = true;
          const newItem: any = { ...i, checked: newChecked, status, checkedDate: now, usageHistory: history, usedToday: availableCount };

          if (hasReplacedDate && Array.isArray(origItems) && origItems.length) {
            const newItems = origItems.map((v: any) => ({ ...v }));
            for (let k = 0; k < instances.length; k++) {
              const inst = instances[k];
              const idx = inst?._itemIndex ?? inst?._variantIndex ?? k;
              const newDate = updatedDates[k];
              if (newDate && newItems[idx]) {
                // write back to per-size expiryDate and mark as replacement
                newItems[idx].expiryDate = newDate;
                newItems[idx].replacementDate = now;
                newItems[idx].isReplacement = true;
                // once replaced, clear needsReplacement flag
                newItems[idx].needsReplacement = false;
                newItems[idx].available = true;
              }
            }
            newItem.items = newItems;
            // set primary expiryDate to earliest known (fallback to first)
            const allDates = newItems.map((v: any) => v.expiryDate).filter(Boolean);
            newItem.expiryDate = allDates.length ? allDates[0] : newItem.expiryDate;
            // compute replacedCount from explicit flags (do not accumulate)
            const totalInstances = Math.max(i.controlQuantity || 0, origItems.length, 1);
            const actualReplaced = newItems.filter((v: any) => !!v.isReplacement).length;
            if (actualReplaced) {
              newItem.replacedCount = actualReplaced;
              if ((newItem.replacedCount || 0) >= totalInstances) newItem.replacementDate = now;
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
      const ref = this.dialog.open(UsageDialogComponent, { width: '700px', data: { item } });
      ref.afterClosed().subscribe((res: any) => {
        if (!res || typeof res.used !== 'number') return; // user cancelled or no value
        let used = res.used;
        this.inventory.update(items => items.map(i => {
          if (i.id !== item.id) return i;
          // Do not change quantity, only usedToday and status
          const required = i.controlQuantity ?? 0;
          used = Math.max(0, used); // ensure non-negative
          const nowIso = new Date().toISOString();
          const history = (i.usageHistory ?? []).concat([{ date: nowIso, used }]);
          const now = nowIso;
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
      copy.checkedDate = this.formatDate(new Date()) ?? new Date().toISOString();

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
        const now = this.formatDate(new Date()) ?? new Date().toISOString();
        this.inventory.update(items => items.map(i => {
          if (i.id !== item.id) return i;
          const origItems = Array.isArray(i.items) ? i.items : (Array.isArray(i.variants) ? i.variants : []);
          const returned = result.items;
          // merge returned expiry into existing variant list where possible
          const merged = (origItems.length ? origItems.map((v: any, idx: number) => ({ ...v })) : returned.map((v: any) => ({ ...v })));
          for (let k = 0; k < returned.length; k++) {
            if (merged[k]) {
              const returnedExpiry = returned[k]?.expiryDate ?? null;
              const origExpiry = merged[k]?.expiryDate ?? (Array.isArray(merged[k]?.expiryDates) ? merged[k].expiryDates[0] : null);
              if (returnedExpiry && returnedExpiry !== origExpiry) {
                merged[k].expiryDate = returnedExpiry;
                merged[k].replacementDate = now;
                merged[k].isReplacement = true;
              }
            } else {
              // append any extra returned items
              merged.push({ ...returned[k], replacementDate: returned[k]?.replacementDate ?? now, isReplacement: true });
            }
          }

          // determine primary expiry and replacedCount from flags
          const allDates = merged.map((v: any) => v.expiryDate).filter(Boolean);
          const primary = allDates.length ? allDates.sort()[0] : i.expiryDate;
          const totalInstances = Math.max(i.controlQuantity || 0, merged.length, 1);
          const actualReplaced = merged.filter((v: any) => !!v.isReplacement).length;
          const newItem: any = { ...i, items: merged, expiryDate: primary, checked: false, checkedDate: null, usedToday: null };
          if (actualReplaced) {
            newItem.replacedCount = actualReplaced;
            if (actualReplaced >= totalInstances) newItem.replacementDate = now;
          }
          return newItem;
        }));
        this.saveTodaySnapshot();
        return;
      }
    });
  }

  private saveTodaySnapshot() {
    // snapshot only essential fields to keep storage small
    const snapshot = this.inventory().map(i => ({ id: i.id, name: i.name, category: i.category ?? null, status: i.status, checked: i.checked ?? false, checkedDate: i.checkedDate ?? null }));
    this.dailyService.saveSnapshot(new Date(), snapshot);
  }

  startSession() {
    const session = this.dailyService.startSession(this.selectedSession());
    // persist a lightweight snapshot when starting
    this.saveTodaySnapshot();
    this.activeSession.set(session);
  }

  finishSession() {
    const snapshotEnd = this.inventory().map(i => ({ id: i.id, name: i.name, status: i.status, checked: i.checked ?? false, checkedDate: i.checkedDate ?? null, usedToday: i.usedToday ?? null }));
    const finished = this.dailyService.finishSession(this.selectedSession(), snapshotEnd);
    // persist one more time
    this.saveTodaySnapshot();
    this.activeSession.set(null);
    return finished;
  }

  getSessionElapsed(): string {
    const s = this.activeSession();
    if (!s || !s.startTime) return '00:00:00';
    try {
      const start = this.parseDateTime(String(s.startTime)) ?? new Date(String(s.startTime));
      const diff = Math.max(0, Math.floor((this.now().getTime() - (start ? start.getTime() : this.now().getTime())) / 1000));
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      const pad = (n: number) => (n < 10 ? '0' + n : String(n));
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    } catch (e) {
      return '00:00:00';
    }
  }

  private parseDateTime(dateString: string | Date | null | undefined): Date | null {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    const s = String(dateString).trim();
    if (s.indexOf('T') >= 0) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    const parts = s.split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);
      let hours = 0, minutes = 0, seconds = 0;
      if (parts.length > 1) {
        const t = parts[1];
        const tparts = t.split(':');
        if (tparts.length > 0) hours = parseInt(tparts[0], 10) || 0;
        if (tparts.length > 1) minutes = parseInt(tparts[1], 10) || 0;
        if (tparts.length > 2) seconds = parseInt(tparts[2], 10) || 0;
      }
      const d = new Date(year, month - 1, day, hours, minutes, seconds);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
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
