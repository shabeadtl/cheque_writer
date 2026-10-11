import { useState, useMemo } from 'react';
import {
  User,
  Calendar,
  Banknote,
  FileText,
  Printer,
  TestTube2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { amountToWords, formatAmountDisplay, isValidAmount, splitAmountWords } from '@/lib/amount-to-words';
import { getTodayISO, formatChequeDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';
import type { ChequeData } from '@/types/electron.d';

interface ChequeEntryFormProps {
  onDataChange: (data: ChequeData) => void;
  onPrintRequest: () => void;
  onTestPrint: () => void;
}

type InputProblem = string | null;

export function ChequeEntryForm({
  onDataChange,
  onPrintRequest,
  onTestPrint,
}: ChequeEntryFormProps) {
  const [payee, setPayee] = useState('');
  const [date, setDate] = useState(getTodayISO());
  const [amount, setAmount] = useState('');
  const [touched, setTouched] = useState({ payee: false, date: false, amount: false });
  const [printing, setPrinting] = useState(false);

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

  const notify = (overrides: Partial<{ payee: string; date: string; amount: string }>) => {
    const p = overrides.payee ?? payee;
    const d = overrides.date ?? date;
    const a = overrides.amount ?? amount;
    const words = (a && isValidAmount(a) ? amountToWords(a) : null) ?? '';
    const formatted = (a && isValidAmount(a) ? formatAmountDisplay(a) : null) ?? '';
    onDataChange({
      payee: p.trim(),
      date: formatChequeDate(d),
      amount: formatted,
      amountWords: words,
    });
  };

  const handlePayee = (v: string) => { setPayee(v); notify({ payee: v }); };
  const handleDate = (v: string) => { setDate(v); notify({ date: v }); };
  const handleAmount = (v: string) => { setAmount(v); notify({ amount: v }); };

  const guardAction = (action: () => void) => {
    setTouched({ payee: true, date: true, amount: true });
    if (!isValid) return;
    setPrinting(true);
    // Keep Printing state at least one frame, released by caller via onDone
    Promise.resolve(action()).finally(() => setPrinting(false));
  };

  return (
    <div className="animate-fade-in">
      {/* ── Section: Cheque details ───────────────────────────────── */}
      <section aria-labelledby="cheque-details-heading">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#009688]" aria-hidden="true" />
          <h2 id="cheque-details-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Cheque Details
          </h2>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {/* Payee */}
          <div className="space-y-1.5">
            <label htmlFor="payee" className="block text-sm font-medium text-slate-700">
              Payee Name
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="payee"
                type="text"
                placeholder="Enter payee name"
                autoComplete="off"
                value={payee}
                onChange={(e) => handlePayee(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, payee: true }))}
                aria-invalid={!!payeeError}
                aria-describedby={payeeError ? 'payee-error' : undefined}
                className={cn(
                  'h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400',
                  'transition-colors focus:border-[#007267] focus:outline-none focus:ring-2 focus:ring-[#007267]/25',
                  payeeError && 'border-red-400 focus:border-red-500 focus:ring-red-500/25'
                )}
              />
            </div>
            {payeeError && (
              <p id="payee-error" className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                {payeeError}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label htmlFor="cheque-date" className="block text-sm font-medium text-slate-700">
              Cheque Date
            </label>
            <div className="relative">
              <Calendar
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="cheque-date"
                type="date"
                value={date}
                onChange={(e) => handleDate(e.target.value)}
                aria-describedby={date ? 'cheque-date-format' : undefined}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 transition-colors focus:border-[#007267] focus:outline-none focus:ring-2 focus:ring-[#007267]/25"
              />
            </div>
            {date && (
              <p id="cheque-date-format" className="text-xs text-slate-500">
                Prints as: <span className="font-mono text-slate-700">{formatChequeDate(date)}</span>
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
              Amount (OMR)
            </label>
            <div className="flex h-10 items-stretch overflow-hidden rounded-lg border border-slate-300 bg-white transition-colors focus-within:border-[#007267] focus-within:ring-2 focus-within:ring-[#007267]/25">
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
                aria-describedby={amountError ? 'amount-error' : 'amount-format-help'}
                className={cn(
                  'w-full min-w-0 border-0 bg-transparent px-3 font-mono text-sm text-slate-900 placeholder:text-slate-400',
                  'focus:outline-none focus:ring-0',
                  amountError && 'text-red-600'
                )}
              />
              <span
                className="flex shrink-0 select-none items-center gap-1 border-l border-slate-200 bg-slate-50 px-3 font-mono text-sm font-semibold text-slate-600"
                aria-hidden="true"
              >
                <Banknote className="h-4 w-4 text-[#009688]" aria-hidden="true" />
                OMR
              </span>
            </div>
            <p id="amount-format-help" className="text-xs text-slate-500">
              Enter amounts in Omani Rials with up to 3 decimal places (Baisa), e.g. <span className="font-mono">1250.500</span>
            </p>
            {amountError && (
              <p id="amount-error" className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                {amountError}
              </p>
            )}
            {formattedAmount && !amountError && (
              <p className="text-xs text-slate-500">
                Formatted: <span className="font-mono font-medium text-slate-800">{formattedAmount}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Amount in words panel ─────────────────────────────────── */}
      {amountWords ? (
        <section
          aria-label="Amount in words"
          className="mt-4 rounded-xl border border-[#007267]/25 bg-[#007267]/5 p-4 animate-fade-in"
        >
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#007267]">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Amount in Words
          </p>
          <p className="text-sm font-medium leading-snug text-slate-900">{wordsLine1}</p>
          {wordsLine2 && <p className="text-sm font-medium leading-snug text-slate-900">{wordsLine2}</p>}
        </section>
      ) : null}

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => guardAction(onPrintRequest)}
          disabled={!isValid || printing}
          aria-disabled={!isValid}
          className={cn(
            'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007267] focus-visible:ring-offset-2',
            isValid && !printing
              ? 'bg-[#007267] text-white hover:bg-[#009688] active:bg-[#004d40] enabled:cursor-pointer'
              : 'cursor-not-allowed bg-slate-300 text-slate-500'
          )}
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          {printing ? 'Printing…' : 'Print Cheque'}
        </button>
        <button
          type="button"
          onClick={() => guardAction(onTestPrint)}
          disabled={!isValid || printing}
          aria-disabled={!isValid}
          title="Print on plain paper to verify alignment"
          className={cn(
            'inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007267] focus-visible:ring-offset-2',
            isValid && !printing
              ? 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 cursor-pointer'
              : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
          )}
        >
          <TestTube2 className="h-4 w-4" aria-hidden="true" />
          Test Print
        </button>
      </div>
    </div>
  );
}
