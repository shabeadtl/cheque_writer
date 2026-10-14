import { useEffect } from 'react';
import {
  AlertTriangle,
  Printer,
  ShieldCheck,
  TestTube2,
  X,
  Calendar,
  User,
  Banknote,
  Hash,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppSettings, ChequeData } from '@/types/electron.d';
import { checkChequeOverflow, type ChequeOverflowCheck } from '@/lib/overflow-guard';
import { splitAmountWords } from '@/lib/amount-to-words';

interface PrintConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPrint: () => Promise<void> | void;
  onTestPrint: () => void;
  chequeData: ChequeData;
  settings: AppSettings;
  isPrinting?: boolean;
}

export function PrintConfirmationModal({
  isOpen,
  onClose,
  onConfirmPrint,
  onTestPrint,
  chequeData,
  settings,
  isPrinting = false,
}: PrintConfirmationModalProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPrinting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPrinting, onClose]);

  if (!isOpen) return null;

  const [amountWords1, amountWords2] = splitAmountWords(chequeData.amountWords, 60);

  const overflowCheck: ChequeOverflowCheck = checkChequeOverflow(
    {
      payee: chequeData.payee,
      date: chequeData.date,
      amountFigures: chequeData.amount,
      amountWords1,
      amountWords2,
    },
    settings
  );

  const hasSerial = Boolean(chequeData.serialNumber?.trim());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] transition-colors dark:bg-slate-900 dark:border-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/75">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#007267] text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="confirm-modal-title" className="text-base font-semibold text-slate-900 dark:text-white">
                Cheque Print Safeguard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review cheque details before releasing to the printer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPrinting}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Overflow warning banner if detected */}
          {overflowCheck.hasOverflow && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-900 space-y-2 animate-fade-in dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
            >
              <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                High Risk: Text Overflow Detected!
              </div>
              <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">
                One or more fields exceed the physical boundaries of the cheque lines. Text may clip or overprint bank security lines:
              </p>
              <ul className="list-disc list-inside text-xs space-y-1 text-rose-800 dark:text-rose-300 pl-1">
                {Object.values(overflowCheck.fields)
                  .filter((f) => f.severity === 'overflow')
                  .map((f) => (
                    <li key={f.fieldName}>
                      <span className="font-semibold">{f.fieldLabel}:</span> {f.message}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {overflowCheck.hasWarning && !overflowCheck.hasOverflow && (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900 flex items-start gap-2.5 animate-fade-in dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5 dark:text-amber-400" aria-hidden="true" />
              <div>
                <span className="font-semibold text-amber-900 dark:text-amber-200">Line Limit Warning:</span> Text is close to the maximum supported width. Please verify preview alignment before printing.
              </div>
            </div>
          )}

          {/* Cheque Summary Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Cheque Summary
              </span>
              {hasSerial ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#007267]/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-[#007267] dark:bg-[#007267]/25 dark:text-[#00c4b4]">
                  <Hash className="h-3 w-3" /> Leaf #{chequeData.serialNumber}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">No serial number entered</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {/* Payee */}
              <div className="col-span-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <User className="h-3.5 w-3.5 text-[#007267] dark:text-[#00c4b4]" /> Payee / Beneficiary
                </span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-base break-words mt-0.5">
                  {chequeData.payee || '—'}
                </p>
              </div>

              {/* Amount figures */}
              <div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Banknote className="h-3.5 w-3.5 text-[#007267] dark:text-[#00c4b4]" /> Amount in Figures
                </span>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-base mt-0.5">
                  OMR {chequeData.amount || '0.000'}
                </p>
              </div>

              {/* Cheque Date */}
              <div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Calendar className="h-3.5 w-3.5 text-[#007267] dark:text-[#00c4b4]" /> Cheque Date
                </span>
                <p className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {chequeData.date || '—'}
                </p>
              </div>

              {/* Amount in Words */}
              <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Amount in Words</span>
                <div className="mt-1 rounded-lg bg-white border border-slate-200 p-2.5 dark:bg-slate-900 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">{amountWords1}</p>
                  {amountWords2 && (
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug mt-0.5">
                      {amountWords2}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hardware / Environment check */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs space-y-1.5 dark:border-slate-800 dark:bg-slate-850">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Printer className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> Target Printer:
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                {settings.selectedPrinter || 'Default System Printer'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Cheque Dimensions:</span>
              <span className="font-mono font-medium">{settings.chequeWidth} × {settings.chequeHeight} mm</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Layout Calibration:</span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-medium rounded-full px-2 py-0.5 text-[10px]',
                  settings.isCalibrated
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                )}
              >
                {settings.isCalibrated ? 'Verified Calibrated' : 'Uncalibrated (Verify Feed)'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => {
              onClose();
              onTestPrint();
            }}
            disabled={isPrinting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Print on plain paper to verify alignment"
          >
            <TestTube2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            Test on Plain Paper First
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPrinting}
              className="rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                await onConfirmPrint();
                onClose();
              }}
              disabled={isPrinting}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold shadow-md transition-all',
                isPrinting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                  : 'bg-[#007267] text-white hover:bg-[#009688] active:bg-[#004d40] cursor-pointer'
              )}
            >
              {isPrinting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending to Printer…
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  Confirm & Print Cheque
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
