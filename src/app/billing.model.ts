// Абонент коммунального предприятия (строка таблицы SUBSCRIBERS на бэкенде)
export interface Subscriber {
  id: number;
  accountNumber: string;
  serviceType: string;
  ownerName: string;
  address: string;
  phone: string | null;
  previousReading: number;
  currentReading: number;
  debt: number;
}

// Начисление за один месяц (строка таблицы BILLS на бэкенде)
export interface Bill {
  id: number;
  period: string;          // '2026-09'
  previousReading: number;
  currentReading: number;
  consumption: number;
  tariff: number | null;   // тариф, по которому посчитано (у старых начислений может не быть)
  amount: number;
  paid: boolean;
  paidAt: string | null;   // '2026-09-10'
  paidVia: string | null;  // банк, через который оплачено
  statusNote: string | null; // причина, если статус вручную изменила инспекция
}

// Данные формы «Добавить / Редактировать абонента»
export interface SubscriberForm {
  ownerName: string;
  accountNumber: string;
  phone: string;
  address: string;
  currentReading?: number | null;   // только при добавлении
}

// Единый тариф услуги (строка таблицы TARIFFS)
export interface Tariff {
  id: number;
  serviceType: string;
  price: number;
  effectiveFrom: string;   // '2026-10-01'
  createdBy: string | null;
  status: 'PAST' | 'CURRENT' | 'PLANNED';
}

// Сотрудник (для страницы директора)
export interface Employee {
  id: number;
  login: string;
  fullName: string;
  role: 'DIRECTOR' | 'INSPECTOR';
  workplace: string | null;
  active: boolean;
  online: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  minutesThisMonth: number;
}

export interface EmployeeForm {
  login: string;
  password: string;
  fullName: string;
  role: 'DIRECTOR' | 'INSPECTOR';
  workplace: string;
  active: boolean;
}

// Время работы сотрудника за месяц
export interface WorkTime {
  month: string;
  totalMinutes: number;
  sessions: { startedAt: string; finishedAt: string; ended: boolean; online: boolean; minutes: number }[];
}
