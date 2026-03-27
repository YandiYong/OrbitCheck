import { Injectable } from '@angular/core';
import { formatDateTimeSAST, parseAnyDate, isBeforeToday } from '../utils/date-utils';
import { CompletedChecklistRecord, CompletedChecklistSignature, CompletedChecklistSubItem, Session } from '../models/item';

@Injectable({ providedIn: 'root' })
export class DailyChecklistService {
  private sessionsPrefix = 'sessions-';
  private sessionsByDateKey = new Map<string, any[]>();

  constructor() {}

  private formatDate(value: Date | string | null | undefined) {
    let d: Date | null = null;

    if (value instanceof Date) {
      d = value;
    } else if (typeof value === 'string') {
      // Accept dd/MM/yyyy HH:mm:ss (and dd/MM/yyyy HH:mm) explicitly.
      const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        const hours = match[4] ? parseInt(match[4], 10) : 0;
        const minutes = match[5] ? parseInt(match[5], 10) : 0;
        const seconds = match[6] ? parseInt(match[6], 10) : 0;
        const parsed = new Date(year, month - 1, day, hours, minutes, seconds);
        if (!isNaN(parsed.getTime())) d = parsed;
      }

      if (!d) d = parseAnyDate(value);
      if (!d) d = new Date(value);
    }

