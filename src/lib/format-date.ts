import { format, parse } from 'date-fns';

/**
 * Format a date for cheque display.
 *
 * @param dateStr - ISO date string (yyyy-MM-dd) from the date input
 * @returns Formatted date string (dd/MM/yyyy)
 */
export function formatChequeDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(date, 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Get today's date as an ISO string (yyyy-MM-dd).
 */
export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
