import { useState, useCallback, useEffect } from 'react';
import { Header, NAV_TABS } from '@/components/Header';
import { ChequeEntryForm } from '@/components/ChequeEntryForm';
import { ChequePreview } from '@/components/ChequePreview';
import { LayoutConfigurator } from '@/components/LayoutConfigurator';
import { PrintSettings } from '@/components/PrintSettings';
import { CalibrationPage } from '@/components/CalibrationPage';
import { SettingsPage } from '@/components/SettingsPage';
import { useSettings } from '@/hooks/use-settings';
import { generatePrintHTML, mmToMicrons } from '@/lib/cheque-layout';
import { splitAmountWords } from '@/lib/amount-to-words';
import { cn } from '@/lib/utils';
import type { ChequeData } from '@/types/electron.d';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const STATUS_TIMEOUT_MS = 5000;

export default function App() {
  const [activeTab, setActiveTab] = useState('write');
  const [version, setVersion] = useState('1.0.0');
  const { settings, saveSettings } = useSettings();
  const [printStatus, setPrintStatus] = useState<{
    show: boolean;
    kind: 'idle' | 'pending' | 'success' | 'error';
    message: string;
  }>({ show: false, kind: 'idle', message: '' });
  const [chequeData, setChequeData] = useState<ChequeData>({
    payee: '',
    date: '',
    amount: '',
    amountWords: '',
  });

  useEffect(() => {
    async function loadVersion() {
      if (window.electronAPI) {
        try {
          const v = await window.electronAPI.getAppVersion();
          setVersion(v);
        } catch {
          // Use default
        }
      }
    }
    loadVersion();
  }, []);

  const handleDataChange = useCallback((data: ChequeData) => {
    setChequeData(data);
  }, []);

  const executePrint = useCallback(
    async (testMode: boolean) => {
      const [amountWords1, amountWords2] = splitAmountWords(chequeData.amountWords, 60);

      const html = generatePrintHTML(
        {
          payee: chequeData.payee,
          date: chequeData.date,
          amountWords1,
          amountWords2,
          amountFigures: chequeData.amount,
        },
        settings,
        testMode
      );

      // ── Web / PWA fallback (no Electron) ──────────────────────────
      if (!window.electronAPI) {
        setPrintStatus({ show: true, kind: 'pending', message: 'Preparing print dialog…' });
        try {
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.right = '0';
          iframe.style.bottom = '0';
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = '0';
          document.body.appendChild(iframe);

          const doc = iframe.contentWindow?.document || iframe.contentDocument;
          if (!doc) throw new Error('Cannot access print document');
          doc.open();
          doc.write(html);
          doc.close();

          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 1500);
          }, 300);

          setPrintStatus({
            show: true,
            kind: 'success',
            message: testMode
              ? 'Test print ready — browser print dialog opened.'
              : 'Cheque print ready — browser print dialog opened.',
          });
        } catch (err) {
          setPrintStatus({
            show: true,
            kind: 'error',
            message: `Print error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        window.setTimeout(
          () => setPrintStatus((s) => ({ ...s, show: false })),
          STATUS_TIMEOUT_MS
        );
        return;
      }

      if (!settings.selectedPrinter) {
        setPrintStatus({
          show: true,
          kind: 'error',
          message:
            'No printer selected. Go to the Printer tab to choose a printer before printing.',
        });
        return;
      }

      setPrintStatus({ show: true, kind: 'pending', message: 'Sending to printer…' });



      try {
        const result = await window.electronAPI.printCheque({
          html,
          printerName: settings.selectedPrinter,
          silent: !testMode, // Show dialog for test prints
          pageWidth: mmToMicrons(settings.chequeWidth),
          pageHeight: mmToMicrons(settings.chequeHeight),
          margins: {
            marginType: settings.marginType,
            ...(settings.marginType === 'custom' ? settings.customMargins : {}),
          },
          scaleFactor: settings.scaleFactor,
        });

        setPrintStatus(
          result.success
            ? {
                show: true,
                kind: 'success',
                message: testMode
                  ? 'Test print sent. Compare the output against a blank cheque and adjust layout if needed.'
                  : 'Cheque sent to printer successfully.',
              }
            : {
                show: true,
                kind: 'error',
                message: `Print failed: ${result.error ?? 'Unknown error'}`,
              }
        );
      } catch (err) {
        setPrintStatus({
          show: true,
          kind: 'error',
          message: `Print error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
      }

      // Auto-hide status (leave failures a little longer on screen)
      window.setTimeout(
        () => setPrintStatus((s) => ({ ...s, show: false })),
        printStatus.kind === 'error' ? 8000 : STATUS_TIMEOUT_MS
      );
    },
    [chequeData, settings, printStatus.kind]
  );

  const handlePrintRequest = useCallback(() => executePrint(false), [executePrint]);
  const handleTestPrint = useCallback(() => executePrint(true), [executePrint]);

  return (
    <>
      {/* Animated background */}
      <div className="gradient-bg" aria-hidden="true" />

      <Header version={version} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {/* Print status banner */}
        {printStatus.show && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              'mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm animate-fade-in',
              printStatus.kind === 'pending' && 'border-slate-200 bg-white text-slate-700',
              printStatus.kind === 'success' &&
                'border-emerald-200 bg-emerald-50 text-emerald-700',
              printStatus.kind === 'error' && 'border-red-200 bg-red-50 text-red-700'
            )}
          >
            {printStatus.kind === 'pending' && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-500" aria-hidden="true" />
            )}
            {printStatus.kind === 'success' && (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            {printStatus.kind === 'error' && (
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            {printStatus.message}
          </div>
        )}

        {NAV_TABS.map(({ value }) => (
          <div
            key={value}
            role="tabpanel"
            id={`panel-${value}`}
            aria-labelledby={`tab-${value}`}
            hidden={activeTab !== value}
          >
            {activeTab === value && (
              <div className="animate-fade-in">
                {value === 'write' && (
                  <div className="grid items-start gap-6 md:grid-cols-[minmax(320px,2fr)_minmax(0,3fr)]">
                    <ChequeEntryForm
                      onDataChange={handleDataChange}
                      onPrintRequest={handlePrintRequest}
                      onTestPrint={handleTestPrint}
                    />
                    <div className="md:sticky md:top-36">
                      <ChequePreview
                        data={chequeData}
                        settings={settings}
                        onCalibrate={() => setActiveTab('layout')}
                      />
                    </div>
                  </div>
                )}

                {value === 'printer' && (
                  <div className="max-w-2xl">
                    <PrintSettings settings={settings} onSave={saveSettings} />
                  </div>
                )}

                {value === 'layout' && (
                  <div className="grid items-start gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                      <CalibrationPage settings={settings} onSettingsChange={saveSettings} />
                      <LayoutConfigurator settings={settings} onSave={saveSettings} />
                    </div>
                    <div className="lg:sticky lg:top-36">
                      <ChequePreview data={chequeData} settings={settings} />
                    </div>
                  </div>
                )}

                {value === 'settings' && (
                  <div className="max-w-2xl">
                    <SettingsPage settings={settings} onSave={saveSettings} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-center text-xs text-slate-500">
            {settings.isCalibrated
              ? `NBO Check Writer v${version}`
              : `NBO Check Writer v${version} — Layout fields use placeholder coordinates. Calibrate against a genuine NBO cheque before production printing.`}
          </p>
        </div>
      </footer>
    </>
  );
}
