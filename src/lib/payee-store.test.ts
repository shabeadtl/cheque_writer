import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSavedPayees,
  savePayee,
  removeSavedPayee,
  getPayeeSuggestions,
} from './payee-store';

describe('payee-store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty list when no history exists', () => {
    expect(getSavedPayees()).toEqual([]);
  });

  it('saves and retrieves unique payees with most recent at top', () => {
    savePayee('Oman Cables Industry SAOG');
    savePayee('National Bank of Oman');

    const payees = getSavedPayees();
    expect(payees).toHaveLength(2);
    expect(payees[0]).toBe('National Bank of Oman');
    expect(payees[1]).toBe('Oman Cables Industry SAOG');

    // Updating existing payee moves it to the top without duplicating
    savePayee('Oman Cables Industry SAOG');
    const updated = getSavedPayees();
    expect(updated).toHaveLength(2);
    expect(updated[0]).toBe('Oman Cables Industry SAOG');
    expect(updated[1]).toBe('National Bank of Oman');
  });

  it('removes a saved payee correctly', () => {
    savePayee('Muscat Electricity Distribution');
    savePayee('Ooredoo Oman');
    expect(getSavedPayees()).toHaveLength(2);

    removeSavedPayee('Muscat Electricity Distribution');
    const payees = getSavedPayees();
    expect(payees).toHaveLength(1);
    expect(payees[0]).toBe('Ooredoo Oman');
  });

  it('suggests matching names based on first letters', () => {
    savePayee('Oman Cables Industry SAOG');
    savePayee('Omantel SAOG');
    savePayee('Bank Muscat');
    savePayee('Oman Oil Marketing Company');

    // Searching 'om' should match names starting with 'om'
    const suggestions = getPayeeSuggestions('om');
    expect(suggestions).toHaveLength(3);
    expect(suggestions).toContain('Omantel SAOG');
    expect(suggestions).toContain('Oman Oil Marketing Company');
    expect(suggestions).toContain('Oman Cables Industry SAOG');

    // Searching 'mus' should match Bank Muscat (word boundary)
    const muscatSuggestions = getPayeeSuggestions('mus');
    expect(muscatSuggestions).toContain('Bank Muscat');
  });

  it('ignores strings less than 2 characters when saving', () => {
    savePayee('A');
    savePayee(' ');
    expect(getSavedPayees()).toEqual([]);
  });
});
