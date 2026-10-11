/**
 * Local settings persistence using electron-store.
 *
 * All settings are stored in a JSON file in the app's userData directory.
 * This runs in the main process only.
 */
// electron-store v10 is ESM-only, so we use dynamic import
let storeInstance = null;
function getDefaultSettings() {
    return {
        // Printer settings
        selectedPrinter: '',
        scaleFactor: 100,
        marginType: 'none',
        customMargins: { top: 0, bottom: 0, left: 0, right: 0 },
        // Cheque dimensions in mm — PLACEHOLDERS requiring calibration
        chequeWidth: 200,
        chequeHeight: 90,
        // Field positions — PLACEHOLDERS requiring calibration against real NBO cheque
        fields: {
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
        },
        // Calibration offsets in mm
        offsetX: 0,
        offsetY: 0,
    };
}
// Synchronous wrapper for settings access from IPC handlers
export const settingsStore = {
    getAll: () => {
        // For synchronous access, we use a simpler approach
        try {
            const Store = require('electron-store');
            if (!storeInstance) {
                storeInstance = new Store({
                    name: 'nbo-check-writer-settings',
                    defaults: getDefaultSettings(),
                });
            }
            return storeInstance.store;
        }
        catch {
            return getDefaultSettings();
        }
    },
    setAll: (settings) => {
        try {
            const Store = require('electron-store');
            if (!storeInstance) {
                storeInstance = new Store({
                    name: 'nbo-check-writer-settings',
                    defaults: getDefaultSettings(),
                });
            }
            // Merge settings
            for (const [key, value] of Object.entries(settings)) {
                storeInstance.set(key, value);
            }
        }
        catch (err) {
            console.error('Failed to save settings:', err);
        }
    },
    getDefaults: getDefaultSettings,
};
