import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UtilityBill } from './billing.model';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  // Список абонентов предприятия с поиском по ФИО, лицевому счёту или адресу
  getSubscribers(serviceId: string, search: string): Observable<UtilityBill[]> {
    return this.http.get<UtilityBill[]>(`${this.apiUrl}/services/${serviceId}/subscribers`, {
      params: { search }
    });
  }

  getSubscriber(id: number): Observable<UtilityBill> {
    return this.http.get<UtilityBill>(`${this.apiUrl}/subscribers/${id}`);
  }

  submitReading(id: number, reading: number): Observable<UtilityBill> {
    return this.http.post<UtilityBill>(`${this.apiUrl}/subscribers/${id}/readings`, { reading });
  }
}
