import { describe, it, expect, beforeEach } from 'vitest';
import {
  SESSION_MAX_AGE_HOURS,
  SESSION_MAX_AGE_MS,
  isSessionExpired,
  getRemainingSessionHours,
  formatRemainingSession,
  getStoredLoginTimestamp,
  setStoredLoginTimestamp,
  clearStoredLoginTimestamp,
  AUTH_TIMESTAMP_KEY,
} from './auth-session';

describe('auth-session utilities (192-hour policy)', () => {
  const BASE_TIME = 1700000000000;

  it('correctly calculates 192 hours in milliseconds', () => {
    expect(SESSION_MAX_AGE_HOURS).toBe(192);
    expect(SESSION_MAX_AGE_MS).toBe(192 * 60 * 60 * 1000);
  });

  describe('isSessionExpired', () => {
    it('returns true if timestamp is missing or null or NaN', () => {
      expect(isSessionExpired(null)).toBe(true);
      expect(isSessionExpired(undefined)).toBe(true);
      expect(isSessionExpired(NaN)).toBe(true);
    });

    it('returns true if timestamp is in the future', () => {
      expect(isSessionExpired(BASE_TIME + 1000, BASE_TIME)).toBe(true);
    });

    it('returns false when login is fresh', () => {
      expect(isSessionExpired(BASE_TIME, BASE_TIME)).toBe(false);
      expect(isSessionExpired(BASE_TIME - 1000 * 60 * 60, BASE_TIME)).toBe(false); // 1 hour ago
      expect(isSessionExpired(BASE_TIME - 1000 * 60 * 60 * 100, BASE_TIME)).toBe(false); // 100 hours ago
    });

    it('returns false at boundary just before 192 hours', () => {
      const almost192Hours = BASE_TIME - (SESSION_MAX_AGE_MS - 1000);
      expect(isSessionExpired(almost192Hours, BASE_TIME)).toBe(false);
    });

    it('returns true exactly at 192 hours and after', () => {
      const exactly192Hours = BASE_TIME - SESSION_MAX_AGE_MS;
      expect(isSessionExpired(exactly192Hours, BASE_TIME)).toBe(true);

      const past192Hours = BASE_TIME - (SESSION_MAX_AGE_MS + 1000 * 60);
      expect(isSessionExpired(past192Hours, BASE_TIME)).toBe(true);
    });
  });

  describe('getRemainingSessionHours', () => {
    it('returns 192 for brand new session', () => {
      expect(getRemainingSessionHours(BASE_TIME, BASE_TIME)).toBe(192);
    });

    it('returns accurate remaining hours over time', () => {
      const twentyHoursPassed = BASE_TIME - 20 * 60 * 60 * 1000;
      expect(getRemainingSessionHours(twentyHoursPassed, BASE_TIME)).toBe(172);

      const oneHourRemaining = BASE_TIME - 191 * 60 * 60 * 1000;
      expect(getRemainingSessionHours(oneHourRemaining, BASE_TIME)).toBe(1);
    });

    it('returns 0 when session is expired', () => {
      const expired = BASE_TIME - SESSION_MAX_AGE_MS;
      expect(getRemainingSessionHours(expired, BASE_TIME)).toBe(0);
    });
  });

  describe('formatRemainingSession', () => {
    it('formats days and hours accurately', () => {
      // 192 hours = exactly 8 days 0 hours
      expect(formatRemainingSession(BASE_TIME, BASE_TIME)).toBe('8d 0h remaining');

      // 190 hours remaining (7 days 22 hours)
      const twoHoursPassed = BASE_TIME - 2 * 60 * 60 * 1000;
      expect(formatRemainingSession(twoHoursPassed, BASE_TIME)).toBe('7d 22h remaining');

      // 12 hours remaining (< 1 day)
      const twelveHoursRemaining = BASE_TIME - 180 * 60 * 60 * 1000;
      expect(formatRemainingSession(twelveHoursRemaining, BASE_TIME)).toBe('12h remaining');
    });

    it('returns Expired when 192 hours exceeded', () => {
      const expired = BASE_TIME - SESSION_MAX_AGE_MS - 5000;
      expect(formatRemainingSession(expired, BASE_TIME)).toBe('Expired');
    });
  });

  describe('localStorage persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('sets, retrieves, and clears login timestamp', () => {
      expect(getStoredLoginTimestamp()).toBeNull();

      setStoredLoginTimestamp(1234567890);
      expect(localStorage.getItem(AUTH_TIMESTAMP_KEY)).toBe('1234567890');
      expect(getStoredLoginTimestamp()).toBe(1234567890);

      clearStoredLoginTimestamp();
      expect(getStoredLoginTimestamp()).toBeNull();
      expect(localStorage.getItem(AUTH_TIMESTAMP_KEY)).toBeNull();
    });
  });
});
