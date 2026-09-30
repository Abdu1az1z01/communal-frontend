import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Страницы сотрудников: гражданина отправляем в его кабинет, не вошедшего — на вход
export const employeeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isEmployee()) return true;
  return router.createUrlTree([auth.isCitizen() ? '/my' : '/login']);
};

// Кабинет гражданина
export const citizenGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isCitizen()) return true;
  return router.createUrlTree([auth.isEmployee() ? '/' : '/login']);
};

// Страница входа: если уже вошли — сразу на свою стартовую страницу
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isEmployee()) return router.createUrlTree(['/']);
  if (auth.isCitizen()) return router.createUrlTree(['/my']);
  return true;
};
