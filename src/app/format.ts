// Форматирование дат для отображения

// '2026-09' → 'Сентябрь 2026'
export function formatPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number);
  const name = new Date(year, month - 1, 1).toLocaleString('ru-RU', { month: 'long' });
  return `${name[0].toUpperCase()}${name.slice(1)} ${year}`;
}

// '2026-09-10' → '10.09.2026'
export function formatDate(date: string): string {
  return date.split('-').reverse().join('.');
}
