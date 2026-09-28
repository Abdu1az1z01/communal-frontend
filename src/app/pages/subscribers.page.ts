import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingService } from '../billing.service';
import { Subscriber } from '../billing.model';
import { UtilityService, findService } from '../services';

// Страница «Абоненты предприятия»: таблица с поиском и страницами
@Component({
  selector: 'app-subscribers-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './subscribers.page.html',
  styleUrl: './subscribers.page.css'
})
export class SubscribersPage {
  private billingService = inject(BillingService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  // Сколько абонентов показывать на одной странице таблицы
  readonly pageSize = 10;

  service = signal<UtilityService | undefined>(undefined);
  subscribers = signal<Subscriber[]>([]);
  searchQuery = signal<string>('');
  page = signal<number>(1);
  isLoading = signal<boolean>(false);
  error = signal<string>('');

  pageCount = computed(() => Math.max(1, Math.ceil(this.subscribers().length / this.pageSize)));
  pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));
  pageRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.subscribers().slice(start, start + this.pageSize);
  });

  constructor() {
    // Одна и та же страница переиспользуется при переключении услуги в меню
    inject(ActivatedRoute).paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.service.set(findService(params.get('serviceId')));
      this.searchQuery.set('');
      this.load();
    });
    this.destroyRef.onDestroy(() => clearTimeout(this.searchTimer));
  }

  // Поиск запускается сам через 300 мс после того, как пользователь перестал печатать
  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), 300);
  }

  load(): void {
    const service = this.service();
    if (!service) return;

    this.isLoading.set(true);
    this.error.set('');

    this.billingService.getSubscribers(service.id, this.searchQuery().trim()).subscribe({
      next: list => {
        this.subscribers.set(list);
        this.page.set(1);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error(err);
        this.subscribers.set([]);
        this.error.set('Не удалось загрузить абонентов. ' + this.billingService.describeError(err));
        this.isLoading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.pageCount()));
  }

  openSubscriber(subscriber: Subscriber): void {
    this.router.navigate(['/services', subscriber.serviceType, 'subscribers', subscriber.id]);
  }
}
