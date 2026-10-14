import { useMemo, useRef, useState, useEffect } from 'react';
import { Eye, AlertTriangle, Crosshair, Info } from 'lucide-react';
import { splitAmountWords } from '@/lib/amount-to-words';
import { checkChequeOverflow } from '@/lib/overflow-guard';
import type { ChequeData, AppSettings } from '@/types/electron.d';

interface ChequePreviewProps {
  data: ChequeData;
  settings: AppSettings;
  onCalibrate?: () => void;
}

export function ChequePreview({ data, settings, onCalibrate }: ChequePreviewProps) {
  const { fields, chequeWidth, chequeHeight, offsetX, offsetY, isCalibrated } = settings;

  // Pixels per mm for on-screen preview.
  const PX_PER_MM = 3.4;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const [amountWords1, amountWords2] = useMemo(
    () => splitAmountWords(data.amountWords || '', 60),
    [data.amountWords]
  );

  const overflowCheck = useMemo(
    () =>
      checkChequeOverflow(
        {
          payee: data.payee,
          date: data.date,
          amountFigures: data.amount,
          amountWords1,
          amountWords2,
        },
        settings
      ),
        [data, amountWords1, amountWords2, settings]
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

  // Responsive scale factor so the preview never clips or causes horizontal scroll
  const scale = useMemo(() => {
    if (!containerWidth || containerWidth <= 0) return 1;
    const available = containerWidth - 32; // subtracting padding
    if (available >= previewWidth) return 1;
    return Math.max(0.4, available / previewWidth);
  }, [containerWidth, previewWidth]);

  return (
    <section aria-labelledby="preview-heading" className="flex h-full flex-col animate-fade-in">
      {/* Panel header */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#007267]/10 text-[#007267] dark:bg-[#007267]/25 dark:text-[#00c4b4]">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <h2 id="preview-heading" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Print Preview
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {data.serialNumber && (
            <span className="rounded-md border border-[#007267]/30 bg-[#007267]/10 px-2 py-0.5 text-xs font-mono font-bold text-[#007267] dark:border-[#009688]/40 dark:bg-[#007267]/20 dark:text-[#00c4b4]">
              № {data.serialNumber}
            </span>
          )}
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-mono text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
            {chequeWidth}×{chequeHeight}mm
          </span>
        </div>
      </div>

      {/* Scalable preview surface that adapts to any screen width */}
      <div
        ref={containerRef}
        className="flex flex-1 items-center justify-center rounded-2xl border border-slate-200/90 bg-slate-100/80 p-4 shadow-inner transition-colors dark:border-slate-800 dark:bg-slate-950/80 overflow-hidden"
        style={{ minHeight: `${previewHeight * scale + 36}px` }}
      >
        <div
          style={{
            width: `${previewWidth}px`,
            height: `${previewHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className="cheque-preview shrink-0 shadow-lg shadow-black/15 transition-transform duration-150"
          role="img"
          aria-label={`Preview of cheque, ${chequeWidth} by ${chequeHeight} millimeters`}
        >
          {/* Bank header (decorative watermark) */}
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

          {/* Leaf Serial # indicator (if entered) */}
          {data.serialNumber && (
            <div
              style={{
                position: 'absolute',
                top: 4 * PX_PER_MM,
                right: 6 * PX_PER_MM,
                fontSize: Math.max(7, 7 * PX_PER_MM * 0.28),
                fontFamily: "'Courier New', monospace",
                color: '#007267',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
              aria-hidden="true"
            >
              № {data.serialNumber}
            </div>
          )}

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
            ⑈ {data.serialNumber ? data.serialNumber.padStart(6, '0') : '000000'} ⑈ 000000000 ⑈ 000000 ⑈
          </div>

          {/* Rendered fields */}
          {Object.entries(fieldValues).map(([key, value]) => {
            const config = fields[key];
            if (!config || !value) return null;

            const overflow = overflowCheck.fields[key];
            const isOverflow = overflow?.severity === 'overflow';
            const isWarning = overflow?.severity === 'warning';

            const x = (config.x + offsetX) * PX_PER_MM;
            const y = (config.y + offsetY) * PX_PER_MM;
            const fontSize = Math.max(8, config.fontSize * PX_PER_MM * 0.32);

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
                  color: isOverflow ? '#b91c1c' : '#1a1a1a',
                  outline: isOverflow ? '1.5px dashed #e11d48' : isWarning ? '1px dashed #d97706' : undefined,
                  background: isOverflow ? 'rgba(225, 29, 72, 0.08)' : isWarning ? 'rgba(217, 119, 6, 0.05)' : undefined,
                  borderRadius: isOverflow || isWarning ? '2px' : undefined,
                  padding: isOverflow || isWarning ? '0 1px' : undefined,
                }}
                title={`${key}: (${config.x}, ${config.y})mm${overflow?.message ? ` — ${overflow.message}` : ''}`}
              >
                {value}
              </div>
            );
          })}

          {/* Empty state prompt */}
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
              Enter payee and amount to preview print layout
            </div>
          )}
        </div>
      </div>

      {/* Status & actions alerts */}
      <div className="mt-2.5 space-y-2">
        {/* Text Overflow Alert */}
        {overflowCheck.hasOverflow && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 animate-fade-in dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <div className="flex-1">
              <span className="font-semibold">Text Overflow Detected:</span> Field exceeds cheque line capacity and may clip.
            </div>
          </div>
        )}

        {!isCalibrated && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-1.5 dark:border-amber-900/60 dark:bg-amber-950/40"
          >
            <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>Uncalibrated template. Use <strong>Test Print</strong> first.</span>
            </div>
            {onCalibrate && (
              <button
                type="button"
                onClick={onCalibrate}
                className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors cursor-pointer"
              >
                <Crosshair className="h-3 w-3" aria-hidden="true" />
                Calibrate
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Screen preview scales to fit. Physical prints use calibrated millimeter measurements.</span>
        </div>
      </div>
    </section>
  );
}
