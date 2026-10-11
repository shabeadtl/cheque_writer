import { describe, it, expect } from 'vitest';
import {
  amountToWords,
  formatAmountDisplay,
  isValidAmount,
  splitAmountWords,
} from './amount-to-words';

describe('amountToWords', () => {
  // ── Basic rials ─────────────────────────────────────────────────
  it('converts zero', () => {
    expect(amountToWords('0')).toBe('Zero Rials Only');
    expect(amountToWords('0.000')).toBe('Zero Rials Only');
  });

  it('converts one rial (singular)', () => {
    expect(amountToWords('1')).toBe('One Rial Only');
    expect(amountToWords('1.000')).toBe('One Rial Only');
  });

  it('converts small rials (plural)', () => {
    expect(amountToWords('2')).toBe('Two Rials Only');
    expect(amountToWords('5')).toBe('Five Rials Only');
    expect(amountToWords('10')).toBe('Ten Rials Only');
    expect(amountToWords('19')).toBe('Nineteen Rials Only');
  });

  it('converts tens', () => {
    expect(amountToWords('20')).toBe('Twenty Rials Only');
    expect(amountToWords('45')).toBe('Forty Five Rials Only');
    expect(amountToWords('99')).toBe('Ninety Nine Rials Only');
  });

  it('converts hundreds', () => {
    expect(amountToWords('100')).toBe('One Hundred Rials Only');
    expect(amountToWords('250')).toBe('Two Hundred Fifty Rials Only');
    expect(amountToWords('999')).toBe('Nine Hundred Ninety Nine Rials Only');
  });

  it('converts thousands', () => {
    expect(amountToWords('1000')).toBe('One Thousand Rials Only');
    expect(amountToWords('1500')).toBe('One Thousand Five Hundred Rials Only');
    expect(amountToWords('12345')).toBe(
      'Twelve Thousand Three Hundred Forty Five Rials Only'
    );
    expect(amountToWords('99999')).toBe(
      'Ninety Nine Thousand Nine Hundred Ninety Nine Rials Only'
    );
  });

  it('converts large numbers', () => {
    expect(amountToWords('1000000')).toBe('One Million Rials Only');
    expect(amountToWords('2500000')).toBe(
      'Two Million Five Hundred Thousand Rials Only'
    );
  });

  // ── Baisa only ──────────────────────────────────────────────────
  it('converts baisa only', () => {
    expect(amountToWords('0.001')).toBe('One Baisa Only');
    expect(amountToWords('0.010')).toBe('Ten Baisa Only');
    expect(amountToWords('0.100')).toBe('One Hundred Baisa Only');
    expect(amountToWords('0.250')).toBe('Two Hundred Fifty Baisa Only');
    expect(amountToWords('0.500')).toBe('Five Hundred Baisa Only');
    expect(amountToWords('0.999')).toBe('Nine Hundred Ninety Nine Baisa Only');
  });

  it('handles baisa with fewer than 3 digits', () => {
    expect(amountToWords('0.5')).toBe('Five Hundred Baisa Only');
    expect(amountToWords('0.25')).toBe('Two Hundred Fifty Baisa Only');
    expect(amountToWords('0.05')).toBe('Fifty Baisa Only');
  });

  // ── Rials and baisa ─────────────────────────────────────────────
  it('converts rials and baisa', () => {
    expect(amountToWords('1.500')).toBe(
      'One Rial and Five Hundred Baisa Only'
    );
    expect(amountToWords('100.250')).toBe(
      'One Hundred Rials and Two Hundred Fifty Baisa Only'
    );
    expect(amountToWords('1234.567')).toBe(
      'One Thousand Two Hundred Thirty Four Rials and Five Hundred Sixty Seven Baisa Only'
    );
  });

  it('handles common cheque amounts', () => {
    expect(amountToWords('50.000')).toBe('Fifty Rials Only');
    expect(amountToWords('75.500')).toBe(
      'Seventy Five Rials and Five Hundred Baisa Only'
    );
    expect(amountToWords('1000.750')).toBe(
      'One Thousand Rials and Seven Hundred Fifty Baisa Only'
    );
    expect(amountToWords('5000.100')).toBe(
      'Five Thousand Rials and One Hundred Baisa Only'
    );
  });

  // ── Commas and whitespace ───────────────────────────────────────
  it('handles commas in input', () => {
    expect(amountToWords('1,234.567')).toBe(
      'One Thousand Two Hundred Thirty Four Rials and Five Hundred Sixty Seven Baisa Only'
    );
    expect(amountToWords('1,000,000')).toBe('One Million Rials Only');
  });

  it('handles whitespace in input', () => {
    expect(amountToWords(' 100.500 ')).toBe(
      'One Hundred Rials and Five Hundred Baisa Only'
    );
  });

  // ── Invalid inputs ──────────────────────────────────────────────
  it('returns null for invalid inputs', () => {
    expect(amountToWords('')).toBeNull();
    expect(amountToWords('abc')).toBeNull();
    expect(amountToWords('.')).toBeNull();
    expect(amountToWords('-1')).toBeNull();
    expect(amountToWords('1.2345')).toBeNull(); // too many decimals
    expect(amountToWords('1.23.45')).toBeNull();
  });
});

describe('formatAmountDisplay', () => {
  it('formats with 3 decimal places', () => {
    expect(formatAmountDisplay('1')).toBe('1.000');
    expect(formatAmountDisplay('100')).toBe('100.000');
    expect(formatAmountDisplay('1.5')).toBe('1.500');
    expect(formatAmountDisplay('1234.567')).toBe('1,234.567');
    expect(formatAmountDisplay('0.001')).toBe('0.001');
  });

  it('adds thousand separators', () => {
    expect(formatAmountDisplay('1000')).toBe('1,000.000');
    expect(formatAmountDisplay('1000000')).toBe('1,000,000.000');
  });

  it('returns null for invalid input', () => {
    expect(formatAmountDisplay('')).toBeNull();
    expect(formatAmountDisplay('abc')).toBeNull();
  });
});

describe('isValidAmount', () => {
  it('validates correct amounts', () => {
    expect(isValidAmount('0')).toBe(true);
    expect(isValidAmount('1')).toBe(true);
    expect(isValidAmount('100.500')).toBe(true);
    expect(isValidAmount('1234.567')).toBe(true);
    expect(isValidAmount('0.001')).toBe(true);
  });

  it('rejects invalid amounts', () => {
    expect(isValidAmount('')).toBe(false);
    expect(isValidAmount('abc')).toBe(false);
    expect(isValidAmount('-1')).toBe(false);
    expect(isValidAmount('1.2345')).toBe(false);
  });
});

describe('splitAmountWords', () => {
  it('returns single line for short text', () => {
    const [line1, line2] = splitAmountWords('One Rial Only');
    expect(line1).toBe('One Rial Only');
    expect(line2).toBe('');
  });

  it('splits long text at word boundary', () => {
    const long =
      'One Thousand Two Hundred Thirty Four Rials and Five Hundred Sixty Seven Baisa Only';
    const [line1, line2] = splitAmountWords(long, 50);
    expect(line1.length).toBeLessThanOrEqual(50);
    expect(`${line1} ${line2}`).toBe(long);
    // Verify split at word boundary
    expect(line1.endsWith(' ')).toBe(false);
    expect(line2.startsWith(' ')).toBe(false);
  });

  it('respects custom maxChars', () => {
    const text = 'Fifty Rials and Five Hundred Baisa Only';
    const [line1, line2] = splitAmountWords(text, 20);
    expect(line1.length).toBeLessThanOrEqual(20);
    expect(line2.length).toBeGreaterThan(0);
  });
});
