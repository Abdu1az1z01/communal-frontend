import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingService } from '../billing.service';
import { Subscriber } from '../billing.model';
import { UtilityService, findService } from '../services';
import { SubscriberFormComponent } from '../components/subscriber-form.component';

// Страница «Абоненты предприятия»: таблица с поиском, страницами,
// добавлением, редактированием и удалением абонентов
@Component({
  selector: 'app-subscribers-page',
  standalone: true,
  imports: [FormsModule, SubscriberFormComponent],
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
  searchAllServices = signal<boolean>(false);   // галочка «Искать во всех услугах»
  page = signal<number>(1);
  isLoading = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');

  // Окно добавления/редактирования: null — закрыто, 'new' — новый абонент, иначе — редактируемый
  formTarget = signal<Subscriber | 'new' | null>(null);

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
      this.searchAllServices.set(false);
      this.success.set('');
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

  onSearchAllChange(value: boolean): void {
    this.searchAllServices.set(value);
    this.load();
  }

  load(): void {
    const service = this.service();
    if (!service) return;

    this.isLoading.set(true);
    this.error.set('');

    const search = this.searchQuery().trim();
    const request = this.searchAllServices()
      ? this.billingService.searchAll(search)
      : this.billingService.getSubscribers(service.id, search);

    request.subscribe({
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

  // Услуга абонента (нужна, когда ищем во всех услугах)
  serviceOf(subscriber: Subscriber): UtilityService | undefined {
    return findService(subscriber.serviceType);
  }

  formService(): UtilityService {
    const target = this.formTarget();
    const fromSubscriber = target && target !== 'new' ? this.serviceOf(target) : undefined;
    return fromSubscriber ?? this.service()!;
  }

  editTarget(): Subscriber | null {
    const target = this.formTarget();
    return target === 'new' ? null : target;
  }

  onSaved(subscriber: Subscriber): void {
    const isNew = this.formTarget() === 'new';
    this.formTarget.set(null);
    this.success.set(isNew ? `Абонент «${subscriber.ownerName}» добавлен.` : `Данные абонента «${subscriber.ownerName}» сохранены.`);
    this.load();
  }

  deleteSubscriber(subscriber: Subscriber): void {
    if (!confirm(`Удалить абонента «${subscriber.ownerName}» (л/с ${subscriber.accountNumber}) вместе со всей историей начислений?`)) {
      return;
    }
    this.billingService.deleteSubscriber(subscriber.id).subscribe({
      next: () => {
        this.success.set(`Абонент «${subscriber.ownerName}» удалён.`);
        this.load();
      },
      error: (err: unknown) => {
        console.error(err);
        this.error.set('Не удалось удалить абонента. ' + this.billingService.describeError(err));
      }
    });
  }
}
