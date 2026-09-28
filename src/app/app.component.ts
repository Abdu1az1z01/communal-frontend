import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from './billing.service';
import { UtilityBill } from './billing.model';

export interface UtilityService {
  id: string;
  name: string;
  icon: string;
  unit: string;
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
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  // Список услуг в левом меню. Чтобы добавить/убрать/переименовать услугу — меняйте здесь.
  // id должен совпадать с service_type в базе данных на бэкенде.
  services: UtilityService[] = [
    { id: 'cold-water', name: 'Холодная вода/Стоки', icon: '💧', unit: 'м³' },
    { id: 'hot-water', name: 'Горячая вода', icon: '🚿', unit: 'м³' },
    { id: 'heating', name: 'Отопление', icon: '🔥', unit: 'Гкал' },
    { id: 'garbage', name: 'Вывоз ТБО (мусор)', icon: '🗑️', unit: 'чел.' },
    { id: 'gas', name: 'Газ', icon: '⛽', unit: 'м³' }
  ];

  selectedService = signal<UtilityService | null>(null);

  // Окно со списком абонентов
  subscribers = signal<UtilityBill[]>([]);
  searchQuery = signal<string>('');
  isListLoading = signal<boolean>(false);
  listError = signal<string>('');

  // Квитанция выбранного абонента
  bill = signal<UtilityBill | null>(null);
  newReading = signal<number | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  selectService(service: UtilityService): void {
    this.selectedService.set(service);
    this.searchQuery.set('');
    this.bill.set(null);
    this.loadSubscribers();
  }

  // Поиск запускается сам через 300 мс после того, как пользователь перестал печатать
  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadSubscribers(), 300);
  }

  loadSubscribers(): void {
    const service = this.selectedService();
    if (!service) return;

    this.isListLoading.set(true);
    this.listError.set('');

    this.billingService.getSubscribers(service.id, this.searchQuery().trim()).subscribe({
      next: (list: UtilityBill[]) => {
        this.subscribers.set(list);
        this.isListLoading.set(false);
      },
      error: (err: unknown) => {
        console.error(err);
        this.subscribers.set([]);
        this.listError.set('Не удалось загрузить абонентов. Проверьте, что бэкенд запущен.');
        this.isListLoading.set(false);
      }
    });
  }

  selectSubscriber(subscriber: UtilityBill): void {
    this.bill.set(subscriber);
    this.newReading.set(null);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  serviceName(serviceId: string): string {
    return this.services.find(s => s.id === serviceId)?.name ?? serviceId;
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
    this.successMessage.set('');

    this.billingService.submitReading(currentBill.id, readingVal).subscribe({
      next: (updatedBill: UtilityBill) => {
        this.bill.set(updatedBill);
        // Обновляем абонента и в списке, чтобы там тоже был новый долг
        this.subscribers.update(list => list.map(s => (s.id === updatedBill.id ? updatedBill : s)));
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
