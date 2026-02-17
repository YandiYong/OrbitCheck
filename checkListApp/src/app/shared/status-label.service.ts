import { Injectable } from '@angular/core';
import { isBeforeToday } from '../utils/date-utils';

@Injectable({ providedIn: 'root' })
export class StatusLabelService {
  private readonly labelMap: Record<string, string> = {
    depleted: 'Depleted',
    insufficient: 'Insufficient',
    satisfactory: 'Satisfactory',
    excessive: 'Excessive',
    expired: 'Expired'
  };

  getLabel(item: any): string {
    if (!item) return '';

    if (this.isExpired(item.expiryDate)) return 'Expired';
    if (!item.checked) return '';

    const status = String(item.status ?? '').trim().toLowerCase();
    return this.labelMap[status] ?? '';
  }

  private isExpired(date?: string | null): boolean {
    if (!date) return false;
    return isBeforeToday(date);
  }
}
