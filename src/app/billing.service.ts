import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bill, Employee, EmployeeForm, Subscriber, SubscriberForm, Tariff, WorkTime } from './billing.model';

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

  // Поиск сразу во всех услугах
  searchAll(search: string): Observable<Subscriber[]> {
    return this.http.get<Subscriber[]>(`${this.apiUrl}/subscribers`, { params: { search } });
  }

  createSubscriber(serviceId: string, form: SubscriberForm): Observable<Subscriber> {
    return this.http.post<Subscriber>(`${this.apiUrl}/services/${serviceId}/subscribers`, form);
  }

  updateSubscriber(id: number, form: SubscriberForm): Observable<Subscriber> {
    return this.http.put<Subscriber>(`${this.apiUrl}/subscribers/${id}`, form);
  }

  deleteSubscriber(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subscribers/${id}`);
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

  // Ручное изменение статуса оплаты (например, ошибка при оплате через банк), причина обязательна
  changeBillStatus(billId: number, paid: boolean, note: string): Observable<Subscriber> {
    return this.http.put<Subscriber>(`${this.apiUrl}/bills/${billId}/status`, { paid, note });
  }

  // ===== Тарифы (смотреть — все, менять — директор) =====

  getTariffs(): Observable<Tariff[]> {
    return this.http.get<Tariff[]>(`${this.apiUrl}/tariffs`);
  }

  createTariff(serviceType: string, price: number, effectiveFrom: string): Observable<Tariff> {
    return this.http.post<Tariff>(`${this.apiUrl}/tariffs`, { serviceType, price, effectiveFrom });
  }

  cancelTariff(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tariffs/${id}`);
  }

  // ===== Сотрудники (только директор) =====

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/employees`);
  }

  createEmployee(form: EmployeeForm): Observable<Employee> {
    return this.http.post<Employee>(`${this.apiUrl}/employees`, form);
  }

  updateEmployee(id: number, form: EmployeeForm): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/employees/${id}`, form);
  }

  getWorkTime(employeeId: number, month: string): Observable<WorkTime> {
    return this.http.get<WorkTime>(`${this.apiUrl}/employees/${employeeId}/work-time`, { params: { month } });
  }

  // Понятное описание ошибки запроса, чтобы сразу было видно, что не так с бэкендом
  describeError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return `Бэкенд не отвечает на ${this.apiUrl}. Запустите класс ZettaBilling (папка zetta-backend).`;
      }
      if (err.status === 401 || err.status === 403) {
        return err.error?.message || (err.status === 401 ? 'Требуется вход.' : 'Нет доступа.');
      }
      if (err.status === 404) {
        return `Бэкенд ответил 404 (${err.url}). Скорее всего, запущен старый бэкенд — остановите его и запустите ZettaBilling из zetta-backend.`;
      }
      // 400 / 409 и т.п.: бэкенд присылает понятный текст (например «Лицевой счёт уже занят»)
      return err.error?.message || `Ошибка бэкенда ${err.status}: ${err.statusText || err.message}`;
    }
    return 'Неизвестная ошибка при обращении к бэкенду.';
  }
}
