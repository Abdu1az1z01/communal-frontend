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
}
