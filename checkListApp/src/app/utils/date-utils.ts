// Shared date utilities for strict dd/MM/yyyy parsing and formatting.
// Keep these small and well-tested — templates and components should use
// these helpers instead of `new Date(string)` which is locale-dependent.

export function parseDDMMYYYY(s: string | null | undefined): Date | null {
  if (!s || typeof s !== 'string') return null;
  const txt = s.trim();
  const m = /^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/.exec(txt);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

export function formatDDMMYYYY(d: Date | null | undefined): string | null {
  if (!d) return null;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Try strict dd/MM/yyyy first, then fall back to Date parser for ISO-like strings.
export function parseAnyDate(s: string | Date | null | undefined): Date | null {
  if (!s) return null;
  if (s instanceof Date) return isNaN(s.getTime()) ? null : s;
  const strict = parseDDMMYYYY(String(s));
  if (strict) return strict;
  const parsed = new Date(String(s));
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Compare date-only portion to today (ignore time-of-day).
export function isBeforeToday(dateLike: string | Date | null | undefined): boolean {
  const d = parseAnyDate(dateLike);
  if (!d) return false;
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

// Format a Date as SAST-local datetime string (24-hour) e.g. '03/02/2026 07:41:30'
export function formatDateTimeSAST(d: Date | null | undefined): string | null {
  if (!d) return null;
  try {
    const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Africa/Johannesburg' };
    const s = new Intl.DateTimeFormat('en-GB', opts).format(d as Date);
    return String(s).replace(',', '');
  } catch (e) {
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    const dd = d as Date;
    return `${pad(dd.getDate())}/${pad(dd.getMonth() + 1)}/${dd.getFullYear()} ${pad(dd.getHours())}:${pad(dd.getMinutes())}:${pad(dd.getSeconds())}`;
  }
}
