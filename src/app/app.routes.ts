import { Routes } from '@angular/router';
import { HomePage } from './pages/home.page';
import { SubscribersPage } from './pages/subscribers.page';
import { SubscriberPage } from './pages/subscriber.page';

// Страницы сайта:
//   /                                 — стартовая («выберите предприятие»)
//   /services/cold-water              — таблица абонентов предприятия
//   /services/cold-water/subscribers/5 — история начислений абонента
export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'services/:serviceId', component: SubscribersPage },
  { path: 'services/:serviceId/subscribers/:id', component: SubscriberPage },
  { path: '**', redirectTo: '' }
];
