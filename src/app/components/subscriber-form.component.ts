import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../billing.service';
import { Subscriber, SubscriberForm } from '../billing.model';
import { UtilityService } from '../services';

// Окно (модалка) «Добавить абонента» / «Редактировать абонента».
// Если передан subscriber — редактирование, иначе — добавление в указанную услугу.
@Component({
  selector: 'app-subscriber-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './subscriber-form.component.html',
  styleUrl: './subscriber-form.component.css'
})
export class SubscriberFormComponent implements OnInit {
  private billingService = inject(BillingService);

  service = input.required<UtilityService>();
  subscriber = input<Subscriber | null>(null);

  saved = output<Subscriber>();
  closed = output<void>();

  form: SubscriberForm = { ownerName: '', accountNumber: '', phone: '', address: '', tariff: null, currentReading: 0 };
  isSaving = signal<boolean>(false);
  error = signal<string>('');

  ngOnInit(): void {
    const s = this.subscriber();
    if (s) {
      this.form = {
        ownerName: s.ownerName,
        accountNumber: s.accountNumber,
        phone: s.phone ?? '',
        address: s.address ?? '',
        tariff: s.tariff
      };
    }
  }

  get isEdit(): boolean {
    return this.subscriber() !== null;
  }

  save(): void {
    if (!this.form.ownerName.trim() || !this.form.accountNumber.trim() || this.form.tariff === null) {
      this.error.set('Заполните ФИО, лицевой счёт и тариф.');
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
