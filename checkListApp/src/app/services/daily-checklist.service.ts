import { Injectable } from '@angular/core';
import { formatDateTimeSAST } from '../utils/date-utils';
import { CompletedChecklistRecord, Session } from '../models/item';

@Injectable({ providedIn: 'root' })
export class DailyChecklistService {
  private keyPrefix = 'checklist-';
  private sessionsPrefix = 'sessions-';
  private completedPrefix = 'completed-checklists-';

  constructor() {
    // migrate any legacy localStorage keys persisted with dashes (dd-MM-yyyy)
    this.migrateOldLocalStorageKeys();
  }

  private formatDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${m}/${y}`;
  }


  /**
   * Migrate legacy localStorage keys that used `dd-MM-yyyy` to the new `dd/MM/yyyy` format.
   * Copies values to the new key when the new key does not already exist.
   */
  private migrateOldLocalStorageKeys() {
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (!k || typeof k !== 'string') continue;

        // migrate checklist- keys
        if (k.startsWith(this.keyPrefix)) {
          const datePart = k.substring(this.keyPrefix.length);
          if (datePart.indexOf('-') >= 0) {
            const newKey = this.keyPrefix + datePart.replace(/-/g, '/');
            if (!localStorage.getItem(newKey)) {
              const val = localStorage.getItem(k);
              if (val != null) {
                localStorage.setItem(newKey, val);
                console.info(`DailyChecklistService: migrated ${k} -> ${newKey}`);
              }
            }
          }
        }

        // migrate sessions- keys
        if (k.startsWith(this.sessionsPrefix)) {
          const datePart = k.substring(this.sessionsPrefix.length);
          if (datePart.indexOf('-') >= 0) {
            const newKey = this.sessionsPrefix + datePart.replace(/-/g, '/');
            if (!localStorage.getItem(newKey)) {
              const val = localStorage.getItem(k);
              if (val != null) {
                localStorage.setItem(newKey, val);
                console.info(`DailyChecklistService: migrated ${k} -> ${newKey}`);
              }
            }
          }
        }
      }
      // Also normalize timestamps inside saved checklist snapshots to dd/MM/yyyy
      for (const k of Object.keys(localStorage)) {
        if (!k.startsWith(this.keyPrefix)) continue;
        try {
          const raw = localStorage.getItem(k);
          if (!raw) continue;
          const arr = JSON.parse(raw);
          if (!Array.isArray(arr)) continue;
          let changed = false;
          for (const itm of arr) {
            if (itm && typeof itm === 'object') {
                  if (typeof itm.checkedDate === 'string' && itm.checkedDate.indexOf('T') >= 0) {
                const d = new Date(itm.checkedDate);
                if (!isNaN(d.getTime())) {
                  itm.checkedDate = this.formatDate(d);
                  changed = true;
                }
              }
              if (Array.isArray(itm.usageHistory)) {
                for (const h of itm.usageHistory) {
                  if (h && typeof h.date === 'string' && h.date.indexOf('T') >= 0) {
                    const d = new Date(h.date);
                    if (!isNaN(d.getTime())) {
                      h.date = this.formatDate(d);
                      changed = true;
                    }
                  }
                }
              }
            }
          }
          if (changed) {
            // ensure checkedDate and usageHistory dates include SAST-local time
            for (const itm of arr) {
              try {
                if (itm && typeof itm === 'object') {
                  if (typeof itm.checkedDate === 'string' && itm.checkedDate.indexOf('T') >= 0) {
                    const d = new Date(itm.checkedDate);
                    if (!isNaN(d.getTime())) itm.checkedDate = formatDateTimeSAST(d);
                  }
                  if (Array.isArray(itm.usageHistory)) {
                    for (const h of itm.usageHistory) {
                      if (h && typeof h.date === 'string' && h.date.indexOf('T') >= 0) {
                        const d = new Date(h.date);
                        if (!isNaN(d.getTime())) h.date = formatDateTimeSAST(d);
                      }
                    }
                  }
                }
              } catch (e) {
                // ignore
              }
            }
            localStorage.setItem(k, JSON.stringify(arr));
          }
        } catch (e) {
          // ignore malformed snapshot entries
        }
      }
    } catch (e) {
      console.warn('DailyChecklistService: migration of old checklist keys failed', e);
    }
  }

  saveSnapshot(date: Date, items: any[]) {
    const key = this.keyPrefix + this.formatDate(date);
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save checklist snapshot', e);
    }
  }

  getSnapshot(date: Date) {
    const key = this.keyPrefix + this.formatDate(date);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to read checklist snapshot', e);
      return null;
    }
  }

  getPreviousSnapshot() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return this.getSnapshot(d);
  }

  saveCompletedChecklist(record: CompletedChecklistRecord, date: Date = new Date()) {
    const key = this.completedPrefix + this.formatDate(date);
    let arr: CompletedChecklistRecord[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) arr = JSON.parse(raw) as CompletedChecklistRecord[];
    } catch (e) {
      arr = [];
    }

    arr.push(record);

    try {
      localStorage.setItem(key, JSON.stringify(arr));
      return true;
    } catch (e) {
      console.warn('Failed to save completed checklist', e);
      return false;
    }
  }

  getCompletedChecklists(date: Date = new Date()) {
    const key = this.completedPrefix + this.formatDate(date);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [] as CompletedChecklistRecord[];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as CompletedChecklistRecord[]) : [];
    } catch (e) {
      console.warn('Failed to read completed checklists', e);
      return [] as CompletedChecklistRecord[];
    }
  }

  buildCompletedChecklistRecord(sessionType: Session['sessionType'], activeSession: any, items: any[], date: Date = new Date()): CompletedChecklistRecord {
    const now = new Date();
    const savedAt = formatDateTimeSAST(now) ?? now.toISOString();
    const mappedItems = (items ?? []).map((i: any) => ({
      id: i.id,
      name: i.name,
      category: i.category ?? null,
      status: i.status,
      checked: i.checked ?? false,
      checkedDate: i.checkedDate ?? null,
      controlQuantity: typeof i.controlQuantity === 'number' ? i.controlQuantity : null,
      usedToday: typeof i.usedToday === 'number' ? i.usedToday : null,
      expiryDate: i.expiryDate ?? null,
      replacementDate: i.replacementDate ?? null
    }));

    return {
      id: `${sessionType}-${now.toISOString()}`,
      checklistDate: this.formatDate(date),
      savedAt,
      session: {
        type: sessionType,
        startTime: activeSession?.startTime ?? null,
        endTime: activeSession?.endTime ?? null,
        durationSeconds: typeof activeSession?.durationSeconds === 'number' ? activeSession.durationSeconds : null
      },
      summary: {
        totalItems: mappedItems.length,
        checkedItems: mappedItems.filter((i: any) => i.checked).length,
        depletedItems: mappedItems.filter((i: any) => i.status === 'depleted').length,
        expiredItems: mappedItems.filter((i: any) => i.status === 'expired').length
      },
      items: mappedItems
    };
  }

  // Session management: start / finish / query
  private sessionsKeyFor(date: Date) {
    return this.sessionsPrefix + this.formatDate(date);
  }

  startSession(sessionType: string, date: Date = new Date()) {
    const key = this.sessionsKeyFor(date);
    let arr: any[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) arr = JSON.parse(raw) as any[];
    } catch (e) {
      console.warn('Failed to read sessions', e);
    }
    const nowDate = new Date();
    const nowIso = nowDate.toISOString();
    const nowLocal = formatDateTimeSAST(nowDate) ?? this.formatDate(nowDate);
    const session = { id: `${sessionType}-${nowIso}`, type: sessionType, startTime: nowLocal, endTime: null, durationSeconds: null, snapshotStart: null, snapshotEnd: null };
    arr.push(session);
    try {
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) {
      console.warn('Failed to save session start', e);
    }
    return session;
  }

  finishSession(sessionType: string, snapshotEnd: any[] | null = null, date: Date = new Date()) {
    const key = this.sessionsKeyFor(date);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const arr = JSON.parse(raw) as any[];
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
          localStorage.setItem(key, JSON.stringify(arr));
          return s;
        }
      }
      return null;
    } catch (e) {
      console.warn('Failed to finish session', e);
      return null;
    }
  }

  getSessions(date: Date = new Date()) {
    const key = this.sessionsKeyFor(date);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      // ensure sessions stored with ISO startTime are backfilled to local formatted times
      const arr = JSON.parse(raw) as any[];
      let changed = false;
      for (const s of arr) {
        if (s && typeof s === 'object') {
          if (typeof s.startTime === 'string' && s.startTime.indexOf('T') >= 0) {
            const d = new Date(s.startTime);
              if (!isNaN(d.getTime())) {
              s.startTime = formatDateTimeSAST(d);
              changed = true;
            }
          }
          if (typeof s.endTime === 'string' && s.endTime.indexOf('T') >= 0) {
            const d = new Date(s.endTime);
              if (!isNaN(d.getTime())) {
              s.endTime = formatDateTimeSAST(d);
              changed = true;
            }
          }
        }
      }
      if (changed) localStorage.setItem(key, JSON.stringify(arr));
      return arr;
    } catch (e) {
      console.warn('Failed to read sessions', e);
      return [];
    }
  }

  getActiveSession(sessionType?: string, date: Date = new Date()) {
    const all = this.getSessions(date);
    for (let i = all.length - 1; i >= 0; i--) {
      const s = all[i];
      if (!s.endTime && (!sessionType || s.type === sessionType)) return s;
    }
    return null;
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
