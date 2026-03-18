import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CompletedChecklistRecord } from '../models/item';

@Injectable()
export class InventoryApiService {
  constructor(private http: HttpClient) {}

  getInventory(): Observable<any> {
    const url = environment.checklistApiBaseUrl;
    return this.http.get<any>(url);
  }

  postCompletedChecklist(record: CompletedChecklistRecord): Observable<CompletedChecklistRecord> {
    return this.http.post<CompletedChecklistRecord>(`${environment.checklistApiBaseUrl}/completed`, record);
  }
}
