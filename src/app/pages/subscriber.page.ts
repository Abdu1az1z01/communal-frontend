import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BillingService } from '../billing.service';
import { Bill, Subscriber } from '../billing.model';
import { UtilityService, findService } from '../services';
import { SubscriberFormComponent } from '../components/subscriber-form.component';
import { BillStatusComponent } from '../components/bill-status.component';
import { formatDate, formatPeriod } from '../format';

// Страница абонента (/services/:serviceId/subscribers/:id): данные, история начислений по месяцам,
// исправление статуса оплаты (карандаш при наведении на месяц) и передача показаний.
@Component({
  selector: 'app-subscriber-page',
  standalone: true,
  imports: [FormsModule, RouterLink, SubscriberFormComponent, BillStatusComponent],
  templateUrl: './subscriber.page.html',
  styleUrl: './subscriber.page.css'
})
export class SubscriberPage {
  private billingService = inject(BillingService);
  private router = inject(Router);

  service = signal<UtilityService | undefined>(undefined);
  subscriber = signal<Subscriber | null>(null);
  bills = signal<Bill[]>([]);
  newReading = signal<number | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');
  isEditing = signal<boolean>(false);   // открыто окно «Редактировать абонента»
  statusBill = signal<Bill | null>(null);  // окно «Изменить статус оплаты»

  formatPeriod = formatPeriod;
  formatDate = formatDate;

  unpaidCount = computed(() => this.bills().filter(b => !b.paid).length);

  constructor() {
    inject(ActivatedRoute).paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.service.set(findService(params.get('serviceId')));
      this.load(Number(params.get('id')));
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

  // Статус оплаты изменён вручную (через карандаш у месяца или в окне «Редактировать»)
  onStatusSaved(updated: Subscriber): void {
    const bill = this.statusBill();
    this.statusBill.set(null);
    this.onStatusChanged(updated);
    if (bill) {
      this.success.set(`Статус начисления за ${formatPeriod(bill.period)} изменён.`);
    }
  }

  onStatusChanged(updated: Subscriber): void {
    this.subscriber.set(updated);
    this.loadBills(updated.id);
    this.error.set('');
  }

  onSaved(updated: Subscriber): void {
    this.subscriber.set(updated);
    this.isEditing.set(false);
    this.error.set('');
    this.success.set('Данные абонента сохранены.');
  }

  // Абонента удалили в окне «Редактировать» — возвращаемся к списку
  onDeleted(): void {
    this.router.navigate(['/services', this.service()?.id]);
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
