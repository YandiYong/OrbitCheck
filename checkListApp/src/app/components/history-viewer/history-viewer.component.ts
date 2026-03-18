import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DailyChecklistService } from '../../services/daily-checklist.service';
import { CompletedChecklistRecord } from '../../models/item';

@Component({
  selector: 'app-history-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <!-- Header -->
    <div class="hv-header">
      <mat-icon class="hv-header-icon">history</mat-icon>
      <h2 class="hv-title">Checklist History</h2>
      <button mat-icon-button class="hv-close" (click)="close()" aria-label="Close">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <div class="hv-body">
      <!-- Left: date list -->
      <div class="hv-dates">
        <div class="hv-dates-header">
          <mat-icon style="font-size:1rem;width:1rem;height:1rem;vertical-align:middle;">calendar_month</mat-icon>
          &nbsp;Available Dates
        </div>

        <div class="hv-date-filter-wrap">
          <mat-form-field appearance="outline" class="hv-date-field">
            <mat-label>Filter by date</mat-label>
            <input
              matInput
              [matDatepicker]="datePicker"
              [value]="selectedFilterDate()"
              (dateChange)="onDatePicked($event.value)"
              placeholder="dd/mm/yyyy"
              aria-label="Filter checklist date" />
            <mat-datepicker-toggle matIconSuffix [for]="datePicker"></mat-datepicker-toggle>
            <mat-datepicker #datePicker></mat-datepicker>
          </mat-form-field>
          <button mat-stroked-button class="hv-clear-btn" (click)="clearDateFilter()" [disabled]="!selectedFilterDate()">
            Clear
          </button>
        </div>

        <div *ngIf="historyDates().length === 0" class="hv-empty-dates">
          <mat-icon style="font-size:2rem;width:2rem;height:2rem;color:#9ca3af;">inbox</mat-icon>
          <p>No history saved yet.</p>
        </div>

        <div *ngIf="historyDates().length > 0 && filteredHistoryDates().length === 0" class="hv-empty-dates">
          <mat-icon style="font-size:2rem;width:2rem;height:2rem;color:#9ca3af;">search_off</mat-icon>
          <p>No records found for selected date.</p>
        </div>

        <button
          *ngFor="let d of filteredHistoryDates()"
          class="hv-date-btn"
          [class.hv-date-active]="isSameDay(d, selectedDate())"
          (click)="selectDate(d)">
          <span class="hv-date-label">{{ formatDate(d) }}</span>
          <span class="hv-date-badge">{{ recordCountFor(d) }}</span>
        </button>
      </div>

      <!-- Right: records detail -->
      <div class="hv-detail">
        <div *ngIf="!selectedDate()" class="hv-pick-prompt">
          <mat-icon style="font-size:3rem;width:3rem;height:3rem;color:#9ca3af;">event_note</mat-icon>
          <p>Select a date on the left to view its completed checklists.</p>
        </div>

        <ng-container *ngIf="selectedDate()">
          <div class="hv-detail-title">
            <mat-icon style="font-size:1.1rem;width:1.1rem;height:1.1rem;vertical-align:middle;">today</mat-icon>
            &nbsp;{{ formatDate(selectedDate()!) }}
            <span class="hv-record-count">{{ selectedRecords().length }} session{{ selectedRecords().length !== 1 ? 's' : '' }}</span>
          </div>

          <div *ngIf="selectedRecords().length === 0" class="hv-empty-records">
            No completed checklists found for this date.
          </div>

          <div *ngFor="let rec of selectedRecords(); let i = index" class="hv-record-card">
            <!-- Session badge + timing -->
            <div class="hv-record-top">
              <span class="hv-session-badge" [class]="'hv-session-' + sessionClass(rec.session.type)">
                {{ rec.session.type }}
              </span>
              <span class="hv-timing">
                <mat-icon style="font-size:0.95rem;width:0.95rem;height:0.95rem;vertical-align:middle;">schedule</mat-icon>
                {{ rec.session.startTime || '—' }}
                <span *ngIf="rec.session.endTime"> – {{ rec.session.endTime }}</span>
                <span *ngIf="rec.session.durationSeconds != null" class="hv-duration">
                  &nbsp;({{ formatDuration(rec.session.durationSeconds!) }})
                </span>
              </span>
              <span class="hv-saved-at">Saved: {{ rec.savedAt }}</span>
            </div>

            <!-- Summary bar -->
            <div class="hv-summary">
              <div class="hv-summary-item hv-ok">
                <mat-icon>check_circle</mat-icon>
                <span>{{ rec.summary.checkedItems }} / {{ rec.summary.totalItems }} checked</span>
              </div>
              <div class="hv-summary-item hv-depleted" *ngIf="rec.summary.depletedItems > 0">
                <mat-icon>remove_shopping_cart</mat-icon>
                <span>{{ rec.summary.depletedItems }} depleted</span>
              </div>
              <div class="hv-summary-item hv-expired" *ngIf="rec.summary.expiredItems > 0">
                <mat-icon>warning_amber</mat-icon>
                <span>{{ rec.summary.expiredItems }} expired</span>
              </div>
            </div>

            <!-- Progress bar -->
            <mat-progress-bar
              mode="determinate"
              [value]="progressPct(rec)"
              style="height:8px; border-radius:4px; margin:8px 0 12px;">
            </mat-progress-bar>

            <!-- Signature -->
            <div class="hv-signature" *ngIf="rec.signature">
              <div class="hv-sig-row">
                <mat-icon style="font-size:1rem;width:1rem;height:1rem;">verified_user</mat-icon>
                <span><strong>Signed by:</strong> {{ rec.signature.user }}</span>
              </div>
              <div class="hv-sig-row" *ngIf="rec.signature.signedFor">
                <mat-icon style="font-size:1rem;width:1rem;height:1rem;">person</mat-icon>
                <span><strong>For:</strong> {{ rec.signature.signedFor }}</span>
              </div>
              <div class="hv-sig-row" *ngIf="rec.signature.purpose">
                <mat-icon style="font-size:1rem;width:1rem;height:1rem;">assignment</mat-icon>
                <span><strong>Purpose:</strong> {{ rec.signature.purpose }}</span>
              </div>
              <div class="hv-sig-image-row" *ngIf="rec.signature.image">
                <img [src]="rec.signature.image" alt="Signature" class="hv-sig-img"
                     matTooltip="Signature image" />
              </div>
            </div>

            <!-- Item list toggle -->
            <div class="hv-record-actions" *ngIf="rec.items && rec.items.length > 0">
              <button
                mat-stroked-button
                class="hv-items-toggle"
                (click)="toggleItems(rec.id)">
                <mat-icon>{{ expandedRecord() === rec.id ? 'expand_less' : 'expand_more' }}</mat-icon>
                {{ expandedRecord() === rec.id ? 'Hide' : 'Show' }} items ({{ rec.items.length }})
              </button>
              <button
                mat-stroked-button
                class="hv-export-csv"
                (click)="exportRecordItemsCsv(rec)">
                <mat-icon>download</mat-icon>
                Export CSV
              </button>
            </div>

            <!-- Expanded item list -->
            <div *ngIf="expandedRecord() === rec.id && rec.items" class="hv-items-table">
              <div class="hv-items-header-row">
                <span class="hv-col-name">Item</span>
                <span class="hv-col-cat">Category</span>
                <span class="hv-col-status">Status</span>
                <span class="hv-col-checked">Checked</span>
                <span class="hv-col-expiry">Expiry</span>
              </div>
              <div *ngFor="let item of rec.items" class="hv-item-row" [class.hv-item-checked]="item.checked">
                <span class="hv-col-name">
                  <mat-icon *ngIf="item.checked" style="font-size:0.9rem;width:0.9rem;height:0.9rem;color:#16a34a;vertical-align:middle;">check</mat-icon>
                  {{ item.name }}
                </span>
                <span class="hv-col-cat hv-muted">{{ item.category || '—' }}</span>
                <span class="hv-col-status">
                  <span class="hv-status-chip" [class]="'hv-status-' + item.status">{{ item.status }}</span>
                </span>
                <span class="hv-col-checked hv-muted">{{ item.checkedDate || '—' }}</span>
                <span class="hv-col-expiry hv-muted">{{ item.expiryDate || '—' }}</span>
              </div>
            </div>

            <mat-divider *ngIf="i < selectedRecords().length - 1" style="margin:16px 0;"></mat-divider>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: 'Roboto', sans-serif;
      overflow: hidden;
    }
    .hv-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px 12px;
      border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #1e3a5f 0%, #0284c7 100%);
      color: white;
      flex-shrink: 0;
    }
    .hv-header-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }
    .hv-title { margin: 0; font-size: 1.25rem; font-weight: 800; flex: 1; }
    .hv-close { color: rgba(255,255,255,0.85); }
    .hv-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    /* ── Date column ── */
    .hv-dates {
      width: 180px;
      flex-shrink: 0;
      border-right: 1px solid #e5e7eb;
      overflow-y: auto;
      padding: 8px 0;
      background: #f8fafc;
    }
    .hv-dates-header {
      padding: 8px 14px 6px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6b7280;
    }
    .hv-date-filter-wrap {
      margin: 6px 10px 8px;
      padding: 8px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .hv-date-field {
      width: 100%;
      margin-bottom: -1.25em;
    }
    .hv-clear-btn {
      width: 100%;
      font-size: 0.78rem;
      border-color: #bae6fd;
      color: #0369a1;
    }
    .hv-empty-dates {
      display: flex; flex-direction: column; align-items: center;
      padding: 24px 12px; color: #9ca3af; font-size: 0.82rem; text-align: center;
    }
    .hv-date-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 9px 14px;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
      font-size: 0.88rem;
      color: #374151;
      border-radius: 0;
      transition: background 0.15s;
    }
    .hv-date-btn:hover { background: #e0f2fe; color: #0284c7; }
    .hv-date-active {
      background: #dbeafe !important;
      color: #1d4ed8 !important;
      font-weight: 700;
      border-left: 3px solid #1d4ed8;
    }
    .hv-date-label { flex: 1; }
    .hv-date-badge {
      background: #0284c7;
      color: white;
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 0.72rem;
      font-weight: 700;
    }
    /* ── Detail column ── */
    .hv-detail {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
      min-width: 0;
    }
    .hv-pick-prompt {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; color: #9ca3af; text-align: center; gap: 12px; font-size: 0.95rem;
    }
    .hv-detail-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .hv-record-count {
      margin-left: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #6b7280;
      background: #f3f4f6;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .hv-empty-records { color: #9ca3af; font-size: 0.9rem; padding: 16px 0; }
    .hv-record-card { margin-bottom: 4px; }
    /* Top row */
    .hv-record-top {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .hv-session-badge {
      padding: 3px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .hv-session-pre  { background: #dcfce7; color: #15803d; }
    .hv-session-post { background: #dbeafe; color: #1d4ed8; }
    .hv-session-resus { background: #fef3c7; color: #b45309; }
    .hv-session-audit { background: #f3e8ff; color: #7e22ce; }
    .hv-timing { font-size: 0.85rem; color: #374151; display: flex; align-items: center; gap: 4px; }
    .hv-duration { color: #6b7280; font-size: 0.8rem; }
    .hv-saved-at { margin-left: auto; font-size: 0.75rem; color: #9ca3af; }
    /* Summary */
    .hv-summary {
      display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 4px;
    }
    .hv-summary-item {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.83rem; font-weight: 600;
    }
    .hv-ok { color: #16a34a; }
    .hv-depleted { color: #dc2626; }
    .hv-expired  { color: #f97316; }
    .hv-ok mat-icon, .hv-depleted mat-icon, .hv-expired mat-icon {
      font-size: 1rem; width: 1rem; height: 1rem;
    }
    /* Signature */
    .hv-signature {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
    }
    .hv-sig-row {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.83rem; color: #374151; margin-bottom: 4px;
    }
    .hv-sig-image-row { margin-top: 8px; }
    .hv-sig-img {
      max-width: 220px;
      max-height: 80px;
      border: 1px solid #d1fae5;
      border-radius: 4px;
      background: white;
    }
    /* Items toggle */
    .hv-items-toggle {
      font-size: 0.82rem;
      margin-bottom: 10px;
      color: #0284c7;
      border-color: #bae6fd;
    }
    .hv-record-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .hv-record-actions .hv-items-toggle {
      margin-bottom: 0;
    }
    .hv-export-csv {
      font-size: 0.82rem;
      color: #065f46;
      border-color: #a7f3d0;
      background: #ecfdf5;
    }
    /* Items table */
    .hv-items-table {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      font-size: 0.8rem;
      margin-bottom: 8px;
    }
    .hv-items-header-row, .hv-item-row {
      display: grid;
      grid-template-columns: 2fr 1.2fr 1fr 1.5fr 1.2fr;
      padding: 6px 10px;
      align-items: center;
    }
    .hv-items-header-row {
      background: #f3f4f6;
      font-weight: 700;
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .hv-item-row { border-top: 1px solid #f3f4f6; color: #374151; }
    .hv-item-row:hover { background: #f9fafb; }
    .hv-item-checked { background: #f0fdf4 !important; }
    .hv-muted { color: #9ca3af; }
    /* Status chips */
    .hv-status-chip {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: capitalize;
    }
    .hv-status-pending       { background: #f3f4f6; color: #6b7280; }
    .hv-status-satisfactory  { background: #dcfce7; color: #15803d; }
    .hv-status-insufficient  { background: #fef3c7; color: #b45309; }
    .hv-status-excessive     { background: #dbeafe; color: #1d4ed8; }
    .hv-status-depleted      { background: #fee2e2; color: #dc2626; }
    .hv-status-expired       { background: #ffedd5; color: #c2410c; }
  `]
})
export class HistoryViewerComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<HistoryViewerComponent>);
  private dailyService = inject(DailyChecklistService);

  historyDates = signal<Date[]>([]);
  selectedFilterDate = signal<Date | null>(null);
  selectedDate = signal<Date | null>(null);
  selectedRecords = signal<CompletedChecklistRecord[]>([]);
  expandedRecord = signal<string | null>(null);

  filteredHistoryDates = computed(() => {
    const picked = this.selectedFilterDate();
    if (!picked) return this.historyDates();

    return this.historyDates().filter((d) => this.isSameDay(d, picked));
  });

  /** Cache of record counts per date key for the badge. */
  private recordCountCache = new Map<string, number>();

  ngOnInit() {
    const dates = this.dailyService.getHistoryDates();
    this.historyDates.set(dates);
    // Pre-cache counts
    for (const d of dates) {
      const recs = this.dailyService.getCompletedChecklists(d);
      this.recordCountCache.set(this.dateKey(d), recs.length);
    }
    // Auto-select the most recent date if any
    if (dates.length > 0) this.selectDate(dates[0]);
  }

  selectDate(d: Date) {
    this.selectedDate.set(d);
    this.expandedRecord.set(null);
    const records = this.dailyService.getCompletedChecklists(d);
    this.selectedRecords.set(records);
  }

  onDatePicked(value: Date | null) {
    this.selectedFilterDate.set(value ? new Date(value) : null);
    this.syncSelectionWithFilter();
  }

  clearDateFilter() {
    this.selectedFilterDate.set(null);
    this.syncSelectionWithFilter();
  }

  private syncSelectionWithFilter() {
    const current = this.selectedDate();
    const filtered = this.filteredHistoryDates();
    if (!current && filtered.length > 0) {
      this.selectDate(filtered[0]);
      return;
    }

    if (current && !filtered.some(d => this.isSameDay(d, current))) {
      if (filtered.length > 0) {
        this.selectDate(filtered[0]);
      } else {
        this.selectedDate.set(null);
        this.selectedRecords.set([]);
        this.expandedRecord.set(null);
      }
    }
  }

  toggleItems(id: string) {
    this.expandedRecord.set(this.expandedRecord() === id ? null : id);
  }

  recordCountFor(d: Date): number {
    return this.recordCountCache.get(this.dateKey(d)) ?? 0;
  }

  isSameDay(a: Date, b: Date | null): boolean {
    if (!b) return false;
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  formatDate(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatDuration(secs: number): string {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }

  progressPct(rec: CompletedChecklistRecord): number {
    if (!rec.summary.totalItems) return 0;
    return Math.round((rec.summary.checkedItems / rec.summary.totalItems) * 100);
  }

  exportRecordItemsCsv(rec: CompletedChecklistRecord) {
    const rows = Array.isArray(rec.items) ? rec.items : [];
    if (!rows.length) return;

    const headers = ['id', 'name', 'category', 'status', 'checked', 'checkedDate', 'controlQuantity', 'usedToday', 'expiryDate', 'replacementDate'];
    const escapeCsv = (value: unknown): string => {
      if (value == null) return '';
      const s = String(value);
      if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines: string[] = [];
    lines.push(headers.join(','));
    for (const item of rows) {
      const vals = [
        item.id,
        item.name,
        item.category,
        item.status,
        item.checked,
        item.checkedDate,
        item.controlQuantity,
        item.usedToday,
        item.expiryDate,
        item.replacementDate,
      ];
      lines.push(vals.map(escapeCsv).join(','));
    }

    const csv = lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const datePart = (rec.checklistDate ?? 'date').replace(/[^0-9]/g, '-');
    const sessionPart = (rec.session?.type ?? 'session').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fileName = `checklist-items-${datePart}-${sessionPart}.csv`;

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }

  sessionClass(type: string): string {
    if (!type) return 'audit';
    const t = type.toLowerCase();
    if (t.startsWith('pre')) return 'pre';
    if (t.startsWith('post-s')) return 'post';
    if (t.includes('resus')) return 'resus';
    return 'audit';
  }

  close() { this.dialogRef.close(); }

  private dateKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
}
