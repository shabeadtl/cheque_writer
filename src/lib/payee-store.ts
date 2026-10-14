/**
 * Saved Payees & Autocomplete Store for NBO Cheque Writer.
 *
 * Persists beneficiary names across cheque print sessions and provides
 * instant typeahead suggestions matching the first letters entered.
 */

import { getAuditLogs } from './audit-log';

const STORAGE_KEY = 'nbo_saved_payees';
const MAX_SAVED = 100;

/**
 * Retrieve the list of unique saved payees.
 * Automatically supplements from audit log history if available.
 */
export function getSavedPayees(): string[] {
  if (typeof window === 'undefined') return [];

  const payeesSet = new Set<string>();

  // 1. Load explicitly saved payees
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const name of parsed) {
          if (typeof name === 'string' && name.trim()) {
            payeesSet.add(name.trim());
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to read saved payees from localStorage:', err);
  }

  // 2. Supplement from recent audit logs (if any exist)
  try {
    const logs = getAuditLogs();
    for (const log of logs) {
      if (log.payee && log.payee.trim()) {
        payeesSet.add(log.payee.trim());
      }
    }
  } catch {
    // Ignore audit log read failures
  }

  return Array.from(payeesSet);
}

/**
 * Save or update a payee name in the saved list.
 * Moves the name to the top of the most recently used (MRU) list.
 */
export function savePayee(name: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) return;

  try {
    const existing = getSavedPayees();
    // Filter out duplicate (case-insensitive) and place new entry at top
    const filtered = existing.filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase()
    );
    const updated = [trimmed, ...filtered].slice(0, MAX_SAVED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save payee:', err);
  }
}

/**
 * Remove a specific payee from the saved list.
 */
export function removeSavedPayee(nameToRemove: string): void {
  if (typeof window === 'undefined') return;
  const target = nameToRemove.trim().toLowerCase();

  try {
    const existing = getSavedPayees();
    const updated = existing.filter((item) => item.toLowerCase() !== target);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove payee:', err);
  }
}

/**
 * Filter suggestions matching the user's input prefix/letters.
 * Prioritizes matches where the query matches the beginning of the name,
 * followed by word-boundary matches.
 */
export function getPayeeSuggestions(query: string, limit = 6): string[] {
  const payees = getSavedPayees();
  const q = query.trim().toLowerCase();

  if (!q) {
    // Return most recent payees when query is empty
    return payees.slice(0, limit);
  }

  const startsWith: string[] = [];
  const wordStarts: string[] = [];
  const contains: string[] = [];

  for (const name of payees) {
    const lower = name.toLowerCase();
    if (lower.startsWith(q)) {
      startsWith.push(name);
    } else if (lower.includes(` ${q}`) || lower.includes(`-${q}`)) {
      wordStarts.push(name);
    } else if (lower.includes(q)) {
      contains.push(name);
    }
  }

  return [...startsWith, ...wordStarts, ...contains].slice(0, limit);
}
