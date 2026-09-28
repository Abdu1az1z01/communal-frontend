// Абонент коммунального предприятия (строка таблицы SUBSCRIBERS на бэкенде)
export interface UtilityBill {
  id: number;
  accountNumber: string;
  serviceType: string;
  ownerName: string;
  address: string;
  previousReading: number;
  currentReading: number;
  tariff: number;
  debt: number;
}
