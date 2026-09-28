import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UtilityBill } from './billing.model';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/billing';

  getBillByAccount(accountNumber: string): Observable<UtilityBill> {
    return this.http.get<UtilityBill>(`${this.apiUrl}/${accountNumber}`);
  }

  submitReading(accountNumber: string, reading: number): Observable<UtilityBill> {
    return this.http.post<UtilityBill>(`${this.apiUrl}/${accountNumber}/readings`, { reading });
  }
}