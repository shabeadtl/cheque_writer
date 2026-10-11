import { BrowserWindow } from 'electron';
/**
 * Print service — handles all printing in the main process.
 *
 * Uses a hidden BrowserWindow to render print-ready HTML, then
 * prints to the selected printer with precise positioning.
 */
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
/**
 * Get available printers from the system.
 */
export declare function handleGetPrinters(mainWindow: BrowserWindow): Promise<{
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
}[]>;
/**
 * Print HTML content to the specified printer.
 *
 * Creates a hidden BrowserWindow, loads the HTML, and prints it.
 * This gives full CSS control over positioning and layout.
 */
export declare function handlePrint(_mainWindow: BrowserWindow, options: Record<string, unknown>): Promise<PrintResult>;
