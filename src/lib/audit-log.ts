/**
 * Activity Audit Log for NBO Cheque Writer.
 *
 * Records every printed cheque, test print, and failure event for compliance,
 * accounting reconciliation, and security auditing.
 * Operates 100% offline using local persistence with optional cloud sync.
 */

import { supabase } from './supabase';

export type AuditAction = 'CHEQUE_PRINT' | 'TEST_PRINT' | 'PRINT_FAILED';
export type AuditStatus = 'success' | 'failed';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  formattedDate: string; // Local human-readable date & time
  userEmail: string;
  action: AuditAction;
  serialNumber: string;
  payee: string;
  amount: string; // OMR
  amountWords: string;
  chequeDate: string;
  printerName: string;
  status: AuditStatus;
  errorMessage?: string;
  platform: 'electron' | 'web';
}

const STORAGE_KEY = 'nbo_cheque_audit_logs';
const MAX_LOGS = 1000;

/**
 * Generate a random unique ID for the audit log entry.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Formats a Date into a human-readable local string.
 */
function formatLocalTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    hour12: true,
  }).format(date);
}

/**
 * Retrieve all recorded audit logs from local storage.
 */
export function getAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read audit logs from storage:', err);
    return [];
  }
}

/**
 * Persist an audit log entry locally and optionally sync to cloud if online.
 */
export async function recordAuditLog(
  input: Omit<AuditLogEntry, 'id' | 'timestamp' | 'formattedDate'>
): Promise<AuditLogEntry> {
  const now = new Date();
  const entry: AuditLogEntry = {
    ...input,
    id: generateId(),
    timestamp: now.toISOString(),
    formattedDate: formatLocalTimestamp(now),
    serialNumber: input.serialNumber || 'N/A',
  };

  // 1. Local Persistence (synchronous and guaranteed offline)
  try {
    const existing = getAuditLogs();
    const updated = [entry, ...existing].slice(0, MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save audit log entry locally:', err);
  }

  // 2. Cloud Sync (asynchronous, non-blocking fallback if online)
  if (navigator.onLine && supabase) {
    try {
      // Fire and forget, ignore if table doesn't exist
      void supabase.from('cheque_audit_logs').insert([
        {
          id: entry.id,
          timestamp: entry.timestamp,
          user_email: entry.userEmail,
          action: entry.action,
          serial_number: entry.serialNumber,
          payee: entry.payee,
          amount: entry.amount,
          amount_words: entry.amountWords,
          cheque_date: entry.chequeDate,
          printer_name: entry.printerName,
          status: entry.status,
          error_message: entry.errorMessage ?? null,
          platform: entry.platform,
        },
      ]);
    } catch {
      // Suppress cloud errors when offline or unconfigured
    }
  }

  return entry;
}

/**
 * Clears all locally stored audit logs.
 */
export function clearAuditLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear audit logs:', err);
  }
}

/**
 * Converts audit logs to a formatted CSV file and triggers a browser download.
 */
export function exportAuditLogsToCSV(logs: AuditLogEntry[]): void {
  const headers = [
    'Timestamp',
    'Action',
    'Status',
    'Leaf / Serial No.',
    'Payee Name',
    'Amount (OMR)',
    'Amount in Words',
    'Cheque Date',
    'User Email',
    'Printer',
    'Platform',
    'Error Details',
  ];

  const escapeCSV = (value: string | undefined): string => {
    if (value === undefined || value === null) return '""';
    const stringVal = String(value);
    return `"${stringVal.replace(/"/g, '""')}"`;
  };

  const rows = logs.map((log) => [
    escapeCSV(log.formattedDate || log.timestamp),
    escapeCSV(log.action),
    escapeCSV(log.status),
    escapeCSV(log.serialNumber),
    escapeCSV(log.payee),
    escapeCSV(log.amount),
    escapeCSV(log.amountWords),
    escapeCSV(log.chequeDate),
    escapeCSV(log.userEmail),
    escapeCSV(log.printerName),
    escapeCSV(log.platform),
    escapeCSV(log.errorMessage || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `cheque-audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converts audit logs to a JSON file and triggers a browser download.
 */
export function exportAuditLogsToJSON(logs: AuditLogEntry[]): void {
  const jsonContent = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `cheque-audit-log-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
