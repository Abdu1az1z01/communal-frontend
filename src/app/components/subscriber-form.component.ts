import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../billing.service';
import { Bill, Subscriber, SubscriberForm } from '../billing.model';
import { UtilityService } from '../services';
import { BillStatusComponent } from './bill-status.component';
import { formatDate, formatPeriod } from '../format';

// Окно (модалка) «Добавить абонента» / «Редактировать абонента».
// Если передан subscriber — редактирование: данные абонента, статусы оплаты по месяцам
// (карандаш при наведении на месяц) и удаление абонента. Иначе — добавление в указанную услугу.
@Component({
  selector: 'app-subscriber-form',
  standalone: true,
  imports: [FormsModule, BillStatusComponent],
  templateUrl: './subscriber-form.component.html',
  styleUrl: './subscriber-form.component.css'
})
export class SubscriberFormComponent implements OnInit {
  private billingService = inject(BillingService);

  service = input.required<UtilityService>();
  subscriber = input<Subscriber | null>(null);

  saved = output<Subscriber>();
  statusChanged = output<Subscriber>();   // изменили статус оплаты какого-то месяца
  deleted = output<void>();
  closed = output<void>();

  form: SubscriberForm = { ownerName: '', accountNumber: '', phone: '', address: '', currentReading: 0 };
  isSaving = signal<boolean>(false);
  error = signal<string>('');

  bills = signal<Bill[]>([]);
  statusBill = signal<Bill | null>(null);   // месяц, у которого меняем статус
  formatPeriod = formatPeriod;
  formatDate = formatDate;

  ngOnInit(): void {
    const s = this.subscriber();
    if (s) {
      this.form = {
        ownerName: s.ownerName,
        accountNumber: s.accountNumber,
        phone: s.phone ?? '',
        address: s.address ?? ''
      };
      this.loadBills(s.id);
    }
  }

  private loadBills(id: number): void {
    this.billingService.getBills(id).subscribe({
      next: list => this.bills.set(list),
      error: (err: unknown) => console.error(err)
    });
  }

  onStatusSaved(updated: Subscriber): void {
    this.statusBill.set(null);
    this.loadBills(updated.id);
    this.statusChanged.emit(updated);
  }

  deleteSubscriber(): void {
    const s = this.subscriber();
    if (!s || !confirm(`Удалить абонента «${s.ownerName}» (л/с ${s.accountNumber}) вместе со всей историей начислений?`)) {
      return;
    }
    this.billingService.deleteSubscriber(s.id).subscribe({
      next: () => this.deleted.emit(),
      error: (err: unknown) => {
        console.error(err);
        this.error.set('Не удалось удалить абонента. ' + this.billingService.describeError(err));
      }
    });
  }

  get isEdit(): boolean {
    return this.subscriber() !== null;
  }

  save(): void {
    if (!this.form.ownerName.trim() || !this.form.accountNumber.trim()) {
      this.error.set('Заполните ФИО и лицевой счёт.');
      return;
    }

    this.isSaving.set(true);
    this.error.set('');

    const existing = this.subscriber();
    const request = existing
      ? this.billingService.updateSubscriber(existing.id, this.form)
      : this.billingService.createSubscriber(this.service().id, this.form);

    request.subscribe({
      next: result => {
        this.isSaving.set(false);
        this.saved.emit(result);
      },
      error: (err: unknown) => {
        console.error(err);
        this.error.set(this.billingService.describeError(err));
        this.isSaving.set(false);
      }
    });
  }
}
