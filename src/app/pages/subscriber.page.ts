import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BillingService } from '../billing.service';
import { Bill, Subscriber } from '../billing.model';
import { UtilityService, findService } from '../services';
import { SubscriberFormComponent } from '../components/subscriber-form.component';
import { BankPaymentComponent } from '../components/bank-payment.component';
import { BillStatusComponent } from '../components/bill-status.component';
import { AuthService } from '../auth/auth.service';

// Страница абонента: данные, история начислений по месяцам, оплата и передача показаний.
// Для сотрудника открывается из таблицы (/services/:serviceId/subscribers/:id),
// для гражданина — это его личный кабинет (/my): только просмотр и оплата через банк.
@Component({
  selector: 'app-subscriber-page',
  standalone: true,
  imports: [FormsModule, RouterLink, SubscriberFormComponent, BankPaymentComponent, BillStatusComponent],
  templateUrl: './subscriber.page.html',
  styleUrl: './subscriber.page.css'
})
export class SubscriberPage {
  private billingService = inject(BillingService);
  private router = inject(Router);
  auth = inject(AuthService);

  service = signal<UtilityService | undefined>(undefined);
  subscriber = signal<Subscriber | null>(null);
  bills = signal<Bill[]>([]);
  newReading = signal<number | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');
  isEditing = signal<boolean>(false);   // открыто окно «Редактировать абонента»
  payingBill = signal<Bill | null>(null);  // гражданин: окно «Оплата через банк»
  statusBill = signal<Bill | null>(null);  // инспекция: окно «Изменить статус оплаты»

  unpaidCount = computed(() => this.bills().filter(b => !b.paid).length);

  constructor() {
    inject(ActivatedRoute).paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const session = this.auth.session();
      if (this.auth.isCitizen() && session) {
        // Гражданин видит только свой лицевой счёт
        this.service.set(findService(session.serviceType));
        this.load(session.subscriberId!);
      } else {
        this.service.set(findService(params.get('serviceId')));
        this.load(Number(params.get('id')));
      }
    });
  }

  load(id: number): void {
    this.error.set('');
    this.billingService.getSubscriber(id).subscribe({
      next: s => this.subscriber.set(s),
      error: (err: unknown) => {
        console.error(err);
        this.error.set('Не удалось загрузить абонента. ' + this.billingService.describeError(err));
      }
    });
    this.loadBills(id);
  }

  private loadBills(id: number): void {
    this.billingService.getBills(id).subscribe({
      next: list => this.bills.set(list),
      error: (err: unknown) => console.error(err)
    });
  }

  // '2026-09' → 'Сентябрь 2026'
  formatPeriod(period: string): string {
    const [year, month] = period.split('-').map(Number);
    const name = new Date(year, month - 1, 1).toLocaleString('ru-RU', { month: 'long' });
    return `${name[0].toUpperCase()}${name.slice(1)} ${year}`;
  }

  // '2026-09-10' → '10.09.2026'
  formatDate(date: string): string {
    return date.split('-').reverse().join('.');
  }

  // Гражданин: оплата через банк прошла
  onPaid(updated: Subscriber): void {
    const bill = this.payingBill();
    this.payingBill.set(null);
    this.afterBillChange(updated, bill ? `Начисление за ${this.formatPeriod(bill.period)} оплачено.` : '');
  }

  // Инспекция: статус оплаты изменён вручную
  onStatusSaved(updated: Subscriber): void {
    const bill = this.statusBill();
    this.statusBill.set(null);
    this.afterBillChange(updated, bill ? `Статус начисления за ${this.formatPeriod(bill.period)} изменён.` : '');
  }

  private afterBillChange(updated: Subscriber, message: string): void {
    this.subscriber.set(updated);
    this.loadBills(updated.id);
    this.error.set('');
    this.success.set(message);
  }

  onSaved(updated: Subscriber): void {
    this.subscriber.set(updated);
    this.isEditing.set(false);
    this.error.set('');
    this.success.set('Данные абонента сохранены.');
  }

  deleteSubscriber(): void {
    const s = this.subscriber();
    if (!s || !confirm(`Удалить абонента «${s.ownerName}» вместе со всей историей начислений?`)) return;

    this.billingService.deleteSubscriber(s.id).subscribe({
      next: () => this.router.navigate(['/services', s.serviceType]),
      error: (err: unknown) => {
        console.error(err);
        this.error.set('Не удалось удалить абонента. ' + this.billingService.describeError(err));
      }
    });
  }

  onSubmitReading(): void {
    const reading = this.newReading();
    const s = this.subscriber();
    if (reading === null || s === null) return;

    if (reading < s.currentReading) {
      this.error.set('Новые показания не могут быть меньше последних!');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');
    this.success.set('');
    this.billingService.submitReading(s.id, reading).subscribe({
      next: updated => {
        this.subscriber.set(updated);
        this.loadBills(updated.id);
        this.newReading.set(null);
        this.success.set('Показания приняты, начисление добавлено в историю.');
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error(err);
        this.error.set('Ошибка передачи показаний на сервер.');
        this.isLoading.set(false);
      }
    });
  }
}
