import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bill, Subscriber } from './billing.model';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  // Список абонентов предприятия с поиском по ФИО, лицевому счёту или адресу
  getSubscribers(serviceId: string, search: string): Observable<Subscriber[]> {
    return this.http.get<Subscriber[]>(`${this.apiUrl}/services/${serviceId}/subscribers`, {
      params: { search }
    });
  }

  getSubscriber(id: number): Observable<Subscriber> {
    return this.http.get<Subscriber>(`${this.apiUrl}/subscribers/${id}`);
  }

  // История начислений абонента (сначала новые)
  getBills(subscriberId: number): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.apiUrl}/subscribers/${subscriberId}/bills`);
  }

  submitReading(subscriberId: number, reading: number): Observable<Subscriber> {
    return this.http.post<Subscriber>(`${this.apiUrl}/subscribers/${subscriberId}/readings`, { reading });
  }

  payBill(billId: number): Observable<Subscriber> {
    return this.http.post<Subscriber>(`${this.apiUrl}/bills/${billId}/pay`, {});
  }
}
