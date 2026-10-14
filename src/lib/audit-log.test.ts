import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAuditLogs,
  recordAuditLog,
  clearAuditLogs,
} from './audit-log';

describe('audit-log', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts with empty logs', () => {
    expect(getAuditLogs()).toEqual([]);
  });

  it('records an audit log entry locally', async () => {
    const entry = await recordAuditLog({
      userEmail: 'finance@nbo-client.com',
      action: 'CHEQUE_PRINT',
      serialNumber: '001248',
      payee: 'Oman Cables Industry SAOG',
      amount: '5,420.750',
      amountWords: 'Five Thousand Four Hundred Twenty Omani Rials and Seven Hundred Fifty Baisa Only',
      chequeDate: '14/10/2026',
      printerName: 'HP LaserJet Pro P1102',
      status: 'success',
      platform: 'electron',
    });

    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
    expect(entry.formattedDate).toBeDefined();
    expect(entry.serialNumber).toBe('001248');

    const logs = getAuditLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.payee).toBe('Oman Cables Industry SAOG');
    expect(logs[0]?.status).toBe('success');
  });

  it('clears audit logs properly', async () => {
    await recordAuditLog({
      userEmail: 'user@nbo.com',
      action: 'TEST_PRINT',
      serialNumber: 'TEST',
      payee: 'Test Payee',
      amount: '100.000',
      amountWords: 'One Hundred Omani Rials Only',
      chequeDate: '14/10/2026',
      printerName: 'Default',
      status: 'success',
      platform: 'web',
    });

    expect(getAuditLogs()).toHaveLength(1);
    clearAuditLogs();
    expect(getAuditLogs()).toHaveLength(0);
  });
});
