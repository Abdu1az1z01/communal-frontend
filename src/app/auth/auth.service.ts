import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// Роль сотрудника: директор управляет сотрудниками и тарифами, инспектор работает с абонентами
export type Role = 'DIRECTOR' | 'INSPECTOR';

// Вошедший сотрудник инспекции (то, что возвращает бэкенд при входе)
export interface AuthSession {
  token: string;
  employeeId: number;
  name: string;
  role: Role;
}

const STORAGE_KEY = 'zetta-session';

// Вход/выход сотрудников. Сессия хранится в браузере, чтобы после обновления страницы не входить заново.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = '/api/auth';

  session = signal<AuthSession | null>(readStored());
  isLoggedIn = computed(() => this.session() !== null);
  isDirector = computed(() => this.session()?.role === 'DIRECTOR');

  login(login: string, password: string): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.apiUrl}/employee`, { login, password })
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
    const session = raw ? (JSON.parse(raw) as AuthSession) : null;
    // Сессия от старой версии сайта (без роли) не подходит — нужно войти заново
    return session?.token && session.role ? session : null;
  } catch {
    return null;
  }
}
