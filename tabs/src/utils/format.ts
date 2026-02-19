/**
 * Format a number as USD currency.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as USD currency with cents.
 */
export function formatCurrencyExact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a percentage (input is 0-100 range).
 */
export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format variance (positive = over budget, negative = under).
 */
export function formatVariance(collected: number, budget: number): string {
  if (budget === 0) return '—';
  const diff = collected - budget;
  const pct = (diff / budget) * 100;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${formatCurrency(diff)} (${sign}${pct.toFixed(1)}%)`;
}

/**
 * Month names array.
 */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Format a date string as a human-readable timestamp.
 */
export function formatTimestamp(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const TERRITORIES = [
  'Territory 1',
  'Territory 2',
  'Territory 3',
  'Territory 4',
  'Vendor Territory 1',
];
