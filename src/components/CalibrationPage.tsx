import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AppSettings } from '@/types/electron.d';
import { mmToMicrons } from '@/lib/cheque-layout';
import { Crosshair, Grid3x3, CheckCircle, AlertTriangle } from 'lucide-react';

interface CalibrationPageProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function CalibrationPage({ settings, onSettingsChange: _onSettingsChange }: CalibrationPageProps) {
  const [printing, setPrinting] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  // Generate calibration grid HTML
  const generateCalibrationGridHTML = (): string => {
    const { chequeWidth, chequeHeight } = settings;
    const gridSpacing = 10; // 10mm grid

    let gridLines = '';
    // Vertical lines
    for (let x = 0; x <= chequeWidth; x += gridSpacing) {
      gridLines += `
        <line x1="${x}mm" y1="0" x2="${x}mm" y2="${chequeHeight}mm"
          stroke="${x % 50 === 0 ? '#333' : '#ccc'}" stroke-width="${x % 50 === 0 ? 0.5 : 0.2}" />
        <text x="${x}mm" y="3mm" font-size="5pt" fill="#666" text-anchor="middle">${x}</text>
      `;
    }
    // Horizontal lines
    for (let y = 0; y <= chequeHeight; y += gridSpacing) {
      gridLines += `
        <line x1="0" y1="${y}mm" x2="${chequeWidth}mm" y2="${y}mm"
          stroke="${y % 50 === 0 ? '#333' : '#ccc'}" stroke-width="${y % 50 === 0 ? 0.5 : 0.2}" />
        <text x="2mm" y="${y + 1}mm" font-size="5pt" fill="#666">${y}</text>
      `;
    }

    // Corner markers (for alignment verification)
    const cornerSize = 5;
    const corners = `
      <rect x="0" y="0" width="${cornerSize}mm" height="${cornerSize}mm" fill="none" stroke="red" stroke-width="0.5" />
      <rect x="${chequeWidth - cornerSize}mm" y="0" width="${cornerSize}mm" height="${cornerSize}mm" fill="none" stroke="red" stroke-width="0.5" />
      <rect x="0" y="${chequeHeight - cornerSize}mm" width="${cornerSize}mm" height="${cornerSize}mm" fill="none" stroke="red" stroke-width="0.5" />
      <rect x="${chequeWidth - cornerSize}mm" y="${chequeHeight - cornerSize}mm" width="${cornerSize}mm" height="${cornerSize}mm" fill="none" stroke="red" stroke-width="0.5" />
    `;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: ${chequeWidth}mm ${chequeHeight}mm; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${chequeWidth}mm;
      height: ${chequeHeight}mm;
      position: relative;
    }
    svg { width: ${chequeWidth}mm; height: ${chequeHeight}mm; }
  </style>
</head>
<body>
  <svg viewBox="0 0 ${chequeWidth}mm ${chequeHeight}mm" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}
    ${corners}
    <text x="${chequeWidth / 2}mm" y="${chequeHeight / 2}mm" font-size="8pt" fill="#999" text-anchor="middle" dominant-baseline="middle">
      NBO Check Writer — Calibration Grid — ${chequeWidth}mm × ${chequeHeight}mm
    </text>
  </svg>
