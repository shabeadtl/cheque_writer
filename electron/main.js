import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { settingsStore } from './settings-store';
import { handlePrint, handleGetPrinters } from './print-service';
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
let mainWindow = null;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 860,
        minWidth: 960,
        minHeight: 640,
        title: 'NBO Check Writer',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false, // Required for electron-store in preload
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
    }
    else {
        mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
    }
}
// ── IPC Handlers ──────────────────────────────────────────────────────
// Settings
ipcMain.handle('settings:get', () => {
    return settingsStore.getAll();
});
ipcMain.handle('settings:save', (_event, settings) => {
    settingsStore.setAll(settings);
    return true;
});
// Printing
ipcMain.handle('print:get-printers', async () => {
    if (!mainWindow)
        return [];
    return handleGetPrinters(mainWindow);
});
ipcMain.handle('print:print-cheque', async (_event, options) => {
    if (!mainWindow)
        return { success: false, error: 'No window available' };
    return handlePrint(mainWindow, options);
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
