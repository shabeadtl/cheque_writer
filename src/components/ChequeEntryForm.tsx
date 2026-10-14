import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Calendar,
  Banknote,
  FileText,
  Printer,
  TestTube2,
  AlertCircle,
  CheckCircle2,
  Hash,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react';
import { amountToWords, formatAmountDisplay, isValidAmount, splitAmountWords } from '@/lib/amount-to-words';
import { getTodayISO, formatChequeDate } from '@/lib/format-date';
import { checkFieldOverflow } from '@/lib/overflow-guard';
import { getPayeeSuggestions, savePayee, removeSavedPayee } from '@/lib/payee-store';
import { DEFAULT_FIELD_CONFIG } from '@/lib/cheque-layout';
import { cn } from '@/lib/utils';
import type { ChequeData, AppSettings } from '@/types/electron.d';

export function incrementSerialNumber(serial: string): string {
  if (!serial.trim()) return '';
  const match = serial.match(/^(.*?)(\d+)$/);
  if (!match || match[1] === undefined || match[2] === undefined) return serial;
  const prefix = match[1];
  const digits = match[2];
  const nextNum = (parseInt(digits, 10) + 1).toString();
  const padded = nextNum.padStart(digits.length, '0');
  return `${prefix}${padded}`;
}

interface ChequeEntryFormProps {
  settings: AppSettings;
  onDataChange: (data: ChequeData) => void;
  onPrintRequest: () => void;
  onTestPrint: () => void;
  lastPrintSuccessTrigger?: number; // increments on successful print to advance serial
}

type InputProblem = string | null;

