import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { BillingService } from '../billing.service';

// Страница входа для сотрудников муниципальной инспекции
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

  login = '';
  password = '';
  isLoading = signal<boolean>(false);
  error = signal<string>('');

  submit(): void {
    if (!this.login.trim() || !this.password) {
      this.error.set('Введите логин и пароль.');
      return;
    }
    this.isLoading.set(true);
    this.error.set('');
    this.auth.login(this.login.trim(), this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err: unknown) => {
        console.error(err);
        this.error.set(this.billing.describeError(err));
        this.isLoading.set(false);
      }
    });
  }
}
