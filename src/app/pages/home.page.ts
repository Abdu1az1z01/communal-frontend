import { Component } from '@angular/core';

// Стартовая страница: пока предприятие не выбрано
@Component({
  selector: 'app-home-page',
  standalone: true,
  template: `
    <section class="card empty-card">
      <div class="empty-icon">👈</div>
      <div class="empty-title">Выберите коммунальное предприятие</div>
      <div class="muted">Нажмите на услугу в меню слева, чтобы увидеть список абонентов</div>
    </section>
  `
})
export class HomePage {}
