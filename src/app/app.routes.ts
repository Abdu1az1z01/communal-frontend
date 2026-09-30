import { Routes } from '@angular/router';
import { HomePage } from './pages/home.page';
import { LoginPage } from './pages/login.page';
import { SubscribersPage } from './pages/subscribers.page';
import { SubscriberPage } from './pages/subscriber.page';
import { EmployeesPage } from './pages/employees.page';
import { TariffsPage } from './pages/tariffs.page';
import { authGuard, directorGuard, loginGuard } from './auth/auth.guards';

// Страницы сайта (всё, кроме входа, — только для сотрудников муниципальной инспекции):
//   /login                              — вход по логину и паролю
//   /                                   — стартовая («выберите предприятие»)
//   /services/cold-water                — таблица абонентов предприятия
//   /services/cold-water/subscribers/5  — история начислений абонента
//   /employees                          — сотрудники и их время работы (только директор)
//   /tariffs                            — единые тарифы услуг (только директор)
export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [loginGuard] },
  { path: '', component: HomePage, canActivate: [authGuard] },
  { path: 'services/:serviceId', component: SubscribersPage, canActivate: [authGuard] },
  { path: 'services/:serviceId/subscribers/:id', component: SubscriberPage, canActivate: [authGuard] },
  { path: 'employees', component: EmployeesPage, canActivate: [directorGuard] },
  { path: 'tariffs', component: TariffsPage, canActivate: [directorGuard] },
  { path: '**', redirectTo: '' }
];
