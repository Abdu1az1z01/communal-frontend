// Банки и платёжные сервисы, через которые гражданин может оплатить начисление.
// Чтобы добавить/убрать банк — меняйте здесь.
export interface Bank {
  id: string;
  name: string;
  icon: string;
}

export const BANKS: Bank[] = [
  { id: 'mbank', name: 'MBank', icon: '🟢' },
  { id: 'optima', name: 'Optima Bank', icon: '🔵' },
  { id: 'bakai', name: 'Bakai Bank', icon: '🟣' },
  { id: 'demir', name: 'Demir Bank', icon: '🔴' },
  { id: 'odengi', name: 'О!Деньги', icon: '🟠' },
  { id: 'elsom', name: 'Элсом', icon: '🟡' }
];
