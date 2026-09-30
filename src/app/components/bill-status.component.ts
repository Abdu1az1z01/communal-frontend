import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../billing.service';
import { Bill, Subscriber } from '../billing.model';

// Окно «Изменить статус оплаты» для инспекции: если при оплате была ошибка
// (деньги списались, но оплата не отметилась, или платёж отменён банком).
// Причина обязательна — она сохраняется и видна в истории начислений.
@Component({
  selector: 'app-bill-status',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './bill-status.component.html',
  styleUrl: './bill-status.component.css'
})
export class BillStatusComponent implements OnInit {
  private billingService = inject(BillingService);

  bill = input.required<Bill>();
  periodLabel = input.required<string>();

  saved = output<Subscriber>();
  closed = output<void>();

  paid = true;
  note = '';
  isSaving = signal<boolean>(false);
  error = signal<string>('');

  ngOnInit(): void {
    // По умолчанию предлагаем противоположный статус — обычно его и нужно исправить
    this.paid = !this.bill().paid;
  }

  save(): void {
    if (!this.note.trim()) {
      this.error.set('Укажите причину изменения статуса.');
      return;
    }
    this.isSaving.set(true);
    this.error.set('');
    this.billingService.changeBillStatus(this.bill().id, this.paid, this.note.trim()).subscribe({
      next: s => {
        this.isSaving.set(false);
        this.saved.emit(s);
      },
      error: (err: unknown) => {
        console.error(err);
        this.error.set(this.billingService.describeError(err));
        this.isSaving.set(false);
      }
    });
  }
}
