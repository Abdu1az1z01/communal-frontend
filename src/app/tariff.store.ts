import { Injectable, computed, inject, signal } from '@angular/core';
import { BillingService } from './billing.service';
import { Tariff } from './billing.model';

// Единые тарифы, загруженные с бэкенда. Нужны таблицам абонентов (колонка «Тариф»)
// и странице тарифов директора. Загружаются один раз, после изменения — reload().
@Injectable({ providedIn: 'root' })
export class TariffStore {
  private billingService = inject(BillingService);

  tariffs = signal<Tariff[]>([]);
  private loaded = false;

  // Действующая цена по каждой услуге: { 'gas': 13.5, ... }
  currentPrices = computed(() => {
    const map: Record<string, number> = {};
    for (const t of this.tariffs()) {
      if (t.status === 'CURRENT') map[t.serviceType] = t.price;
    }
    return map;
  });

  ensureLoaded(): void {
    if (!this.loaded) this.reload();
  }

  reload(): void {
    this.loaded = true;
    this.billingService.getTariffs().subscribe({
      next: list => this.tariffs.set(list),
      error: (err: unknown) => {
        console.error(err);
        this.loaded = false;
      }
    });
  }

  currentPrice(serviceType: string): number | undefined {
    return this.currentPrices()[serviceType];
  }
}
