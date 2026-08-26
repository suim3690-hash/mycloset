export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function oneYearBefore(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return toDateKey(new Date(y - 1, m - 1, d));
}

export function addMonths(dateKey, months) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return toDateKey(new Date(y, m - 1 + months, d));
}
