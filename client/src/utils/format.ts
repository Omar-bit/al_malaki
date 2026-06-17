export function formatCurrency(
  value: number,
  currency: string = 'TND',
  removeCurrency: boolean = false,
): string {
  const formattedCurrency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  return removeCurrency
    ? formattedCurrency.replace(/[^0-9.,]+/g, '')
    : formattedCurrency;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
