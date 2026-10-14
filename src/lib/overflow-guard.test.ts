import { describe, it, expect } from 'vitest';
import {
  estimateTextWidthMm,
  getMaxSafeChars,
  checkFieldOverflow,
  checkChequeOverflow,
} from './overflow-guard';
import { DEFAULT_SETTINGS, DEFAULT_FIELD_CONFIG } from './cheque-layout';

describe('overflow-guard', () => {
  describe('estimateTextWidthMm', () => {
    it('returns 0 for empty string', () => {
      expect(estimateTextWidthMm('', 11, 'Arial', false)).toBe(0);
    });

    it('estimates width for typical names proportionally', () => {
      const shortWidth = estimateTextWidthMm('Ahmed Al-Balushi', 11, 'Arial', false);
      const longWidth = estimateTextWidthMm(
        'The National Petroleum Exploration & Development Services International LLC',
        11,
        'Arial',
        false
      );
      expect(shortWidth).toBeGreaterThan(20);
      expect(shortWidth).toBeLessThan(45);
      expect(longWidth).toBeGreaterThan(120);
    });

    it('estimates bold text as wider than non-bold text', () => {
      const normal = estimateTextWidthMm('1,250.500', 12, 'Arial', false);
      const bold = estimateTextWidthMm('1,250.500', 12, 'Arial', true);
      expect(bold).toBeGreaterThan(normal);
    });
  });

  describe('getMaxSafeChars', () => {
    it('calculates reasonable character limits for payee and amount fields', () => {
      const payeeLimit = getMaxSafeChars(DEFAULT_FIELD_CONFIG.payee!);
      const wordsLimit = getMaxSafeChars(DEFAULT_FIELD_CONFIG.amountWords1!);
      const figuresLimit = getMaxSafeChars(DEFAULT_FIELD_CONFIG.amountFigures!);

      expect(payeeLimit).toBeGreaterThan(50);
      expect(payeeLimit).toBeLessThan(80);

      expect(wordsLimit).toBeGreaterThan(65);
      expect(wordsLimit).toBeLessThan(95);

      expect(figuresLimit).toBeGreaterThan(10);
      expect(figuresLimit).toBeLessThan(20);
    });
  });

  describe('checkFieldOverflow', () => {
    it('returns ok status for normal payee name', () => {
      const result = checkFieldOverflow(
        'payee',
        'Payee Name',
        'Sultan Qaboos University Hospital',
        DEFAULT_FIELD_CONFIG.payee!
      );
      expect(result.severity).toBe('ok');
      expect(result.message).toBeUndefined();
    });

    it('detects overflow when payee is excessively long', () => {
      const hugeName =
        'International Integrated Logistics Maritime Commercial Trading and General Contracting Services Public Closed Joint Stock Company';
      const result = checkFieldOverflow(
        'payee',
        'Payee Name',
        hugeName,
        DEFAULT_FIELD_CONFIG.payee!
      );
      expect(result.severity).toBe('overflow');
      expect(result.message).toContain('Exceeds safe line width');
    });

    it('detects warning when text approaches maximum width', () => {
      // Create a string that falls into the 85%-100% threshold
      const safeChars = getMaxSafeChars(DEFAULT_FIELD_CONFIG.payee!);
      const nearLimitName = 'A'.repeat(Math.floor(safeChars * 0.9));
      const result = checkFieldOverflow(
        'payee',
        'Payee Name',
        nearLimitName,
        DEFAULT_FIELD_CONFIG.payee!
      );
      expect(['warning', 'overflow']).toContain(result.severity);
    });
  });

  describe('checkChequeOverflow', () => {
    it('returns hasOverflow false for standard cheque data', () => {
      const check = checkChequeOverflow(
        {
          payee: 'Salim Al-Harthy',
          date: '14/10/2026',
          amountFigures: '1,250.000',
          amountWords1: 'One Thousand Two Hundred Fifty Omani Rials',
          amountWords2: 'and Zero Baisa Only',
        },
        DEFAULT_SETTINGS
      );

      expect(check.hasOverflow).toBe(false);
      expect(check.hasWarning).toBe(false);
    });

    it('identifies overflow when amount words line 1 is excessively long', () => {
      const check = checkChequeOverflow(
        {
          payee: 'Salim Al-Harthy',
          date: '14/10/2026',
          amountFigures: '1,250.000',
          amountWords1:
            'Nine Hundred Ninety-Nine Million Nine Hundred Ninety-Nine Thousand Nine Hundred Ninety-Nine Omani Rials',
          amountWords2: 'and Nine Hundred Ninety Baisa Only',
        },
        DEFAULT_SETTINGS
      );

      expect(check.hasOverflow).toBe(true);
      expect(check.fields.amountWords1?.severity).toBe('overflow');
      expect(check.summaryMessage).toBeDefined();
    });
  });
});
