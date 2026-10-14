import { describe, it, expect } from 'vitest';
import { incrementSerialNumber } from './ChequeEntryForm';

describe('incrementSerialNumber', () => {
  it('handles empty or whitespace strings', () => {
    expect(incrementSerialNumber('')).toBe('');
    expect(incrementSerialNumber('   ')).toBe('');
  });

  it('increments standard 6-digit cheque numbers preserving zero padding', () => {
    expect(incrementSerialNumber('001248')).toBe('001249');
    expect(incrementSerialNumber('000001')).toBe('000002');
    expect(incrementSerialNumber('000999')).toBe('001000');
    expect(incrementSerialNumber('099999')).toBe('100000');
    expect(incrementSerialNumber('123456')).toBe('123457');
  });

  it('increments prefixed cheque serial numbers', () => {
    expect(incrementSerialNumber('CHQ-0045')).toBe('CHQ-0046');
    expect(incrementSerialNumber('NBO-99')).toBe('NBO-100');
    expect(incrementSerialNumber('LEAF#001')).toBe('LEAF#002');
  });

  it('leaves non-numeric serial strings unchanged', () => {
    expect(incrementSerialNumber('VOID')).toBe('VOID');
    expect(incrementSerialNumber('TEST')).toBe('TEST');
  });
});
