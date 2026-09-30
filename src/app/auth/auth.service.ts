import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// Вошедший пользователь (то, что возвращает бэкенд при входе)
export interface AuthSession {
  token: string;
  role: 'EMPLOYEE' | 'CITIZEN';
  name: string;
  subscriberId: number | null;   // только для гражданина
  serviceType: string | null;    // только для гражданина
}

const STORAGE_KEY = 'zetta-session';

// Вход/выход. Сессия хранится в браузере, чтобы после обновления страницы не входить заново.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/auth';

  session = signal<AuthSession | null>(readStored());
  isEmployee = computed(() => this.session()?.role === 'EMPLOYEE');
  isCitizen = computed(() => this.session()?.role === 'CITIZEN');

  loginEmployee(login: string, password: string): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.apiUrl}/employee`, { login, password })
      .pipe(tap(s => this.save(s)));
  }

  loginCitizen(serviceType: string, accountNumber: string, phone: string): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.apiUrl}/citizen`, { serviceType, accountNumber, phone })
      .pipe(tap(s => this.save(s)));
  }

  logout(): void {
    if (this.session()) {
      // Сообщаем бэкенду, что токен больше не нужен (ошибку игнорируем — выходим в любом случае)
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({ error: () => {} });
    }
    this.clear();
  }

  // Забыть сессию (например, когда бэкенд ответил 401 — токен устарел)
  clear(): void {
    this.session.set(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* браузер запретил хранилище */ }
  }

  private save(session: AuthSession): void {
    this.session.set(session);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch { /* браузер запретил хранилище */ }
  }
}

function readStored(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}
