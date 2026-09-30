import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { BillingService } from '../billing.service';
import { Employee } from '../billing.model';
import { EmployeeFormComponent } from '../components/employee-form.component';
import { WorkTimeComponent } from '../components/work-time.component';
import { formatDateTime, formatMinutes } from '../format';

// Страница директора «Сотрудники»: список, роль, место работы, доступ и время работы.
// Карандаш слева при наведении — редактировать; нажатие на строку — время работы.
@Component({
  selector: 'app-employees-page',
  standalone: true,
  imports: [EmployeeFormComponent, WorkTimeComponent],
  templateUrl: './employees.page.html',
  styleUrl: './employees.page.css'
})
export class EmployeesPage {
  private billingService = inject(BillingService);
  auth = inject(AuthService);

  employees = signal<Employee[]>([]);
  error = signal<string>('');
  success = signal<string>('');

  // Окно «Новый / Редактировать сотрудника»: null — закрыто, 'new' — новый
  formTarget = signal<Employee | 'new' | null>(null);
  // Окно «Время работы»
  workTimeOf = signal<Employee | null>(null);

  formatDateTime = formatDateTime;
  formatMinutes = formatMinutes;

  constructor() {
    this.load();
  }

  load(): void {
    this.billingService.getEmployees().subscribe({
      next: list => this.employees.set(list),
      error: (err: unknown) => {
        console.error(err);
        this.error.set('Не удалось загрузить сотрудников. ' + this.billingService.describeError(err));
      }
    });
  }

  editTarget(): Employee | null {
    const t = this.formTarget();
    return t === 'new' ? null : t;
  }

  isSelf(e: Employee | null): boolean {
    return e !== null && e.id === this.auth.session()?.employeeId;
  }

  onSaved(e: Employee): void {
    const isNew = this.formTarget() === 'new';
    this.formTarget.set(null);
    this.success.set(isNew ? `Сотрудник «${e.fullName}» добавлен.` : `Данные сотрудника «${e.fullName}» сохранены.`);
    this.load();
  }
}
