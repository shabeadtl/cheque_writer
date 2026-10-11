import { useMemo } from 'react';
import { Eye, AlertTriangle, Crosshair, Info } from 'lucide-react';
import { splitAmountWords } from '@/lib/amount-to-words';
import type { ChequeData, AppSettings } from '@/types/electron.d';

interface ChequePreviewProps {
  data: ChequeData;
  settings: AppSettings;
  onCalibrate?: () => void;
}

export function ChequePreview({ data, settings, onCalibrate }: ChequePreviewProps) {
  const { fields, chequeWidth, chequeHeight, offsetX, offsetY, isCalibrated } = settings;

  // Pixels per mm for on-screen preview. Physical print uses generatePrintHTML
  // with real mm units — this scale only affects the preview, never the print.
  const PX_PER_MM = 3.4;

  const [amountWords1, amountWords2] = useMemo(
    () => splitAmountWords(data.amountWords || '', 60),
    [data.amountWords]
  );

  const fieldValues: Record<string, string> = {
    date: data.date,
    payee: data.payee,
    amountWords1,
    amountWords2,
    amountFigures: data.amount,
  };

  const previewWidth = chequeWidth * PX_PER_MM;
  const previewHeight = chequeHeight * PX_PER_MM;

  return (
    <section aria-labelledby="preview-heading" className="flex h-full flex-col animate-fade-in">
      {/* Panel header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-[#009688]" aria-hidden="true" />
          <h2 id="preview-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Print Preview
          </h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {chequeWidth} × {chequeHeight} mm
        </span>
      </div>

      {/* Contrasting preview surface */}
      <div className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 p-6 shadow-inner">
        <div
          className="cheque-preview"
          style={{ width: previewWidth, height: previewHeight }}
          role="img"
          aria-label={`Preview of cheque, ${chequeWidth} by ${chequeHeight} millimeters`}
        >
          {/* NBO header (decorative only) */}
          <div
            style={{
              position: 'absolute',
              top: 4 * PX_PER_MM,
              left: 6 * PX_PER_MM,
              fontSize: Math.max(7, 7 * PX_PER_MM * 0.28),
              fontFamily: 'Arial, sans-serif',
              color: '#0f5a3a',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
            aria-hidden="true"
          >
            NATIONAL BANK OF OMAN
          </div>

          {/* MICR line placeholder (decorative only) */}
          <div
            style={{
              position: 'absolute',
              bottom: 3 * PX_PER_MM,
              left: 8 * PX_PER_MM,
              fontSize: Math.max(6, 6 * PX_PER_MM * 0.28),
              fontFamily: "'Courier New', monospace",
              color: '#999',
              letterSpacing: '0.15em',
            }}
            aria-hidden="true"
          >
            ⑈ 000000 ⑈ 000000000 ⑈ 000000 ⑈
          </div>

          {/* Rendered fields */}
          {Object.entries(fieldValues).map(([key, value]) => {
            const config = fields[key];
            if (!config || !value) return null;

            const x = (config.x + offsetX) * PX_PER_MM;
            const y = (config.y + offsetY) * PX_PER_MM;
            const fontSize = Math.max(8, config.fontSize * PX_PER_MM * 0.32); // approximate pt→px

            return (
              <div
                key={key}
                className="cheque-field"
                style={{
                  left: x,
                  top: y,
                  fontSize,
                  fontFamily: `${config.fontFamily}, sans-serif`,
                  textAlign: config.alignment,
                  maxWidth: config.maxWidth * PX_PER_MM,
                  fontWeight: config.bold ? 'bold' : 'normal',
                  width: config.alignment === 'right' ? config.maxWidth * PX_PER_MM : undefined,
                  color: '#1a1a1a',
                }}
                title={`${key}: (${config.x}, ${config.y})mm`}
              >
                {value}
              </div>
            );
          })}

          {/* Empty state */}
          {!data.payee && !data.amount && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: 12,
                fontStyle: 'italic',
                fontFamily: 'Arial, sans-serif',
                textAlign: 'center',
                padding: '0 24px',
              }}
            >
              Enter cheque details to see preview
            </div>
          )}
        </div>
      </div>

      {/* Status & actions */}
      <div className="mt-3 space-y-2">
        {!isCalibrated && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
          >
            <p className="flex items-start gap-1.5 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                <strong>Layout Not Calibrated.</strong>{' '}
                <span className="text-amber-700">
                  Physical alignment must be verified against a genuine NBO cheque before printing.
                </span>
              </span>
            </p>
            {onCalibrate && (
              <button
                type="button"
                onClick={onCalibrate}
                className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007267]"
              >
                <Crosshair className="h-3 w-3" aria-hidden="true" />
                Adjust Alignment
              </button>
            )}
          </div>
        )}

        <div className="flex items-start gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <p>
            Preview is illustrative. Use <strong>Test Print</strong> on plain paper and follow the{' '}
            <strong>Layout &amp; Calibration</strong> tab to verify physical alignment on your target printer.
          </p>
        </div>
      </div>
    </section>
  );
}
