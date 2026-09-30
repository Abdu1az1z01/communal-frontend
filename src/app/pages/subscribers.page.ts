import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingService } from '../billing.service';
import { Subscriber } from '../billing.model';
import { UtilityService, findService } from '../services';
import { SubscriberFormComponent } from '../components/subscriber-form.component';

// Страница «Абоненты предприятия»: таблица с поиском и прокруткой (строки подгружаются по мере прокрутки).
// Карандаш слева при наведении на абонента открывает окно редактирования
// (данные, статусы оплаты по месяцам, удаление).
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

  // Сколько строк показывать сразу и сколько добавлять при прокрутке вниз
  readonly chunkSize = 30;

  service = signal<UtilityService | undefined>(undefined);
  subscribers = signal<Subscriber[]>([]);
  searchQuery = signal<string>('');
  searchAllServices = signal<boolean>(false);   // галочка «Искать во всех услугах»
  visibleCount = signal<number>(this.chunkSize);
  isLoading = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');

  // Окно добавления/редактирования: null — закрыто, 'new' — новый абонент, иначе — редактируемый
  formTarget = signal<Subscriber | 'new' | null>(null);

  visibleRows = computed(() => this.subscribers().slice(0, this.visibleCount()));
  hasMore = computed(() => this.visibleCount() < this.subscribers().length);

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
        this.visibleCount.set(this.chunkSize);
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

  // Прокрутили таблицу почти до конца — показываем следующие строки
  onTableScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (this.hasMore() && el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      this.visibleCount.update(n => n + this.chunkSize);
    }
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

  // Статус оплаты изменили в окне редактирования — обновляем долг в таблице
  onStatusChanged(updated: Subscriber): void {
    this.subscribers.update(list => list.map(s => (s.id === updated.id ? updated : s)));
  }

  onDeleted(): void {
    const target = this.formTarget();
    this.formTarget.set(null);
    if (target && target !== 'new') {
      this.success.set(`Абонент «${target.ownerName}» удалён.`);
    }
    this.load();
  }
}
