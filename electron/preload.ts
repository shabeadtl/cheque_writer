import { contextBridge, ipcRenderer } from 'electron';

/**
 * Secure preload script — exposes a minimal API to the renderer process.
 *
 * Security: contextIsolation is enabled and nodeIntegration is disabled.
 * Only explicitly listed IPC channels are accessible.
 */

// Whitelist of allowed IPC channels
const VALID_INVOKE_CHANNELS = [
  'settings:get',
  'settings:save',
  'settings:export',
  'settings:import',
  'print:get-printers',
  'print:print-cheque',
  'app:get-version',
] as const;

type ValidChannel = (typeof VALID_INVOKE_CHANNELS)[number];

function isValidChannel(channel: string): channel is ValidChannel {
  return (VALID_INVOKE_CHANNELS as readonly string[]).includes(channel);
}

function safeInvoke(channel: ValidChannel, ...args: unknown[]): Promise<unknown> {
  if (!isValidChannel(channel)) {
    return Promise.reject(new Error(`Invalid IPC channel: ${channel}`));
  }
  return ipcRenderer.invoke(channel, ...args);
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

export interface PrintOptions {
  html: string;
  printerName: string;
  silent: boolean;
  pageWidth: number;   // in microns
  pageHeight: number;  // in microns
  margins?: {
    marginType: 'default' | 'none' | 'custom';
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  scaleFactor?: number;
  landscape?: boolean;
}

export interface PrintResult {
  success: boolean;
  error?: string;
}

export interface AppSettings {
  // Printer settings
  selectedPrinter: string;
  scaleFactor: number;
  marginType: 'default' | 'none' | 'custom';
  customMargins: { top: number; bottom: number; left: number; right: number };

  // Cheque layout (all values in mm)
  chequeWidth: number;
  chequeHeight: number;

  // Field positions (x, y in mm from top-left, fontSize in pt)
  fields: {
    [fieldName: string]: {
      x: number;
      y: number;
      fontSize: number;
      fontFamily: string;
      alignment: 'left' | 'center' | 'right';
      maxWidth: number; // mm
      bold: boolean;
    };
  };

  // Calibration offsets
  offsetX: number;
  offsetY: number;
}

const electronAPI = {
  // ── Printing ─────────────────────────────────────────────────────
  getPrinters: (): Promise<PrinterInfo[]> =>
    safeInvoke('print:get-printers') as Promise<PrinterInfo[]>,

  printCheque: (options: PrintOptions): Promise<PrintResult> =>
    safeInvoke('print:print-cheque', options) as Promise<PrintResult>,

  // ── Settings ─────────────────────────────────────────────────────
  getSettings: (): Promise<AppSettings> =>
    safeInvoke('settings:get') as Promise<AppSettings>,

  saveSettings: (settings: AppSettings): Promise<void> =>
    safeInvoke('settings:save', settings) as Promise<void>,

  // Export current settings to a user-chosen JSON file. Returns the saved path.
  exportSettings: (settings: AppSettings): Promise<string> =>
    safeInvoke('settings:export', settings) as Promise<string>,

  // Import settings from a user-chosen JSON file. Returns the parsed settings or null if cancelled.
  importSettings: (): Promise<AppSettings | null> =>
    safeInvoke('settings:import') as Promise<AppSettings | null>,

  // ── App ──────────────────────────────────────────────────────────
  getAppVersion: (): Promise<string> =>
    safeInvoke('app:get-version') as Promise<string>,
};

// Expose the API to the renderer via contextBridge
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript type for the renderer to consume
export type ElectronAPI = typeof electronAPI;
