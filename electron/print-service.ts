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

/**
 * Get available printers from the system.
 */
export async function handleGetPrinters(mainWindow: BrowserWindow) {
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers.map((p) => ({
      name: p.name,
      displayName: p.displayName,
      description: p.description,
      status: (p as any).status ?? 0,
      isDefault: (p as any).isDefault ?? false,
    }));
  } catch (err) {
    console.error('Failed to get printers:', err);
    return [];
  }
}

/**
 * Print HTML content to the specified printer.
 *
 * Creates a hidden BrowserWindow, loads the HTML, and prints it.
 * This gives full CSS control over positioning and layout.
 */
export async function handlePrint(
  _mainWindow: BrowserWindow,
  options: Record<string, unknown>
): Promise<PrintResult> {
  const printOptions = options as unknown as PrintOptions;

  return new Promise((resolve) => {
    // Create a hidden window for printing
    const printWindow = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    printWindow.webContents.on('did-finish-load', () => {
      const electronPrintOptions: Electron.WebContentsPrintOptions = {
        silent: printOptions.silent,
        printBackground: true,
        deviceName: printOptions.printerName || undefined,
        landscape: printOptions.landscape ?? false,
        scaleFactor: printOptions.scaleFactor ?? 100,
      };

      // Set margins
      if (printOptions.margins) {
        if (printOptions.margins.marginType === 'none') {
          electronPrintOptions.margins = { marginType: 'none' };
        } else if (printOptions.margins.marginType === 'custom') {
          electronPrintOptions.margins = {
            marginType: 'custom',
            top: printOptions.margins.top ?? 0,
            bottom: printOptions.margins.bottom ?? 0,
            left: printOptions.margins.left ?? 0,
            right: printOptions.margins.right ?? 0,
          };
        }
      } else {
        electronPrintOptions.margins = { marginType: 'none' };
      }

      // Set page size if provided (in microns)
      if (printOptions.pageWidth && printOptions.pageHeight) {
        electronPrintOptions.pageSize = {
          width: printOptions.pageWidth,
          height: printOptions.pageHeight,
        };
      }

      printWindow.webContents.print(electronPrintOptions, (success, failureReason) => {
        printWindow.close();
        if (success) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: failureReason || 'Print failed' });
        }
      });
    });

    // Load the print HTML content
    printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(printOptions.html)}`
    );
  });
}
