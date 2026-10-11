/**
 * Local settings persistence using electron-store.
 *
 * All settings are stored in a JSON file in the app's userData directory.
 * This runs in the main process only.
 */
declare function getDefaultSettings(): {
    selectedPrinter: string;
    scaleFactor: number;
    marginType: "none";
    customMargins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    chequeWidth: number;
    chequeHeight: number;
    fields: {
        date: {
            x: number;
            y: number;
            fontSize: number;
            fontFamily: string;
            alignment: "left";
            maxWidth: number;
            bold: boolean;
        };
        payee: {
            x: number;
            y: number;
            fontSize: number;
            fontFamily: string;
            alignment: "left";
            maxWidth: number;
            bold: boolean;
        };
        amountWords1: {
            x: number;
            y: number;
            fontSize: number;
            fontFamily: string;
            alignment: "left";
            maxWidth: number;
            bold: boolean;
        };
        amountWords2: {
            x: number;
            y: number;
            fontSize: number;
            fontFamily: string;
            alignment: "left";
            maxWidth: number;
            bold: boolean;
        };
        amountFigures: {
            x: number;
            y: number;
            fontSize: number;
            fontFamily: string;
            alignment: "right";
            maxWidth: number;
            bold: boolean;
        };
    };
    offsetX: number;
    offsetY: number;
};
export declare const settingsStore: {
    getAll: () => any;
    setAll: (settings: Record<string, unknown>) => void;
    getDefaults: typeof getDefaultSettings;
};
export {};
