/**
 * Local settings persistence using Electron userData directory and atomic JSON file storage.
 *
 * All settings are stored in a JSON file in the app's userData directory.
 * This runs in the Electron main process only and eliminates ESM/CJS loader issues.
 */

import electron from 'electron';
import fs from 'node:fs';
import path from 'node:path';

// Handle both Electron runtime and test/Node environments
const app = electron?.app || (electron as unknown as { default?: { app?: typeof electron.app } })?.default?.app;

function getDefaultSettings() {
  return {
    // Printer settings
    selectedPrinter: '',
    scaleFactor: 100,
    marginType: 'none' as const,
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
        alignment: 'left' as const,
        maxWidth: 40,
        bold: false,
      },
      payee: {
        x: 25,
        y: 28,
        fontSize: 11,
        fontFamily: 'Arial',
        alignment: 'left' as const,
        maxWidth: 140,
        bold: false,
      },
      amountWords1: {
        x: 10,
        y: 40,
        fontSize: 10,
        fontFamily: 'Arial',
        alignment: 'left' as const,
        maxWidth: 160,
        bold: false,
      },
      amountWords2: {
        x: 10,
        y: 48,
        fontSize: 10,
        fontFamily: 'Arial',
        alignment: 'left' as const,
        maxWidth: 160,
        bold: false,
      },
      amountFigures: {
        x: 165,
        y: 28,
        fontSize: 12,
        fontFamily: 'Arial',
        alignment: 'right' as const,
        maxWidth: 30,
        bold: true,
      },
    },

    // Calibration offsets in mm
    offsetX: 0,
    offsetY: 0,
    isCalibrated: false,
  };
}

let cachedSettings: Record<string, unknown> | null = null;

function getStorePath(): string {
  try {
    if (app && typeof app.getPath === 'function') {
      const userData = app.getPath('userData');
      return path.join(userData, 'nbo-check-writer-settings.json');
    }
  } catch {
    // fallback
  }
  return path.join(process.cwd(), 'nbo-check-writer-settings.json');
}

export const settingsStore = {
  getAll: (): Record<string, unknown> => {
    if (cachedSettings) {
      return cachedSettings;
    }
    const storePath = getStorePath();
    try {
      if (fs.existsSync(storePath)) {
        const raw = fs.readFileSync(storePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          cachedSettings = { ...getDefaultSettings(), ...parsed };
          return cachedSettings;
        }
      }
    } catch (err) {
      console.error('Failed to load settings from storage:', err);
    }
    cachedSettings = getDefaultSettings();
    return cachedSettings;
  },

  setAll: (settings: Record<string, unknown>) => {
    const storePath = getStorePath();
    try {
      const current = settingsStore.getAll();
      const updated = { ...current, ...settings };
      cachedSettings = updated;

      const dir = path.dirname(storePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write atomically using temporary file to prevent corruption
      const tempPath = `${storePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(updated, null, 2), 'utf-8');
      fs.renameSync(tempPath, storePath);
    } catch (err) {
      console.error('Failed to save settings to storage:', err);
    }
  },

  getDefaults: getDefaultSettings,
};
