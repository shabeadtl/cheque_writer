/**
 * Text Overflow Length Safeguard for NBO Cheque Printing.
 *
 * Prevents ruined cheque leaves by calculating whether entered field text
 * fits safely within the physical width of the pre-printed cheque lines.
 */

import type { AppSettings, FieldConfig } from '@/types/electron.d';

export type OverflowSeverity = 'ok' | 'warning' | 'overflow';

export interface FieldOverflowResult {
  fieldName: string;
  fieldLabel: string;
  text: string;
  charCount: number;
  maxSafeChars: number;
  estimatedWidthMm: number;
  maxWidthMm: number;
  severity: OverflowSeverity;
  message?: string;
}

export interface ChequeOverflowCheck {
  hasWarning: boolean;
  hasOverflow: boolean;
  fields: Record<string, FieldOverflowResult>;
  summaryMessage?: string;
}

/**
 * Average character width in millimeters relative to font size in points.
 * Standard Arial: 1pt font height ≈ 0.3528mm.
 * Average character width is ~0.5 to 0.55 of font point size in mm.
 * E.g., at 11pt Arial, average character width is ~1.95mm - 2.1mm.
 * Bold characters are ~15% wider.
 */
function getCharWidthFactor(fontFamily: string, isBold: boolean): number {
  let baseFactor = 0.185; // mm per point size per average character
  if (fontFamily.toLowerCase().includes('courier') || fontFamily.toLowerCase().includes('mono')) {
    baseFactor = 0.21;
  }
  return isBold ? baseFactor * 1.15 : baseFactor;
}

/**
 * Estimates physical width of a text string in millimeters.
 */
export function estimateTextWidthMm(
  text: string,
  fontSizePt: number,
  fontFamily: string = 'Arial',
  isBold: boolean = false
): number {
  if (!text) return 0;
  const factor = getCharWidthFactor(fontFamily, isBold);
  // Account for wide uppercase vs narrow lowercase
  let weightedLength = 0;
  for (const char of text) {
    if (/[WwMm@]/.test(char)) {
      weightedLength += 1.4;
    } else if (/[Iijl1.,'!]/.test(char)) {
      weightedLength += 0.5;
    } else if (/[A-Z]/.test(char)) {
      weightedLength += 1.15;
    } else {
      weightedLength += 1.0;
    }
  }
  return Math.round(weightedLength * fontSizePt * factor * 10) / 10;
}

/**
 * Calculates the maximum safe character count for a given field configuration.
 */
export function getMaxSafeChars(field: FieldConfig): number {
  const factor = getCharWidthFactor(field.fontFamily, field.bold);
  const avgCharWidthMm = field.fontSize * factor;
  if (avgCharWidthMm <= 0) return 100;
  return Math.floor(field.maxWidth / avgCharWidthMm);
}

/**
 * Checks a single field for potential text overflow.
 */
export function checkFieldOverflow(
  fieldName: string,
  fieldLabel: string,
  text: string,
  fieldConfig: FieldConfig
): FieldOverflowResult {
  const trimmed = text.trim();
  const charCount = trimmed.length;
  const maxSafeChars = getMaxSafeChars(fieldConfig);
  const estimatedWidthMm = estimateTextWidthMm(
    trimmed,
    fieldConfig.fontSize,
    fieldConfig.fontFamily,
    fieldConfig.bold
  );
  const maxWidthMm = fieldConfig.maxWidth;

  let severity: OverflowSeverity = 'ok';
  let message: string | undefined;

  // Overflow occurs if estimated width exceeds physical maxWidth or character count exceeds limit
  if (estimatedWidthMm > maxWidthMm || charCount > maxSafeChars) {
    severity = 'overflow';
    message = `Exceeds safe line width by approx. ${Math.max(
      1,
      Math.round(estimatedWidthMm - maxWidthMm)
    )}mm (${charCount}/${maxSafeChars} chars). Text will be clipped or print into neighboring boxes on the cheque.`;
  } else if (estimatedWidthMm > maxWidthMm * 0.85 || charCount > maxSafeChars * 0.85) {
    severity = 'warning';
    message = `Approaching line limit (${charCount}/${maxSafeChars} chars, ~${estimatedWidthMm}/${maxWidthMm}mm).`;
  }

  return {
    fieldName,
    fieldLabel,
    text: trimmed,
    charCount,
    maxSafeChars,
    estimatedWidthMm,
    maxWidthMm,
    severity,
    message,
  };
}

/**
 * Checks all fields of an entered cheque against the active layout configuration.
 */
export function checkChequeOverflow(
  data: {
    payee: string;
    date: string;
    amountFigures: string;
    amountWords1: string;
    amountWords2: string;
  },
  settings: AppSettings
): ChequeOverflowCheck {
  const results: Record<string, FieldOverflowResult> = {};

  const fieldsToCheck: Array<{
    key: string;
    label: string;
    text: string;
  }> = [
    { key: 'payee', label: 'Payee Name', text: data.payee },
    { key: 'amountWords1', label: 'Amount in Words (Line 1)', text: data.amountWords1 },
    { key: 'amountWords2', label: 'Amount in Words (Line 2)', text: data.amountWords2 },
    { key: 'amountFigures', label: 'Amount in Figures', text: data.amountFigures },
    { key: 'date', label: 'Cheque Date', text: data.date },
  ];

  let hasWarning = false;
  let hasOverflow = false;

  for (const item of fieldsToCheck) {
    const config = settings.fields[item.key];
    if (config && item.text) {
      const res = checkFieldOverflow(item.key, item.label, item.text, config);
      results[item.key] = res;
      if (res.severity === 'overflow') hasOverflow = true;
      if (res.severity === 'warning') hasWarning = true;
    }
  }

  let summaryMessage: string | undefined;
  if (hasOverflow) {
    summaryMessage =
      'One or more fields exceed the physical boundaries of the cheque lines. Adjust text or layout before printing to avoid wasting cheque leaves.';
  } else if (hasWarning) {
    summaryMessage =
      'Some fields are close to the maximum line width. Verify the preview carefully before printing.';
  }

  return {
    hasWarning,
    hasOverflow,
    fields: results,
    summaryMessage,
  };
}
