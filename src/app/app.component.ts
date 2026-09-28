import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from './billing.service';
import { UtilityBill } from './billing.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private billingService = inject(BillingService);

  searchAccount = signal<string>('102030');
  bill = signal<UtilityBill | null>(null);
  newReading = signal<number | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  onSearch(): void {
    const acc = this.searchAccount();
    if (!acc || !acc.trim()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.bill.set(null);

    this.billingService.getBillByAccount(acc).subscribe({
      next: (data: UtilityBill) => {
        this.bill.set(data);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error(err);
        this.errorMessage.set('Лицевой счет не найден. Проверьте правильность номера.');
        this.isLoading.set(false);
      }
    });
  }

  onSubmitReading(): void {
    const readingVal = this.newReading();
    const currentBill = this.bill();

    if (readingVal === null || currentBill === null) return;

    if (readingVal < currentBill.previousReading) {
      this.errorMessage.set('Новые показания не могут быть меньше предыдущих!');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.billingService.submitReading(currentBill.accountNumber, readingVal).subscribe({
      next: (updatedBill: UtilityBill) => {
        this.bill.set(updatedBill);
        this.newReading.set(null);
        this.successMessage.set('Показания успешно приняты! Баланс обновлен.');
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error(err);
        this.errorMessage.set('Ошибка передачи показаний на сервер.');
        this.isLoading.set(false);
      }
    });
  }
}