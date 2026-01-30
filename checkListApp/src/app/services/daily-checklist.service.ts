import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DailyChecklistService {
  private keyPrefix = 'checklist-';
  private sessionsPrefix = 'sessions-';

  private formatDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
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

    const now = new Date().toISOString();
    const session = { id: `${sessionType}-${now}`, type: sessionType, startTime: now, endTime: null, durationSeconds: null, snapshotStart: null, snapshotEnd: null };
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
          const now = new Date().toISOString();
          s.endTime = now;
          try {
            const start = new Date(s.startTime);
            const end = new Date(now);
            s.durationSeconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
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
      return JSON.parse(raw) as any[];
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
}
