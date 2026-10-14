/**
 * Type definitions for the Electron API exposed via contextBridge.
 */

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
  pageWidth: number;
  pageHeight: number;
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

export interface FieldConfig {
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  alignment: 'left' | 'center' | 'right';
  maxWidth: number;
  bold: boolean;
}

export interface AppSettings {
  selectedPrinter: string;
  scaleFactor: number;
  marginType: 'default' | 'none' | 'custom';
  customMargins: { top: number; bottom: number; left: number; right: number };
  chequeWidth: number;
  chequeHeight: number;
  fields: Record<string, FieldConfig>;
  offsetX: number;
  offsetY: number;
  isCalibrated: boolean;
}

export interface ChequeData {
  payee: string;
  date: string;
  amount: string;
  amountWords: string;
  serialNumber?: string;
}

export interface ElectronAPI {
  getPrinters: () => Promise<PrinterInfo[]>;
  printCheque: (options: PrintOptions) => Promise<PrintResult>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  exportSettings: (settings: AppSettings) => Promise<string>;
  importSettings: () => Promise<Partial<AppSettings> | null>;
  getAppVersion: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
