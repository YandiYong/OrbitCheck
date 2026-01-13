import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DailyChecklistService {
  private keyPrefix = 'checklist-';

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
}