export function ChequeEntryForm({
  settings,
  onDataChange,
  onPrintRequest,
  onTestPrint,
  lastPrintSuccessTrigger,
}: ChequeEntryFormProps) {
  const [payee, setPayee] = useState('');
  const [date, setDate] = useState(getTodayISO());
  const [amount, setAmount] = useState('');
  const [serialNumber, setSerialNumber] = useState(() => {
    return localStorage.getItem('nbo_last_cheque_serial') || '';
  });
  const [autoIncrement, setAutoIncrement] = useState(() => {
    return localStorage.getItem('nbo_auto_increment_serial') !== 'false';
  });

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [savedPayeesVersion, setSavedPayeesVersion] = useState(0);
  const payeeContainerRef = useRef<HTMLDivElement>(null);

  const [touched, setTouched] = useState({ payee: false, date: false, amount: false });
  const [printing, setPrinting] = useState(false);

  // Auto-increment serial number on successful print
  useEffect(() => {
    if (lastPrintSuccessTrigger && lastPrintSuccessTrigger > 0 && autoIncrement && serialNumber) {
      const next = incrementSerialNumber(serialNumber);
      setSerialNumber(next);
      localStorage.setItem('nbo_last_cheque_serial', next);
    }
  }, [lastPrintSuccessTrigger]);

  // Suggestions computation
  const suggestions = useMemo(() => {
    return getPayeeSuggestions(payee, 6);
  }, [payee, savedPayeesVersion]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (payeeContainerRef.current && !payeeContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const amountWords = useMemo(
    () => (amount && isValidAmount(amount) ? amountToWords(amount) : null),
    [amount]
  );

  const formattedAmount = useMemo(
    () => (amount && isValidAmount(amount) ? formatAmountDisplay(amount) : null),
    [amount]
  );

  const payeeError: InputProblem =
    touched.payee && !payee.trim() ? 'Payee name is required' : null;
  const amountError: InputProblem =
    touched.amount && amount && !isValidAmount(amount)
      ? 'Enter a valid amount, e.g. 123.450 (up to 3 decimal places for Baisa)'
      : null;

  const isValid = Boolean(
    payee.trim() && date && amount && isValidAmount(amount) && amountWords
  );

  const [wordsLine1, wordsLine2] = useMemo(
    () => splitAmountWords(amountWords ?? '', 60),
    [amountWords]
  );

  // ── Overflow Safeguards ──────────────────────────────────────────
  const payeeConfig = settings.fields.payee || DEFAULT_FIELD_CONFIG.payee!;
  const words1Config = settings.fields.amountWords1 || DEFAULT_FIELD_CONFIG.amountWords1!;
  const words2Config = settings.fields.amountWords2 || DEFAULT_FIELD_CONFIG.amountWords2!;

  const payeeOverflow = useMemo(() => {
    return checkFieldOverflow('payee', 'Payee Name', payee, payeeConfig);
  }, [payee, payeeConfig]);

  const words1Overflow = useMemo(() => {
    return checkFieldOverflow('amountWords1', 'Amount in Words (Line 1)', wordsLine1, words1Config);
  }, [wordsLine1, words1Config]);

  const words2Overflow = useMemo(() => {
    return wordsLine2
      ? checkFieldOverflow('amountWords2', 'Amount in Words (Line 2)', wordsLine2, words2Config)
      : null;
  }, [wordsLine2, words2Config]);

  const hasAnyOverflow =
    payeeOverflow.severity === 'overflow' ||
    words1Overflow.severity === 'overflow' ||
    words2Overflow?.severity === 'overflow';

  const notify = useCallback(
    (overrides: Partial<{ payee: string; date: string; amount: string; serialNumber: string }>) => {
      const p = overrides.payee ?? payee;
      const d = overrides.date ?? date;
      const a = overrides.amount ?? amount;
      const s = overrides.serialNumber ?? serialNumber;
      const words = (a && isValidAmount(a) ? amountToWords(a) : null) ?? '';
      const formatted = (a && isValidAmount(a) ? formatAmountDisplay(a) : null) ?? '';
      onDataChange({
        payee: p.trim(),
        date: formatChequeDate(d),
        amount: formatted,
        amountWords: words,
        serialNumber: s.trim(),
      });
    },
    [payee, date, amount, serialNumber, onDataChange]
  );

  // Sync initial state
  useEffect(() => {
    notify({});
  }, []);

  const handlePayee = (v: string) => {
    setPayee(v);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
    notify({ payee: v });
  };

  const handleSelectSuggestion = (chosenName: string) => {
    setPayee(chosenName);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    notify({ payee: chosenName });
  };

  const handlePayeeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'ArrowDown') {
        setShowSuggestions(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIndex]!);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const renderHighlightedName = (text: string, query: string) => {
    if (!query.trim()) return text;
    const q = query.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-bold text-[#007267] underline underline-offset-2">
          {text.slice(idx, idx + q.length)}
        </span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const handleDate = (v: string) => {
    setDate(v);
    notify({ date: v });
  };
  const handleAmount = (v: string) => {
    setAmount(v);
    notify({ amount: v });
  };
  const handleSerialNumber = (v: string) => {
    setSerialNumber(v);
    localStorage.setItem('nbo_last_cheque_serial', v);
    notify({ serialNumber: v });
  };
  const handleAutoIncrementToggle = (checked: boolean) => {
    setAutoIncrement(checked);
    localStorage.setItem('nbo_auto_increment_serial', String(checked));
  };

  const guardAction = (action: () => void) => {
    setTouched({ payee: true, date: true, amount: true });
    if (!isValid) return;
    if (payee.trim()) {
      savePayee(payee.trim());
      setSavedPayeesVersion((v) => v + 1);
    }
    setPrinting(true);
    Promise.resolve(action()).finally(() => setPrinting(false));
  };

  return (
    <div className="animate-fade-in space-y-3.5">
      {/* ── Section: Cheque details ───────────────────────────────── */}
      <section aria-labelledby="cheque-details-heading">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#007267]/10 text-[#007267] dark:bg-[#007267]/25 dark:text-[#00c4b4]">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <h2 id="cheque-details-heading" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Cheque Details
            </h2>
          </div>
          {hasAnyOverflow && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
              <AlertCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" /> Line Overflow
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
          {/* Row 1: Serial Number & Cheque Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Cheque Serial Number (Leaf #) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="serialNumber" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Cheque Leaf No.
                </label>
                <button
                  type="button"
                  onClick={() => handleAutoIncrementToggle(!autoIncrement)}
                  title={autoIncrement ? "Auto-increments on print enabled" : "Click to enable auto-increment"}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-all cursor-pointer border",
                    autoIncrement
                      ? "bg-[#007267]/10 text-[#007267] border-[#007267]/30 dark:bg-[#007267]/25 dark:text-[#00c4b4] dark:border-[#007267]/50"
                      : "bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                  )}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  Auto +1
                </button>
              </div>
              <div className="relative">
                <Hash
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="serialNumber"
                  type="text"
                  placeholder="001248"
                  autoComplete="off"
                  value={serialNumber}
                  onChange={(e) => handleSerialNumber(e.target.value)}
                  className="h-9.5 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-8.5 pr-3 font-mono text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#007267] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007267]/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#00c4b4] dark:focus:bg-slate-800"
                />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label htmlFor="cheque-date" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Cheque Date
              </label>
              <div className="relative">
                <Calendar
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="cheque-date"
                  type="date"
                  value={date}
                  onChange={(e) => handleDate(e.target.value)}
                  className="h-9.5 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-8.5 pr-3 text-sm text-slate-900 transition-colors focus:border-[#007267] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007267]/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:border-[#00c4b4] dark:focus:bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Payee Name with Autocomplete Suggestions & Overflow Safeguard */}
          <div ref={payeeContainerRef} className="relative space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="payee" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Payee / Beneficiary Name
              </label>
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0.5 rounded',
                  payeeOverflow.severity === 'overflow' && 'bg-rose-100 text-rose-700 font-bold dark:bg-rose-950/80 dark:text-rose-300',
                  payeeOverflow.severity === 'warning' && 'bg-amber-100 text-amber-700 font-medium dark:bg-amber-950/80 dark:text-amber-300',
                  payeeOverflow.severity === 'ok' && 'text-slate-400 dark:text-slate-500'
                )}
              >
                {payee.length} / {payeeOverflow.maxSafeChars} chars
              </span>
            </div>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              <input
                id="payee"
                type="text"
                placeholder="Enter or select beneficiary name"
                autoComplete="off"
                value={payee}
                onChange={(e) => handlePayee(e.target.value)}
                onKeyDown={handlePayeeKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => setTouched((t) => ({ ...t, payee: true }))}
                aria-invalid={!!payeeError || payeeOverflow.severity === 'overflow'}
                aria-describedby={payeeError ? 'payee-error' : undefined}
                className={cn(
                  'h-10 w-full rounded-lg border pl-9 pr-3 text-sm transition-all focus:outline-none focus:ring-2',
                  payeeError
                    ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-red-500/20 dark:bg-red-950/20 dark:text-red-200'
                    : payeeOverflow.severity === 'overflow'
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-rose-950/20 dark:text-rose-200'
                    : payeeOverflow.severity === 'warning'
                    ? 'border-amber-400 bg-amber-50/20 text-slate-900 focus:border-amber-500 focus:ring-amber-500/20 dark:bg-amber-950/20 dark:text-slate-100'
                    : 'border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:border-[#007267] focus:bg-white focus:ring-[#007267]/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#00c4b4] dark:focus:bg-slate-800'
                )}
              />
            </div>

            {/* Payee Autocomplete Floating Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                role="listbox"
                aria-label="Suggested Beneficiaries"
                className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-xl animate-fade-in dark:border-slate-700 dark:bg-slate-800/95"
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/90 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#007267] dark:text-[#00c4b4]" aria-hidden="true" />
                    Saved Payees
                  </span>
                  <span className="text-[9px] text-slate-400 font-normal">↑↓ to navigate, Enter to pick</span>
                </div>
                <ul className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                  {suggestions.map((name, index) => {
                    const isHighlighted = index === highlightedIndex;
                    return (
                      <li
                        key={name}
                        role="option"
                        aria-selected={isHighlighted}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion(name);
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={cn(
                          'group flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer select-none',
                          isHighlighted
                            ? 'bg-[#007267]/10 text-[#007267] dark:bg-[#007267]/25 dark:text-[#00c4b4] font-medium'
                            : 'text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <User
                            className={cn(
                              'h-3.5 w-3.5 shrink-0',
                              isHighlighted ? 'text-[#007267] dark:text-[#00c4b4]' : 'text-slate-400 dark:text-slate-500'
                            )}
                          />
                          <span className="truncate">{renderHighlightedName(name, payee)}</span>
                        </div>
                        <button
                          type="button"
                          title="Remove from saved payees"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeSavedPayee(name);
                            setSavedPayeesVersion((v) => v + 1);
                          }}
                          className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-400 hover:bg-slate-200/70 hover:text-rose-600 transition-all cursor-pointer dark:hover:bg-slate-700 dark:hover:text-rose-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Error or Overflow Notice */}
            {payeeError && (
              <p id="payee-error" className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                {payeeError}
              </p>
            )}

            {!payeeError && payeeOverflow.severity === 'overflow' && (
              <p className="flex items-center gap-1.5 text-xs text-rose-600 font-medium dark:text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {payeeOverflow.message}
              </p>
            )}
          </div>

          {/* Amount (OMR) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="amount" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Amount (OMR)
              </label>
              {formattedAmount && !amountError && (
                <span className="text-[11px] font-mono font-semibold text-[#007267] dark:text-[#00c4b4]">
                  {formattedAmount} OMR
                </span>
              )}
            </div>
            <div className="relative flex h-10 items-stretch overflow-hidden rounded-lg border border-slate-200 bg-slate-50/60 transition-colors focus-within:border-[#007267] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007267]/20 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:border-[#00c4b4] dark:focus-within:bg-slate-800">
              <span
                className="flex shrink-0 select-none items-center gap-1.5 border-r border-slate-200 bg-slate-100/70 px-3 font-mono text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                aria-hidden="true"
              >
                <Banknote className="h-3.5 w-3.5 text-[#007267] dark:text-[#00c4b4]" />
                OMR
              </span>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0.000"
                autoComplete="off"
                value={amount}
                onChange={(e) => handleAmount(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
                aria-invalid={!!amountError}
                aria-describedby={amountError ? 'amount-error' : undefined}
                className={cn(
                  'w-full min-w-0 border-0 bg-transparent px-3 font-mono text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal',
                  'focus:outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500',
                  amountError && 'text-red-600 dark:text-red-400'
                )}
              />
            </div>
            {amountError && (
              <p id="amount-error" className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                {amountError}
              </p>
            )}
          </div>

          {/* ── Amount in words integrated voucher panel ────────────────── */}
          {amountWords ? (
            <div
              aria-label="Amount in words"
              className="rounded-xl border border-[#007267]/20 bg-[#007267]/5 p-3.5 animate-fade-in space-y-2 dark:border-[#007267]/30 dark:bg-[#007267]/15"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#007267] dark:text-[#00c4b4]">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  Amount in Words
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  L1: {wordsLine1.length}/{words1Overflow.maxSafeChars}
                  {wordsLine2 && ` • L2: ${wordsLine2.length}/${words2Overflow?.maxSafeChars ?? 75}`}
                </span>
              </div>

              <div className="rounded-lg bg-white/90 p-2.5 border border-[#007267]/15 space-y-0.5 dark:bg-slate-900/90 dark:border-[#007267]/30">
                <p className="text-xs font-medium leading-relaxed text-slate-900 dark:text-slate-100 break-words font-serif">
                  "{wordsLine1}"
                </p>
                {wordsLine2 && (
                  <p className="text-xs font-medium leading-relaxed text-slate-900 dark:text-slate-100 break-words font-serif">
                    "{wordsLine2}"
                  </p>
                )}
              </div>

              {(words1Overflow.severity === 'overflow' || words2Overflow?.severity === 'overflow') && (
                <p className="flex items-center gap-1 text-xs text-rose-600 font-medium dark:text-rose-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Words exceed 2 lines capacity on cheque.
                </p>
              )}
            </div>
          ) : null}

          {/* ── Actions inside card ───────────────────────────────────── */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => guardAction(onPrintRequest)}
              disabled={!isValid || printing}
              aria-disabled={!isValid}
              className={cn(
                'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007267] focus-visible:ring-offset-2',
                isValid && !printing
                  ? 'bg-gradient-to-r from-[#007267] to-[#009688] text-white hover:from-[#005e55] hover:to-[#008275] shadow-md shadow-[#007267]/25 hover:shadow-lg hover:shadow-[#007267]/35 cursor-pointer active:scale-[0.99]'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
              )}
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              {printing ? 'Preparing…' : 'Print Cheque'}
            </button>
            <button
              type="button"
              onClick={() => guardAction(onTestPrint)}
              disabled={!isValid || printing}
              aria-disabled={!isValid}
              title="Print on plain paper to verify alignment"
              className={cn(
                'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007267]',
                isValid && !printing
                  ? 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750'
                  : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-600'
              )}
            >
              <TestTube2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
              Test Print
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
