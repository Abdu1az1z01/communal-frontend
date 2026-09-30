import { Component, inject, input, output, signal } from '@angular/core';
import { BillingService } from '../billing.service';
import { Bill, Subscriber } from '../billing.model';
import { UtilityService } from '../services';
import { BANKS, Bank } from '../banks';

// Окно «Оплата через банк» для гражданина: выбор банка → подтверждение → начисление отмечается оплаченным.
// Сейчас это демонстрация: настоящий перевод денег подключается через API выбранного банка.
@Component({
  selector: 'app-bank-payment',
  standalone: true,
  templateUrl: './bank-payment.component.html',
  styleUrl: './bank-payment.component.css'
})
export class BankPaymentComponent {
  private billingService = inject(BillingService);

  bill = input.required<Bill>();
  subscriber = input.required<Subscriber>();
  service = input.required<UtilityService>();
  periodLabel = input.required<string>();

  paid = output<Subscriber>();
  closed = output<void>();

  banks = BANKS;
  selected = signal<Bank | null>(null);
  isPaying = signal<boolean>(false);
  error = signal<string>('');

  confirm(): void {
    const bank = this.selected();
    if (!bank) {
      this.error.set('Выберите банк.');
      return;
    }
    this.isPaying.set(true);
    this.error.set('');
    this.billingService.payBill(this.bill().id, bank.name).subscribe({
      next: s => {
        this.isPaying.set(false);
        this.paid.emit(s);
      },
      error: (err: unknown) => {
        console.error(err);
        this.error.set(this.billingService.describeError(err));
        this.isPaying.set(false);
      }
    });
  }
}
