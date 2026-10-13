/**
 * Session lifecycle & 192-hour (8-day) offline validity utilities.
 */

export const SESSION_MAX_AGE_HOURS = 192;
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_HOURS * 60 * 60 * 1000; // 691,200,000 ms

export const AUTH_TIMESTAMP_KEY = 'nbo_auth_login_timestamp';

/**
 * Checks whether an authentication timestamp has expired under the 192-hour rule.
 *
 * @param loginTimestampMs Timestamp in milliseconds when the user last authenticated online
 * @param nowMs Current time in milliseconds (defaults to Date.now())
 * @returns true if expired or invalid, false if within the 192-hour window
 */
export function isSessionExpired(loginTimestampMs: number | null | undefined, nowMs: number = Date.now()): boolean {
  if (!loginTimestampMs || typeof loginTimestampMs !== 'number' || isNaN(loginTimestampMs)) {
    return true;
  }
  if (loginTimestampMs > nowMs) {
    // Timestamp from the future is invalid
    return true;
  }
  return nowMs - loginTimestampMs >= SESSION_MAX_AGE_MS;
}

/**
 * Calculates remaining hours before mandatory re-authentication.
 *
 * @param loginTimestampMs Timestamp in milliseconds when the user last authenticated online
 * @param nowMs Current time in milliseconds
 * @returns remaining whole hours (0 if expired)
 */
export function getRemainingSessionHours(loginTimestampMs: number | null | undefined, nowMs: number = Date.now()): number {
  if (!loginTimestampMs || isSessionExpired(loginTimestampMs, nowMs)) {
    return 0;
  }
  const elapsedMs = nowMs - loginTimestampMs;
  const remainingMs = Math.max(0, SESSION_MAX_AGE_MS - elapsedMs);
  return Math.floor(remainingMs / (60 * 60 * 1000));
}

/**
 * Formats the remaining session duration for user-friendly UI display.
 */
export function formatRemainingSession(loginTimestampMs: number | null | undefined, nowMs: number = Date.now()): string {
  const hours = getRemainingSessionHours(loginTimestampMs, nowMs);
  if (hours <= 0) return 'Expired';
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days > 0) {
    return `${days}d ${remainingHours}h remaining`;
  }
  return `${remainingHours}h remaining`;
}

/**
 * Reads the stored login timestamp from storage.
 */
export function getStoredLoginTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(AUTH_TIMESTAMP_KEY);
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Saves the login timestamp to storage.
 */
export function setStoredLoginTimestamp(timestampMs: number = Date.now()): void {
  try {
    localStorage.setItem(AUTH_TIMESTAMP_KEY, timestampMs.toString());
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clears the login timestamp from storage.
 */
export function clearStoredLoginTimestamp(): void {
  try {
    localStorage.removeItem(AUTH_TIMESTAMP_KEY);
  } catch {
    // Ignore storage errors
  }
}
