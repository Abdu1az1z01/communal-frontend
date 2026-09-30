import { Routes } from '@angular/router';
import { HomePage } from './pages/home.page';
import { LoginPage } from './pages/login.page';
import { SubscribersPage } from './pages/subscribers.page';
import { SubscriberPage } from './pages/subscriber.page';
import { citizenGuard, employeeGuard, loginGuard } from './auth/auth.guards';

// Страницы сайта:
//   /login                              — вход: сотрудник или гражданин
//   /                                   — стартовая сотрудника («выберите предприятие»)
//   /services/cold-water                — таблица абонентов предприятия (сотрудник)
//   /services/cold-water/subscribers/5  — история начислений абонента (сотрудник)
//   /my                                 — личный кабинет гражданина (только его лицевой счёт)
export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [loginGuard] },
  { path: '', component: HomePage, canActivate: [employeeGuard] },
  { path: 'services/:serviceId', component: SubscribersPage, canActivate: [employeeGuard] },
  { path: 'services/:serviceId/subscribers/:id', component: SubscriberPage, canActivate: [employeeGuard] },
  { path: 'my', component: SubscriberPage, canActivate: [citizenGuard] },
  { path: '**', redirectTo: '' }
];
