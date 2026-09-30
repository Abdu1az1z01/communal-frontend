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
  tariff: number;
  debt: number;
}

// Начисление за один месяц (строка таблицы BILLS на бэкенде)
export interface Bill {
  id: number;
  period: string;          // '2026-09'
  previousReading: number;
  currentReading: number;
  consumption: number;
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
  tariff: number | null;
  currentReading?: number | null;   // только при добавлении
}
