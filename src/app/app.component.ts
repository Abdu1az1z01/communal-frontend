import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from './billing.service';
import { UtilityBill } from './billing.model';

export interface UtilityService {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.css'
})
export class AppComponent {
  private billingService = inject(BillingService);

  // Список услуг в меню «три полоски». Чтобы добавить/убрать/переименовать услугу — меняйте здесь.
  services: UtilityService[] = [
    { id: 'cold-water', name: 'Холодная вода/Стоки', icon: '💧' },
    { id: 'hot-water', name: 'Горячая вода', icon: '🚿' },
    { id: 'heating', name: 'Отопление', icon: '🔥' },
    { id: 'garbage', name: 'Вывоз ТБО (мусор)', icon: '🗑️' },
    { id: 'gas', name: 'Газ', icon: '⛽' }
  ];

  isMenuOpen = signal<boolean>(false);
  selectedService = signal<UtilityService | null>(null);

  searchAccount = signal<string>('102030');
  bill = signal<UtilityBill | null>(null);
  newReading = signal<number | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen.update(open => !open);
  }

  selectService(service: UtilityService): void {
    this.selectedService.set(service);
    this.isMenuOpen.set(false);
  }

  // Закрываем меню при клике в любом месте страницы
  @HostListener('document:click')
  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

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