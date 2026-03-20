import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CompletedChecklistRecord } from '../models/item';

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  constructor(private http: HttpClient) {}

  getInventory(): Observable<any> {
    const url = environment.checklistApiBaseUrl;
    return this.http.get<any>(url);
  }

  postCompletedChecklist(record: CompletedChecklistRecord): Observable<CompletedChecklistRecord> {
    return this.http.post<CompletedChecklistRecord>(`${environment.checklistApiBaseUrl}/completed`, record);
  }

  getCompletedChecklists(): Observable<CompletedChecklistRecord[]> {
    return this.http
      .get<CompletedChecklistRecord[] | { [key: string]: any }>(`${environment.checklistApiBaseUrl}/completed`)
      .pipe(
        map((response) => {
          const container = response as any;
          const rawRecords = Array.isArray(container)
            ? container
            : Array.isArray(container?.items)
              ? container.items
              : Array.isArray(container?.data)
                ? container.data
                : Array.isArray(container?.records)
                  ? container.records
                  : Array.isArray(container?.results)
                    ? container.results
                    : Array.isArray(container?.value)
                      ? container.value
                      : [];
          return rawRecords.map((raw: any) => this.normalizeCompletedChecklistRecord(raw));
        })
      );
  }

  private normalizeCompletedChecklistRecord(raw: any): CompletedChecklistRecord {
    const obj = raw ?? {};
    const sessionObj = this.pick(obj, 'session', 'Session') ?? {};
    const signatureObj = this.pick(obj, 'signature', 'Signature') ?? {};
    const rawItems = this.pick(obj, 'items', 'Items');
    const items = Array.isArray(rawItems) ? rawItems : [];

    const mappedItems = items.map((item: any) => ({
      id: Number(this.pick(item, 'id', 'Id')) || 0,
      name: String(this.pick(item, 'name', 'Name') ?? ''),
      category: (this.pick(item, 'category', 'Category') ?? null) as string | null,
      status: this.pick(item, 'status', 'Status') ?? 'pending',
      checked: Boolean(this.pick(item, 'checked', 'Checked')),
      checkedDate: (this.pick(item, 'checkedDate', 'CheckedDate') ?? null) as string | null,
      controlQuantity: this.toNumberOrNull(this.pick(item, 'controlQuantity', 'ControlQuantity')),
      usedToday: this.toNumberOrNull(this.pick(item, 'usedToday', 'UsedToday')),
      expiryDate: (this.pick(item, 'expiryDate', 'ExpiryDate') ?? null) as string | null,
      replacementDate: (this.pick(item, 'replacementDate', 'ReplacementDate') ?? null) as string | null,
    }));

    const summaryObj = this.pick(obj, 'summary', 'Summary') ?? {};
    const derivedChecked = mappedItems.filter((i) => i.checked).length;
    const derivedTotal = mappedItems.reduce((sum, i) => sum + (typeof i.controlQuantity === 'number' ? i.controlQuantity : 1), 0);
    const derivedDepleted = mappedItems.filter((i) => i.status === 'depleted').length;
    const derivedExpired = mappedItems.filter((i) => i.status === 'expired').length;

    return {
      id: this.pick(obj, 'id', 'Id')?.toString(),
      checklistDate: String(this.pick(obj, 'checklistDate', 'ChecklistDate', 'date', 'Date') ?? this.pick(obj, 'savedAt', 'SavedAt') ?? ''),
      savedAt: String(this.pick(obj, 'savedAt', 'SavedAt', 'createdAt', 'CreatedAt') ?? ''),
      session: {
        type: (this.pick(sessionObj, 'type', 'Type')
          ?? this.pick(obj, 'sessionType', 'SessionType', 'checklistType', 'ChecklistType', 'type', 'Type')
          ?? 'Audit') as any,
        startTime: (this.pick(sessionObj, 'startTime', 'StartTime') ?? null) as string | null,
        endTime: (this.pick(sessionObj, 'endTime', 'EndTime') ?? null) as string | null,
        durationSeconds: this.toNumberOrNull(this.pick(sessionObj, 'durationSeconds', 'DurationSeconds')),
      },
      summary: {
        totalItems: this.toNumberOr(this.pick(summaryObj, 'totalItems', 'TotalItems'), derivedTotal),
        checkedItems: this.toNumberOr(this.pick(summaryObj, 'checkedItems', 'CheckedItems'), derivedChecked),
        depletedItems: this.toNumberOr(this.pick(summaryObj, 'depletedItems', 'DepletedItems'), derivedDepleted),
        expiredItems: this.toNumberOr(this.pick(summaryObj, 'expiredItems', 'ExpiredItems'), derivedExpired),
      },
      signature: {
        user: String(this.pick(signatureObj, 'user', 'User') ?? ''),
        signedFor: String(this.pick(signatureObj, 'signedFor', 'SignedFor') ?? ''),
        purpose: String(this.pick(signatureObj, 'purpose', 'Purpose') ?? ''),
        date: String(this.pick(signatureObj, 'date', 'Date') ?? ''),
        image: String(this.pick(signatureObj, 'image', 'Image') ?? ''),
      },
      items: mappedItems,
    };
  }

  private pick(source: any, ...keys: string[]): any {
    if (!source || typeof source !== 'object') return undefined;
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null) return source[key];
    }
    return undefined;
  }

  private toNumberOr(value: any, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  private toNumberOrNull(value: any): number | null {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
}
