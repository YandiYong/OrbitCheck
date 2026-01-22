import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class SignatureApiService {
  // Replace with your backend endpoint
  private readonly endpoint = '/api/Signatures';

  constructor(private http: HttpClient) {}

  save(payload: unknown) {
    return this.http.post(this.endpoint, payload);
  }
}
