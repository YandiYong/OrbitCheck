import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StatusColorService {
  private readonly colorMap: Record<string, string> = {
    pending: 'var(--color-warning)',
    expired: 'var(--color-danger)',
    depleted: 'var(--color-danger)',
    insufficient: 'var(--color-warning)',
    satisfactory: 'var(--color-success)',
    excessive: 'var(--color-primary)'
  };

  getColor(statusOrItem: any): string {
    if (statusOrItem == null) return 'var(--color-muted)';

    let status = '';
    if (typeof statusOrItem === 'string') status = statusOrItem;
    else if (typeof statusOrItem === 'object') {
      // Prefer explicit `status` field, fall back to other likely labels
      status = statusOrItem.status ?? statusOrItem.label ?? statusOrItem.name ?? '';
    } else {
      status = String(statusOrItem);
    }

    status = String(status).trim().toLowerCase();
    return this.colorMap[status] || 'var(--color-muted)';
  }
}
