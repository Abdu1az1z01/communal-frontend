import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Добавляет токен входа к каждому запросу на бэкенд.
// Если бэкенд ответил 401 (токен устарел, например после перезапуска бэкенда) — отправляет на страницу входа.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.session()?.token;

  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  const isLoginRequest = req.url.includes('/api/auth/employee') || req.url.includes('/api/auth/citizen');

  return next(request).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isLoginRequest) {
        auth.clear();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
