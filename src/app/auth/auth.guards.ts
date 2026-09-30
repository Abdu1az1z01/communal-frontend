import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Все страницы сайта — только для вошедших сотрудников инспекции
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);
};

// Страница входа: если уже вошли — сразу на стартовую
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? inject(Router).createUrlTree(['/']) : true;
};

// Страницы директора (сотрудники, тарифы): инспектора отправляем на стартовую
export const directorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isDirector()) return true;
  return router.createUrlTree([auth.isLoggedIn() ? '/' : '/login']);
};