</body>
</html>`;
  };

  // Generate ruler HTML
  const generateRulerHTML = (): string => {
    const { chequeWidth, chequeHeight } = settings;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: ${chequeWidth}mm ${chequeHeight}mm; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${chequeWidth}mm;
      height: ${chequeHeight}mm;
      position: relative;
      font-family: Arial, sans-serif;
    }
    .ruler-h {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 10mm;
      border-bottom: 1px solid #333;
    }
    .ruler-v {
      position: absolute;
      top: 0;
      left: 0;
      width: 10mm;
      height: 100%;
      border-right: 1px solid #333;
    }
    .tick-h {
      position: absolute;
      top: 0;
      border-left: 1px solid #666;
      height: 5mm;
    }
    .tick-h.major {
      height: 8mm;
      border-left: 1px solid #333;
    }
    .tick-label-h {
      position: absolute;
      top: 5mm;
      font-size: 5pt;
      color: #333;
      transform: translateX(-50%);
    }
    .tick-v {
      position: absolute;
      left: 0;
      border-top: 1px solid #666;
      width: 5mm;
    }
    .tick-v.major {
      width: 8mm;
      border-top: 1px solid #333;
    }
    .tick-label-v {
      position: absolute;
      left: 5mm;
      font-size: 5pt;
      color: #333;
      transform: translateY(-50%);
    }
    .info {
      position: absolute;
      bottom: 5mm;
      right: 5mm;
      font-size: 6pt;
      color: #999;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="ruler-h">
    ${Array.from({ length: Math.floor(chequeWidth / 5) + 1 }, (_, i) => {
      const pos = i * 5;
      const isMajor = pos % 10 === 0;
      return `
        <div class="tick-h ${isMajor ? 'major' : ''}" style="left: ${pos}mm;"></div>
        ${isMajor ? `<div class="tick-label-h" style="left: ${pos}mm;">${pos}</div>` : ''}
      `;
    }).join('')}
  </div>
  <div class="ruler-v">
    ${Array.from({ length: Math.floor(chequeHeight / 5) + 1 }, (_, i) => {
      const pos = i * 5;
      const isMajor = pos % 10 === 0;
      return `
        <div class="tick-v ${isMajor ? 'major' : ''}" style="top: ${pos}mm;"></div>
        ${isMajor ? `<div class="tick-label-v" style="top: ${pos}mm;">${pos}</div>` : ''}
      `;
    }).join('')}
  </div>
  <div class="info">
    NBO Check Writer<br/>
    Ruler Calibration<br/>
    ${chequeWidth}mm × ${chequeHeight}mm<br/>
    Print at 100% scale — No page scaling
  </div>
</body>
</html>`;
  };

  const handlePrint = async (html: string, label: string) => {
    setPrinting(true);
    setLastResult(null);

    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.printCheque({
          html,
          printerName: settings.selectedPrinter,
          silent: false, // Show print dialog for calibration
          pageWidth: mmToMicrons(settings.chequeWidth),
          pageHeight: mmToMicrons(settings.chequeHeight),
          margins: { marginType: 'none' },
          scaleFactor: settings.scaleFactor,
        });

        setLastResult({
          success: result.success,
          message: result.success
            ? `${label} sent to printer successfully.`
            : `Print failed: ${result.error}`,
        });
      } catch (err) {
        setLastResult({
          success: false,
          message: `Print error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
      } finally {
        setPrinting(false);
      }
    } else {
      // Browser / PWA print via hidden iframe
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
          setLastResult({
            success: true,
            message: `${label} ready — printer dialog opened.`,
          });
          setPrinting(false);
        }, 300);
      } catch (err) {
        setLastResult({
          success: false,
          message: `Print error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
        setPrinting(false);
      }
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-[#d4af37]" />
          <CardTitle>Calibration & Test Print</CardTitle>
        </div>
        <CardDescription>
          Print calibration patterns to align your cheque layout with the physical cheque stock.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Instructions */}
        <div className="rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-4">
          <h4 className="mb-2 text-sm font-semibold text-[#d4af37]">
            Calibration Instructions
          </h4>
          <ol className="space-y-1 text-xs text-slate-600 list-decimal list-inside">
            <li>Print the calibration grid on plain paper</li>
            <li>Measure the grid with a ruler to verify 10mm spacing</li>
            <li>If spacing is off, adjust the Scale Factor in Print Settings</li>
            <li>Place the print over a blank NBO cheque on a light table</li>
            <li>Note where fields (date, payee, amount) should appear</li>
            <li>Enter those coordinates in Layout Configuration</li>
            <li>Print a test cheque on plain paper and verify alignment</li>
            <li>Fine-tune using the Calibration Offsets if needed</li>
          </ol>
        </div>

        {/* Calibration Actions */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            onClick={() => handlePrint(generateCalibrationGridHTML(), 'Calibration grid')}
            disabled={printing}
            className="h-auto py-4 flex-col gap-2"
          >
            <Grid3x3 className="h-6 w-6 text-[#009688]" />
            <div className="text-center">
              <div className="font-semibold">Print Grid</div>
              <div className="text-xs text-slate-500">
                10mm calibration grid with corner markers
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => handlePrint(generateRulerHTML(), 'Ruler')}
            disabled={printing}
            className="h-auto py-4 flex-col gap-2"
          >
            <Crosshair className="h-6 w-6 text-[#d4af37]" />
            <div className="text-center">
              <div className="font-semibold">Print Ruler</div>
              <div className="text-xs text-slate-500">
                Edge rulers with mm markings
              </div>
            </div>
          </Button>
        </div>

        {/* Current settings summary */}
        <div className="rounded-lg border border-slate-300 p-4">
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            Current Settings
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>
              <span className="text-slate-500">Printer:</span>{' '}
              {settings.selectedPrinter || 'Not selected'}
            </div>
            <div>
              <span className="text-slate-500">Scale:</span>{' '}
              {settings.scaleFactor}%
            </div>
            <div>
              <span className="text-slate-500">Size:</span>{' '}
              {settings.chequeWidth}×{settings.chequeHeight}mm
            </div>
            <div>
              <span className="text-slate-500">Offset:</span>{' '}
              ({settings.offsetX}, {settings.offsetY})mm
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-300 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-900">
              Status: {settings.isCalibrated ? (
                <span className="text-emerald-600">Calibrated</span>
              ) : (
                <span className="text-amber-600">Not Calibrated</span>
              )}
            </span>
            <Button
              variant={settings.isCalibrated ? "outline" : "default"}
              size="sm"
              onClick={() => _onSettingsChange({ ...settings, isCalibrated: !settings.isCalibrated })}
            >
              {settings.isCalibrated ? "Reset Calibration Status" : "Mark as Calibrated"}
            </Button>
          </div>
        </div>

        {/* Print result */}
        {lastResult && (
          <div
            className={`flex items-center gap-2 rounded-lg p-3 text-sm animate-fade-in ${
              lastResult.success
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-red-500/10 text-red-600'
            }`}
          >
            {lastResult.success ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            {lastResult.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
