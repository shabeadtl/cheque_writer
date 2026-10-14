import { useState, useMemo, useEffect } from 'react';
import {
  History,
  Search,
  Trash2,
  CheckCircle2,
  TestTube2,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  Printer,
  User,
  Banknote,
  RotateCcw,
} from 'lucide-react';
import {
  getAuditLogs,
  clearAuditLogs,
  exportAuditLogsToCSV,
  exportAuditLogsToJSON,
  type AuditLogEntry,
} from '@/lib/audit-log';
import { cn } from '@/lib/utils';

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<'ALL' | 'CHEQUE_PRINT' | 'TEST_PRINT' | 'FAILED'>('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const refreshLogs = () => {
    setLogs(getAuditLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter action
      if (filterAction === 'CHEQUE_PRINT' && (log.action !== 'CHEQUE_PRINT' || log.status === 'failed')) {
        return false;
      }
      if (filterAction === 'TEST_PRINT' && (log.action !== 'TEST_PRINT' || log.status === 'failed')) {
        return false;
      }
      if (filterAction === 'FAILED' && log.status !== 'failed') {
        return false;
      }

      // Search term
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        log.payee?.toLowerCase().includes(q) ||
        log.serialNumber?.toLowerCase().includes(q) ||
        log.amount?.toLowerCase().includes(q) ||
        log.chequeDate?.toLowerCase().includes(q) ||
        log.userEmail?.toLowerCase().includes(q) ||
        log.printerName?.toLowerCase().includes(q)
      );
    });
  }, [logs, searchTerm, filterAction]);

  // Statistics
  const stats = useMemo(() => {
    const totalPrints = logs.filter((l) => l.action === 'CHEQUE_PRINT' && l.status === 'success').length;
    const totalTests = logs.filter((l) => l.action === 'TEST_PRINT' && l.status === 'success').length;
    const totalFailed = logs.filter((l) => l.status === 'failed').length;

    // Calculate total OMR amount for successfully printed cheques
    let totalOMR = 0;
    for (const l of logs) {
      if (l.action === 'CHEQUE_PRINT' && l.status === 'success') {
        const cleaned = l.amount.replace(/,/g, '');
        const val = parseFloat(cleaned);
        if (!isNaN(val)) totalOMR += val;
      }
    }

    const rate = logs.length > 0 ? Math.round(((logs.length - totalFailed) / logs.length) * 100) : 100;

    return {
      totalPrints,
      totalTests,
      totalFailed,
      totalOMR: totalOMR.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
      rate,
    };
  }, [logs]);

  const handleClear = () => {
    clearAuditLogs();
    refreshLogs();
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#007267]" aria-hidden="true" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Activity Audit Log</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete compliance trail recording every printed cheque leaf, test print, and user action.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportAuditLogsToCSV(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-50 cursor-pointer"
            title="Download audit logs for Excel or accounting reconciliation"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => exportAuditLogsToJSON(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <FileCode className="h-4 w-4 text-blue-600" />
            Export JSON
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/60 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100/70 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
            Clear Log
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Cheques Printed */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cheques Printed</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.totalPrints}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Leaves used</span>
        </div>

        {/* Card 2: Total OMR Value */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Value Issued</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#007267]/10 text-[#007267]">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold font-mono tracking-tight text-slate-900 truncate">
            OMR {stats.totalOMR}
          </p>
          <span className="text-[11px] text-slate-500">Cumulative sum</span>
        </div>

        {/* Card 3: Test Prints */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Plain Paper Tests</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <TestTube2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.totalTests}</p>
          <span className="text-[11px] text-blue-600 font-medium">Leaves saved</span>
        </div>

        {/* Card 4: Print Success Rate */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Reliability Rate</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.rate}%</p>
          <span className="text-[11px] text-slate-500">{stats.totalFailed} errors recorded</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payee, serial #, amount..."
            className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#007267] focus:outline-none focus:ring-2 focus:ring-[#007267]/20"
          />
        </div>

        {/* Action Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'ALL', label: 'All Events' },
              { key: 'CHEQUE_PRINT', label: 'Printed Cheques' },
              { key: 'TEST_PRINT', label: 'Plain Tests' },
              { key: 'FAILED', label: 'Failures' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilterAction(item.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0 cursor-pointer',
                filterAction === item.key
                  ? 'bg-[#007267] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <History className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No activity logs found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {logs.length === 0
                ? 'Every printed cheque leaf and test print will be securely logged here with timestamps and user credentials.'
                : 'No log entries match your search or filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Timestamp</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Leaf #</th>
                  <th scope="col" className="px-4 py-3">Payee / Beneficiary</th>
                  <th scope="col" className="px-4 py-3 text-right">Amount (OMR)</th>
                  <th scope="col" className="px-4 py-3">User & Printer</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Timestamp */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      <div className="font-medium text-slate-900">{log.formattedDate}</div>
                      <div className="text-[10px] text-slate-400">{log.chequeDate ? `Cheque Date: ${log.chequeDate}` : ''}</div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.action === 'CHEQUE_PRINT' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Cheque Leaf
                        </span>
                      ) : log.action === 'TEST_PRINT' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/60">
                          <TestTube2 className="h-3 w-3 text-blue-600" />
                          Plain Test
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200/60">
                          <AlertCircle className="h-3 w-3 text-red-600" />
                          Failed
                        </span>
                      )}
                    </td>

                    {/* Leaf # / Serial */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.serialNumber && log.serialNumber !== 'N/A' ? (
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                          #{log.serialNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">N/A</span>
                      )}
                    </td>

                    {/* Payee */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 line-clamp-1 max-w-[220px]" title={log.payee}>
                        {log.payee || '—'}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 max-w-[220px]" title={log.amountWords}>
                        {log.amountWords || ''}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-slate-900">
                      {log.amount ? `${log.amount}` : '—'}
                    </td>

                    {/* User & Printer */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="truncate max-w-[140px]" title={log.userEmail}>{log.userEmail || 'Local User'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Printer className="h-3 w-3" />
                        <span className="truncate max-w-[140px]" title={log.printerName}>{log.printerName || 'Default'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.status === 'success' ? (
                        <span className="text-emerald-700 font-semibold text-[11px]">Successful</span>
                      ) : (
                        <span className="text-red-600 font-semibold text-[11px]" title={log.errorMessage}>
                          Error: {log.errorMessage?.slice(0, 20) || 'Failed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fade-in"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Clear All Audit Logs?</h3>
                <p className="text-xs text-slate-500">This will permanently erase all local records.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to clear all {logs.length} activity audit log records? Ensure you have exported a CSV copy if needed for accounting.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
              >
                Yes, Clear Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
