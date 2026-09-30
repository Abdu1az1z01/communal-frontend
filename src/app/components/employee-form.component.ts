import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../billing.service';
import { Employee, EmployeeForm } from '../billing.model';

// Окно «Новый сотрудник» / «Редактировать сотрудника» (только директор):
// ФИО, логин, роль, место работы, доступ и пароль.
@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.css'
})
export class EmployeeFormComponent implements OnInit {
  private billingService = inject(BillingService);

  employee = input<Employee | null>(null);
  isSelf = input<boolean>(false);   // директор редактирует сам себя — роль и доступ менять нельзя

  saved = output<Employee>();
  closed = output<void>();

  form: EmployeeForm = { login: '', password: '', fullName: '', role: 'INSPECTOR', workplace: '', active: true };
  isSaving = signal<boolean>(false);
  error = signal<string>('');

  ngOnInit(): void {
    const e = this.employee();
    if (e) {
      this.form = { login: e.login, password: '', fullName: e.fullName, role: e.role, workplace: e.workplace ?? '', active: e.active };
    }
  }

  get isEdit(): boolean {
    return this.employee() !== null;
  }

  save(): void {
    if (!this.form.fullName.trim() || (!this.isEdit && !this.form.login.trim())) {
      this.error.set('Заполните ФИО и логин.');
      return;
    }
    if ((!this.isEdit || this.form.password) && this.form.password.length < 6) {
      this.error.set('Пароль — не короче 6 символов.');
      return;
    }
    this.isSaving.set(true);
    this.error.set('');
    const existing = this.employee();
    const request = existing
      ? this.billingService.updateEmployee(existing.id, this.form)
      : this.billingService.createEmployee(this.form);
    request.subscribe({
      next: e => {
        this.isSaving.set(false);
        this.saved.emit(e);
      },
      error: (err: unknown) => {
        console.error(err);
        this.error.set(this.billingService.describeError(err));
        this.isSaving.set(false);
      }
    });
  }
}
