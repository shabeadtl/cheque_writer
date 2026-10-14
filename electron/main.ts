import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { settingsStore } from './settings-store.ts';
import { handlePrint, handleGetPrinters } from './print-service.ts';

// ESM-safe equivalent of __dirname (package.json has "type": "module")
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─ dist-electron
// │ ├── main.js
// │ └── preload.js
// ├─┬─ dist
// │ └── index.html
//
process.env.APP_ROOT = path.join(__dirname, '..');
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'NBO Check Writer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true, // Sandboxed renderer for maximum security
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    show: false,
    backgroundColor: '#0a0a0b',
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (VITE_DEV_SERVER_URL && url.startsWith(VITE_DEV_SERVER_URL)) {
      return; // Allow dev server navigation
    }
    event.preventDefault();
  });

  // Prevent new windows from opening
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Open external links in the default browser
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

// ── IPC Handlers ──────────────────────────────────────────────────────

// Settings
ipcMain.handle('settings:get', () => {
  return settingsStore.getAll();
});

ipcMain.handle('settings:save', (_event, settings: Record<string, unknown>) => {
  settingsStore.setAll(settings);
  return true;
});

// Printing
ipcMain.handle('print:get-printers', async () => {
  if (!mainWindow) return [];
  return handleGetPrinters(mainWindow);
});

ipcMain.handle('print:print-cheque', async (_event, options: Record<string, unknown>) => {
  if (!mainWindow) return { success: false, error: 'No window available' };
  return handlePrint(mainWindow, options);
});

// Export settings to a user-chosen JSON file
ipcMain.handle('settings:export', async (_event, settings: Record<string, unknown>) => {
  if (!mainWindow) return '';
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Settings',
    defaultPath: 'nbo-check-writer-settings.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return '';
  fs.writeFileSync(result.filePath, JSON.stringify(settings, null, 2), 'utf-8');
  return result.filePath;
});

// Import settings from a user-chosen JSON file
ipcMain.handle('settings:import', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Settings',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  try {
    const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
    const imported = JSON.parse(raw);
    if (typeof imported !== 'object' || imported === null) return null;
    return imported as Record<string, unknown>;
  } catch (err) {
    console.error('Failed to import settings:', err);
    return null;
  }
});

// App info
ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

// ── App Lifecycle ─────────────────────────────────────────────────────

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  mainWindow = null;
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
