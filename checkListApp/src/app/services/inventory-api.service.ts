import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class InventoryApiService {
  constructor(private http: HttpClient) {}

  getInventory(): Observable<any> {
    const url = environment.inventoryApiUrl;
    return this.http.get<any>(url);
  }
}
