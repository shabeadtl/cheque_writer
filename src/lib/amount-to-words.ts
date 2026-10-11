/**
 * Convert an amount in Omani Rial (OMR) to words.
 *
 * OMR uses 3 decimal places: 1 Rial = 1000 Baisa.
 * Examples:
 *   1.500  → "One Rial and Five Hundred Baisa Only"
 *   0.250  → "Two Hundred Fifty Baisa Only"
 *   100    → "One Hundred Rials Only"
 *   1234.567 → "One Thousand Two Hundred Thirty Four Rials and Five Hundred Sixty Seven Baisa Only"
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five',
  'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
  'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

const SCALES = [
  '', 'Thousand', 'Million', 'Billion', 'Trillion',
];

/**
 * Convert a number (0-999) to words.
 */
function threeDigitsToWords(n: number): string {
  if (n === 0) return '';

  const parts: string[] = [];

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  if (hundreds > 0) {
    parts.push(`${ONES[hundreds]} Hundred`);
  }

  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES[remainder]!);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      if (ones > 0) {
        parts.push(`${TENS[tens]} ${ONES[ones]}`);
      } else {
        parts.push(TENS[tens]!);
      }
    }
  }

  return parts.join(' ');
}

/**
 * Convert a whole number to words.
 */
function wholeNumberToWords(n: number): string {
  if (n === 0) return 'Zero';
  if (n < 0) return `Minus ${wholeNumberToWords(-n)}`;

  const parts: string[] = [];
  let scaleIndex = 0;

  while (n > 0) {
    const chunk = n % 1000;
    if (chunk > 0) {
      const chunkWords = threeDigitsToWords(chunk);
      const scale = SCALES[scaleIndex];
      if (scale) {
        parts.unshift(`${chunkWords} ${scale}`);
      } else {
        parts.unshift(chunkWords);
      }
    }
    n = Math.floor(n / 1000);
    scaleIndex++;
  }

  return parts.join(' ');
}

/**
 * Parse an OMR amount string into rials and baisa.
 * Handles up to 3 decimal places.
 */
function parseOMRAmount(amount: string): { rials: number; baisa: number } | null {
  // Clean the input
  const cleaned = amount.replace(/[,\s]/g, '').trim();

  if (cleaned === '' || cleaned === '.') return null;

  // Validate format: digits with optional decimal point and up to 3 decimal places
  if (!/^\d+(\.\d{0,3})?$/.test(cleaned)) return null;

  const parts = cleaned.split('.');
  const rials = parseInt(parts[0]!, 10);

  if (isNaN(rials) || rials < 0) return null;

  let baisa = 0;
  if (parts[1]) {
    // Pad to 3 decimal places: "5" → "500", "25" → "250", "123" → "123"
    const baisaStr = parts[1].padEnd(3, '0');
    baisa = parseInt(baisaStr, 10);
    if (isNaN(baisa)) return null;
  }

  return { rials, baisa };
}

/**
 * Convert OMR amount to words.
 *
 * @param amount - Amount string (e.g., "1234.567", "100", "0.250")
 * @returns The amount in words, or null if the input is invalid
 */
export function amountToWords(amount: string): string | null {
  const parsed = parseOMRAmount(amount);
  if (parsed === null) return null;

  const { rials, baisa } = parsed;

  // Both zero
  if (rials === 0 && baisa === 0) {
    return 'Zero Rials Only';
  }

  const parts: string[] = [];

  // Rials part
  if (rials > 0) {
    const rialWords = wholeNumberToWords(rials);
    const rialUnit = rials === 1 ? 'Rial' : 'Rials';
    parts.push(`${rialWords} ${rialUnit}`);
  }

  // Baisa part
  if (baisa > 0) {
    if (rials > 0) {
      parts.push('and');
    }
    const baisaWords = wholeNumberToWords(baisa);
    parts.push(`${baisaWords} Baisa`);
  }

  parts.push('Only');

  return parts.join(' ');
}

/**
 * Format amount for display in the amount figures box.
 * Always shows 3 decimal places.
 *
 * @param amount - Amount string
 * @returns Formatted amount string (e.g., "1,234.567") or null if invalid
 */
export function formatAmountDisplay(amount: string): string | null {
  const parsed = parseOMRAmount(amount);
  if (parsed === null) return null;

  const { rials, baisa } = parsed;
  const baisaStr = baisa.toString().padStart(3, '0');

  // Add thousand separators to rials
  const rialsFormatted = rials.toLocaleString('en-US');

  return `${rialsFormatted}.${baisaStr}`;
}

/**
 * Validate an OMR amount string.
 */
export function isValidAmount(amount: string): boolean {
  return parseOMRAmount(amount) !== null;
}

/**
 * Split amount words into two lines if needed (for cheque printing).
 * Line 1: up to maxChars characters
 * Line 2: remainder
 */
export function splitAmountWords(words: string, maxChars: number = 60): [string, string] {
  if (words.length <= maxChars) {
    return [words, ''];
  }

  // Find a word boundary near maxChars
  let splitIndex = maxChars;
  while (splitIndex > 0 && words[splitIndex] !== ' ') {
    splitIndex--;
  }

  if (splitIndex === 0) {
    // No space found, force split
    splitIndex = maxChars;
  }

  return [words.slice(0, splitIndex).trim(), words.slice(splitIndex).trim()];
}
