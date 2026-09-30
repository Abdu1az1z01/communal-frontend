import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../billing.service';
import { Tariff } from '../billing.model';
import { SERVICES, UtilityService } from '../services';
import { TariffStore } from '../tariff.store';
import { formatDate } from '../format';

// Страница директора «Тарифы»: единый тариф для каждой услуги.
// Новый тариф начинает действовать с выбранной даты; начисления, созданные раньше, не пересчитываются.
@Component({
  selector: 'app-tariffs-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tariffs.page.html',
  styleUrl: './tariffs.page.css'
})
export class TariffsPage {
  private billingService = inject(BillingService);
  tariffStore = inject(TariffStore);

  services = SERVICES;
  formatDate = formatDate;
  today = todayIso();

  // Форма «Новый тариф» открыта для этой услуги
  editingService = signal<string | null>(null);
  newPrice: number | null = null;
  newDate = this.today;
  isSaving = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');

  // Тарифы по услугам: { 'gas': [планируемые..., действующий, прошлые...] }
  byService = computed(() => {
    const map: Record<string, Tariff[]> = {};
    for (const t of this.tariffStore.tariffs()) {
      (map[t.serviceType] ??= []).push(t);
    }
    return map;
  });

  constructor() {
    this.tariffStore.reload();
  }

  current(serviceId: string): Tariff | undefined {
    return this.byService()[serviceId]?.find(t => t.status === 'CURRENT');
  }

  openForm(service: UtilityService): void {
    this.editingService.set(service.id);
    this.newPrice = this.current(service.id)?.price ?? null;
    this.newDate = this.today;
    this.error.set('');
    this.success.set('');
  }

  save(service: UtilityService): void {
    if (this.newPrice === null || this.newPrice <= 0) {
      this.error.set('Введите тариф больше нуля.');
      return;
    }
    if (!this.newDate || this.newDate < this.today) {
      this.error.set('Дата начала — сегодня или позже.');
      return;
    }
    this.isSaving.set(true);
    this.error.set('');
    this.billingService.createTariff(service.id, this.newPrice, this.newDate).subscribe({
      next: t => {
        this.isSaving.set(false);
        this.editingService.set(null);
        this.success.set(`${service.name}: тариф ${t.price} сом/${service.unit} с ${formatDate(t.effectiveFrom)}.`);
        this.tariffStore.reload();
      },
      error: (err: unknown) => {
        console.error(err);
        this.error.set(this.billingService.describeError(err));
        this.isSaving.set(false);
      }
    });
  }

  cancel(tariff: Tariff, service: UtilityService): void {
    if (!confirm(`Отменить тариф ${tariff.price} сом/${service.unit} с ${formatDate(tariff.effectiveFrom)}?`)) return;
    this.billingService.cancelTariff(tariff.id).subscribe({
      next: () => {
        this.success.set('Запланированный тариф отменён.');
        this.tariffStore.reload();
      },
      error: (err: unknown) => {
        console.error(err);
        this.error.set(this.billingService.describeError(err));
      }
    });
  }
}

// Сегодняшняя дата в формате '2026-09-30' (по времени браузера)
function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
