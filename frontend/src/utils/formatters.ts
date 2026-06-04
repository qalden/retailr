import { format, parseISO, isValid } from 'date-fns';

// ─── Currency ─────────────────────────────────────────────────────────────

/**
 * Format a number as USD currency.
 * e.g. 1234.5 → "$1,234.50"
 */
export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Number ───────────────────────────────────────────────────────────────

/**
 * Format a number with fixed decimal places.
 * e.g. formatNumber(1234567.891, 2) → "1,234,567.89"
 */
export function formatNumber(value: number, decimals = 2, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a large number with compact notation.
 * e.g. 1500000 → "1.5M"
 */
export function formatCompactNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

// ─── Date ─────────────────────────────────────────────────────────────────

/**
 * Format a date string (ISO 8601 or Date) as YYYY-MM-DD.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, 'yyyy-MM-dd');
}

/**
 * Format a date string as a human-readable date.
 * e.g. "Jun 4, 2026"
 */
export function formatDateDisplay(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, 'MMM d, yyyy');
}

/**
 * Format a date-time string as a human-readable date and time.
 * e.g. "Jun 4, 2026 at 14:30"
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, "MMM d, yyyy 'at' HH:mm");
}

/**
 * Format a date-time string in full ISO-readable form.
 * e.g. "2026-06-04T14:30:00"
 */
export function formatDateTimeISO(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, "yyyy-MM-dd'T'HH:mm:ss");
}

// ─── Order Status ─────────────────────────────────────────────────────────

export function formatOrderStatus(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    CONFIRMED: 'Confirmed',
    FULFILLED: 'Fulfilled',
    CANCELLED: 'Cancelled',
  };
  return labels[status] ?? status;
}

// ─── Misc ─────────────────────────────────────────────────────────────────

/**
 * Truncate a string to a maximum length, appending "…" if cut.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

/**
 * Capitalise the first letter of a string.
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
