import { Injectable } from '@angular/core';
import { NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';

/**
 * Simple DateAdapter that parses and formats dates as dd/MM/yyyy.
 * Keeps behavior small and predictable for the app; does not add external deps.
 */
@Injectable()
export class DdMmDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string') {
      const v = value.trim();
      // handle dd/MM/yyyy
      const m = /^([0-9]{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
      if (m) {
        const day = Number(m[1]);
        const month = Number(m[2]);
        const year = Number(m[3]);
        const d = new Date(year, month - 1, day);
        if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) return d;
        return null;
      }
      // fallback to native parsing for ISO-like strings
      const parsed = new Date(v);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  override format(date: Date, displayFormat: any): string {
    if (!date || !(date instanceof Date)) return '';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
}

export const DD_MM_YYYY_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};
