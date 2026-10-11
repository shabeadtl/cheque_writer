import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '@/types/electron.d';
import { DEFAULT_SETTINGS } from '@/lib/cheque-layout';

/**
 * Hook for managing app settings with Electron persistence.
 *
 * Falls back to defaults if the Electron API is not available (e.g., in browser dev).
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    async function load() {
      try {
        if (window.electronAPI) {
          const saved = await window.electronAPI.getSettings();
          if (saved) {
            setSettings({ ...DEFAULT_SETTINGS, ...saved });
          }
        } else {
          const raw = localStorage.getItem('nbo_check_writer_settings');
          if (raw) {
            const parsed = JSON.parse(raw);
            setSettings({ ...DEFAULT_SETTINGS, ...parsed });
          }
        }
      } catch (err) {
        console.warn('Failed to load settings, using defaults:', err);
        setError('Failed to load saved settings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Save settings
  const saveSettings = useCallback(
    async (newSettings: AppSettings) => {
      setSettings(newSettings);
      try {
        if (window.electronAPI) {
          await window.electronAPI.saveSettings(newSettings);
        } else {
          localStorage.setItem('nbo_check_writer_settings', JSON.stringify(newSettings));
        }
        setError(null);
      } catch (err) {
        console.error('Failed to save settings:', err);
        setError('Failed to save settings');
      }
    },
    []
  );

  // Update a single field
  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const newSettings = { ...settings, ...partial };
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  return { settings, loading, error, saveSettings, updateSettings };
}