    if (!d || isNaN(d.getTime())) return '';

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${m}/${y}`;
  }

  /**
   * Parse any date value (Date, dd/MM/yyyy, dd/MM/yyyy HH:mm:ss, ISO string)
   * and return it formatted as 'dd/MM/yyyy HH:mm:ss' for the API.
   */
  private toApiDateTime(value: any): string | null {
    if (!value) return null;
    let d: Date | null = null;
    if (value instanceof Date) {
      d = value;
    } else if (typeof value === 'string') {
      const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
      if (match) {
        d = new Date(
          parseInt(match[3], 10),
          parseInt(match[2], 10) - 1,
          parseInt(match[1], 10),
          match[4] ? parseInt(match[4], 10) : 0,
          match[5] ? parseInt(match[5], 10) : 0,
          match[6] ? parseInt(match[6], 10) : 0
        );
        if (isNaN(d.getTime())) d = null;
      }
      if (!d) d = parseAnyDate(value);
    }
    if (!d || isNaN(d.getTime())) return null;
    return formatDateTimeSAST(d) ?? d.toISOString();
  }

  saveSnapshot(date: Date, items: any[]) {
    void date;
    void items;
  }

  getSnapshot(date: Date) {
    void date;
    return null;
  }

  getPreviousSnapshot() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return this.getSnapshot(d);
  }

  saveCompletedChecklist(record: CompletedChecklistRecord, date: Date = new Date()) {
    void record;
    void date;
    return false;
  }

  getCompletedChecklists(date: Date = new Date()) {
    void date;
    return [] as CompletedChecklistRecord[];
  }

  buildCompletedChecklistRecord(
    sessionType: Session['sessionType'],
    activeSession: any,
    items: any[],
    date: Date = new Date(),
    signature: CompletedChecklistSignature
  ): CompletedChecklistRecord {
    const now = new Date();
    const savedAt = formatDateTimeSAST(now) ?? now.toISOString();

    const mappedItems = (items ?? []).map((i: any) => {
      const rawSubItems: any[] = Array.isArray(i.items) && i.items.length
        ? i.items
        : (Array.isArray(i.subItems) && i.subItems.length ? i.subItems : []);

      const mappedSubItems: CompletedChecklistSubItem[] = rawSubItems.map((s: any) => ({
        id: typeof s.id === 'number' ? s.id : Number(s.id) || 0,
        expiryDate: this.toApiDateTime(s.expiryDate),
        description: s.description ?? null,
        replacementDate: this.toApiDateTime(s.replacementDate),
        checkedDate: this.toApiDateTime(s.checkedDate)
      }));

      return {
        id: i.id,
        name: i.name,
        category: i.category ?? null,
        status: i.status,
        checked: i.checked ?? false,
        checkedDate: this.toApiDateTime(i.checkedDate),
        controlQuantity: typeof i.controlQuantity === 'number' ? i.controlQuantity : null,
        available: typeof i.available === 'number' ? i.available : null,
        expiryDate: this.toApiDateTime(i.expiryDate),
        replacementDate: this.toApiDateTime(i.replacementDate),
        displayItemId: typeof i.displayItemId === 'number' ? i.displayItemId : (i.displayItemId != null ? Number(i.displayItemId) || null : null),
        displaySubItemId: typeof i.displaySubItemId === 'number' ? i.displaySubItemId : (i.displaySubItemId != null ? Number(i.displaySubItemId) || null : null),
        ...(mappedSubItems.length ? { subItems: mappedSubItems } : {})
      };
    });

    const totalRequired = (items ?? []).reduce((sum: number, i: any) => {
      const required = typeof i.controlQuantity === 'number' ? i.controlQuantity : 1;
      return sum + required;
    }, 0);

    const formatTimeOnly = (value: any): string | null => {
      const parsed = value instanceof Date ? value : this.parseDateTime(value);
      if (!parsed || isNaN(parsed.getTime())) return null;
      const hh = String(parsed.getHours()).padStart(2, '0');
      const mm = String(parsed.getMinutes()).padStart(2, '0');
      const ss = String(parsed.getSeconds()).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    };

    const startTime = activeSession?.startTime ? formatTimeOnly(activeSession.startTime) : null;
    const endTime = activeSession?.endTime ? formatTimeOnly(activeSession.endTime) : null;
    const durationSeconds = activeSession?.durationSeconds ?? null;

    // Always ensure session is built with at least the type, even if activeSession is missing
    const sessionRecord = {
      type: sessionType || 'Audit',
      startTime: startTime as string | null,
      endTime: endTime as string | null,
      durationSeconds: durationSeconds as number | null
    };

    return {
      checklistDate: this.toApiDateTime(date) ?? date.toISOString(),
      savedAt,
      session: sessionRecord,
      summary: {
        totalItems: totalRequired,
        checkedItems: mappedItems.filter((i: any) => i.checked).length,
        depletedItems: mappedItems.filter((i: any) => i.status === 'depleted').length,
        expiredItems: mappedItems.filter((i: any) => i.status === 'expired').length
      },
      signature,
      items: mappedItems
    };
  }

  // Session management: start / finish / query
  private sessionsKeyFor(date: Date) {
    return this.sessionsPrefix + this.formatDate(date);
  }

  startSession(sessionType: string, date: Date = new Date()) {
    const key = this.sessionsKeyFor(date);
    const arr = this.sessionsByDateKey.get(key) ?? [];
    const nowDate = new Date();
    const nowIso = nowDate.toISOString();
    const nowLocal = formatDateTimeSAST(nowDate) ?? this.formatDate(nowDate);
    const session = { id: `${sessionType}-${nowIso}`, type: sessionType, startTime: nowLocal, endTime: null, durationSeconds: null, snapshotStart: null, snapshotEnd: null };
    arr.push(session);
    this.sessionsByDateKey.set(key, arr);
    return session;
  }

  finishSession(sessionType: string, snapshotEnd: any[] | null = null, date: Date = new Date()) {
    const key = this.sessionsKeyFor(date);
    const arr = this.sessionsByDateKey.get(key) ?? [];
    // find the most recent matching active session (no endTime)
    for (let i = arr.length - 1; i >= 0; i--) {
      const s = arr[i];
      if (s.type === sessionType && !s.endTime) {
        const nowDate = new Date();
        s.endTime = formatDateTimeSAST(nowDate) ?? this.formatDate(nowDate);
        try {
          const start = this.parseDateTime(s.startTime) ?? new Date(s.startTime);
          const end = nowDate;
          s.durationSeconds = Math.max(0, Math.floor((end.getTime() - (start ? start.getTime() : end.getTime())) / 1000));
        } catch (e) {
          s.durationSeconds = null;
        }
        if (snapshotEnd) s.snapshotEnd = snapshotEnd;
        this.sessionsByDateKey.set(key, arr);
        return s;
      }
    }
    return null;
  }

  getSessions(date: Date = new Date()) {
    const key = this.sessionsKeyFor(date);
    return this.sessionsByDateKey.get(key) ?? [];
  }

  getActiveSession(sessionType?: string, date: Date = new Date()) {
    const all = this.getSessions(date);
    for (let i = all.length - 1; i >= 0; i--) {
      const s = all[i];
      if (!s.endTime && (!sessionType || s.type === sessionType)) return s;
    }
    return null;
  }

  /** Returns all dates that have completed checklist records, sorted newest-first. */
  getHistoryDates(): Date[] {
    return [];
  }

  private parseDateTime(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    const s = String(dateString).trim();
    // ISO
    if (s.indexOf('T') >= 0) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    // expected formats: 'dd/MM/yyyy' or 'dd/MM/yyyy HH:mm:ss' or 'dd/MM/yyyy HH:mm'
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
}
