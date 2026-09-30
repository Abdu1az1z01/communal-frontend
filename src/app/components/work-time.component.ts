import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../billing.service';
import { Employee, WorkTime } from '../billing.model';
import { formatDateTime, formatMinutes } from '../format';

// Окно «Время работы» сотрудника за выбранный месяц: все входы и выходы и сумма часов
@Component({
  selector: 'app-work-time',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './work-time.component.html',
  styleUrl: './work-time.component.css'
})
export class WorkTimeComponent implements OnInit {
  private billingService = inject(BillingService);

  employee = input.required<Employee>();
  closed = output<void>();

  month = currentMonth();
  workTime = signal<WorkTime | null>(null);
  error = signal<string>('');
  formatDateTime = formatDateTime;
  formatMinutes = formatMinutes;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error.set('');
    this.billingService.getWorkTime(this.employee().id, this.month).subscribe({
      next: wt => this.workTime.set(wt),
      error: (err: unknown) => {
        console.error(err);
        this.error.set(this.billingService.describeError(err));
      }
    });
  }
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
