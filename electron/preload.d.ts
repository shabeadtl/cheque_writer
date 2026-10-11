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
export interface AppSettings {
    selectedPrinter: string;
    scaleFactor: number;
    marginType: 'default' | 'none' | 'custom';
    customMargins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    chequeWidth: number;
    chequeHeight: number;
    fields: {
        [fieldName: string]: {
            x: number;
            y: number;
            fontSize: number;
            fontFamily: string;
            alignment: 'left' | 'center' | 'right';
            maxWidth: number;
            bold: boolean;
        };
    };
    offsetX: number;
    offsetY: number;
}
declare const electronAPI: {
    getPrinters: () => Promise<PrinterInfo[]>;
    printCheque: (options: PrintOptions) => Promise<PrintResult>;
    getSettings: () => Promise<AppSettings>;
    saveSettings: (settings: AppSettings) => Promise<void>;
    getAppVersion: () => Promise<string>;
};
export type ElectronAPI = typeof electronAPI;
export {};
