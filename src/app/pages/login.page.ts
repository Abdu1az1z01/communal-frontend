import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { BillingService } from '../billing.service';
import { SERVICES } from '../services';

// Страница входа: сначала выбираем, кто вы — сотрудник или гражданин, потом вводим данные
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css'
})
export class LoginPage {
  private auth = inject(AuthService);
  private billing = inject(BillingService);
  private router = inject(Router);

  services = SERVICES;

  // null — ещё не выбрали, кто входит
  mode = signal<'employee' | 'citizen' | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string>('');

  // Сотрудник
  login = '';
  password = '';

  // Гражданин
  serviceType = SERVICES[0].id;
  accountNumber = '';
  phone = '';

  choose(mode: 'employee' | 'citizen' | null): void {
    this.mode.set(mode);
    this.error.set('');
  }

  submitEmployee(): void {
    if (!this.login.trim() || !this.password) {
      this.error.set('Введите логин и пароль.');
      return;
    }
    this.run(this.auth.loginEmployee(this.login.trim(), this.password), '/');
  }

  submitCitizen(): void {
    if (!this.accountNumber.trim() || !this.phone.trim()) {
      this.error.set('Введите лицевой счёт и номер телефона.');
      return;
    }
    this.run(this.auth.loginCitizen(this.serviceType, this.accountNumber.trim(), this.phone.trim()), '/my');
  }

  private run(request: ReturnType<AuthService['loginEmployee']>, target: string): void {
    this.isLoading.set(true);
    this.error.set('');
    request.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate([target]);
      },
      error: (err: unknown) => {
        console.error(err);
        this.error.set(this.billing.describeError(err));
        this.isLoading.set(false);
      }
    });
  }
}
