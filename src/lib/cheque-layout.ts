/**
 * Cheque layout types and default configuration.
 *
 * WARNING: All field positions and cheque dimensions are PLACEHOLDERS.
 * You MUST calibrate these values against a genuine blank NBO cheque
 * and your target printer before using in production.
 */

import type { FieldConfig, AppSettings } from '@/types/electron.d';

export const FIELD_LABELS: Record<string, string> = {
  date: 'Date',
  payee: 'Pay / Payee Name',
  amountWords1: 'Amount in Words (Line 1)',
  amountWords2: 'Amount in Words (Line 2)',
  amountFigures: 'Amount in Figures',
};

export const DEFAULT_FIELD_CONFIG: Record<string, FieldConfig> = {
  date: {
    x: 150,
    y: 12,
    fontSize: 11,
    fontFamily: 'Arial',
    alignment: 'left',
    maxWidth: 40,
    bold: false,
  },
  payee: {
    x: 25,
    y: 28,
    fontSize: 11,
    fontFamily: 'Arial',
    alignment: 'left',
    maxWidth: 140,
    bold: false,
  },
  amountWords1: {
    x: 10,
    y: 40,
    fontSize: 10,
    fontFamily: 'Arial',
    alignment: 'left',
    maxWidth: 160,
    bold: false,
  },
  amountWords2: {
    x: 10,
    y: 48,
    fontSize: 10,
    fontFamily: 'Arial',
    alignment: 'left',
    maxWidth: 160,
    bold: false,
  },
  amountFigures: {
    x: 165,
    y: 28,
    fontSize: 12,
    fontFamily: 'Arial',
    alignment: 'right',
    maxWidth: 30,
    bold: true,
  },
};

export const DEFAULT_SETTINGS: AppSettings = {
  selectedPrinter: '',
  scaleFactor: 100,
  marginType: 'none',
  customMargins: { top: 0, bottom: 0, left: 0, right: 0 },
  chequeWidth: 200,
  chequeHeight: 90,
  fields: { ...DEFAULT_FIELD_CONFIG },
  offsetX: 0,
  offsetY: 0,
  isCalibrated: false,
};

/**
 * Convert millimeters to CSS pixels (for screen preview).
 * 1mm ≈ 3.7795px at 96 DPI.
 */
export function mmToPx(mm: number): number {
  return mm * 3.7795;
}

/**
 * Convert millimeters to microns (for Electron print API).
 * 1mm = 1000 microns.
 */
export function mmToMicrons(mm: number): number {
  return mm * 1000;
}

/**
 * Generate print-ready HTML for a cheque.
 */
export function generatePrintHTML(
  chequeData: {
    payee: string;
    date: string;
    amountWords1: string;
    amountWords2: string;
    amountFigures: string;
  },
  settings: AppSettings,
  testMode: boolean = false
): string {
  const { fields, offsetX, offsetY, chequeWidth, chequeHeight } = settings;

  const fieldEntries = [
    { key: 'date', value: chequeData.date },
    { key: 'payee', value: chequeData.payee },
    { key: 'amountWords1', value: chequeData.amountWords1 },
    { key: 'amountWords2', value: chequeData.amountWords2 },
    { key: 'amountFigures', value: chequeData.amountFigures },
  ];

  const fieldElements = fieldEntries
    .filter((f) => f.value)
    .map((f) => {
      const config = fields[f.key];
      if (!config) return '';

      const x = config.x + offsetX;
      const y = config.y + offsetY;

      return `
        <div style="
          position: absolute;
          left: ${x}mm;
          top: ${y}mm;
          font-size: ${config.fontSize}pt;
          font-family: ${config.fontFamily}, sans-serif;
          text-align: ${config.alignment};
          max-width: ${config.maxWidth}mm;
          font-weight: ${config.bold ? 'bold' : 'normal'};
          white-space: nowrap;
          overflow: hidden;
          ${config.alignment === 'right' ? `width: ${config.maxWidth}mm;` : ''}
        ">${escapeHtml(f.value)}</div>
      `;
    })
    .join('');

  // Test mode: add visual guides
  const testOverlay = testMode
    ? `
      <div style="
        position: absolute; inset: 0;
        border: 1px dashed #999;
        pointer-events: none;
      ">
        <div style="position: absolute; top: 2mm; left: 2mm; font-size: 7pt; color: #999;">
          TEST PRINT — ${chequeWidth}mm × ${chequeHeight}mm — Offset: (${offsetX}, ${offsetY})
        </div>
        ${fieldEntries
          .map((f) => {
            const config = fields[f.key];
            if (!config) return '';
            const x = config.x + offsetX;
            const y = config.y + offsetY;
            return `<div style="
              position: absolute;
              left: ${x}mm;
              top: ${y - 3}mm;
              font-size: 6pt;
              color: #cc0000;
            ">${f.key} (${config.x},${config.y})</div>`;
          })
          .join('')}
      </div>
    `
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: ${chequeWidth}mm ${chequeHeight}mm;
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${chequeWidth}mm;
      height: ${chequeHeight}mm;
      position: relative;
      overflow: hidden;
    }
  </style>
</head>
<body>
  ${fieldElements}
  ${testOverlay}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
