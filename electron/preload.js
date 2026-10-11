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
    'print:get-printers',
    'print:print-cheque',
    'app:get-version',
];
function isValidChannel(channel) {
    return VALID_INVOKE_CHANNELS.includes(channel);
}
function safeInvoke(channel, ...args) {
    if (!isValidChannel(channel)) {
        return Promise.reject(new Error(`Invalid IPC channel: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args);
}
const electronAPI = {
    // ── Printing ─────────────────────────────────────────────────────
    getPrinters: () => safeInvoke('print:get-printers'),
    printCheque: (options) => safeInvoke('print:print-cheque', options),
    // ── Settings ─────────────────────────────────────────────────────
    getSettings: () => safeInvoke('settings:get'),
    saveSettings: (settings) => safeInvoke('settings:save', settings),
    // ── App ──────────────────────────────────────────────────────────
    getAppVersion: () => safeInvoke('app:get-version'),
};
// Expose the API to the renderer via contextBridge
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
