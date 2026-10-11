import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AppSettings } from '@/types/electron.d';
import { DEFAULT_SETTINGS } from '@/lib/cheque-layout';
import { Settings, Download, Upload, RotateCcw, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface SettingsPageProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

type Feedback = { kind: 'success' | 'error'; message: string };

export function SettingsPage({ settings, onSave }: SettingsPageProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const feedbackTimer = useRef<number | undefined>(undefined);

  const showFeedback = (kind: 'success' | 'error', message: string) => {
    setFeedback({ kind, message });
    window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 4000);
  };

  const isDesktop = !!window.electronAPI;

  const fieldCount = Object.keys(settings.fields).length;
  const fieldsChanged = Object.keys(DEFAULT_SETTINGS.fields).filter((key) => {
    const current = settings.fields[key];
    const def = DEFAULT_SETTINGS.fields[key];
    if (!current || !def) return true;
    return (
      current.x !== def.x ||
      current.y !== def.y ||
      current.fontSize !== def.fontSize ||
      current.alignment !== def.alignment ||
      current.maxWidth !== def.maxWidth ||
      current.bold !== def.bold
    );
  });

  const handleResetDefaults = () => {
    setConfirmReset(false);
    onSave({ ...DEFAULT_SETTINGS, selectedPrinter: settings.selectedPrinter });
    showFeedback('success', 'All layout and calibration settings restored to defaults.');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (isDesktop && window.electronAPI) {
      try {
        const path = await window.electronAPI.exportSettings(settings);
        if (path) {
          showFeedback('success', `Settings exported to ${path}`);
        }
      } catch (err) {
        showFeedback('error', `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } else {
      try {
        const json = JSON.stringify(settings, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nbo-check-settings-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showFeedback('success', 'Settings downloaded as JSON backup.');
      } catch (err) {
        showFeedback('error', `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const handleImport = async () => {
    if (isDesktop && window.electronAPI) {
      try {
        const imported = await window.electronAPI.importSettings();
        if (!imported) return; // User cancelled
        onSave({ ...settings, ...imported } as AppSettings);
        showFeedback('success', 'Settings imported and applied.');
      } catch (err) {
        showFeedback('error', `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Invalid JSON format');
        }
        onSave({ ...settings, ...parsed } as AppSettings);
        showFeedback('success', 'Settings imported and applied successfully.');
      } catch (err) {
        showFeedback('error', `Invalid settings file: ${err instanceof Error ? err.message : 'Parse error'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
            feedback.kind === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600'
              : 'bg-red-500/10 border border-red-500/20 text-red-600'
          }`}
        >
          {feedback.kind === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Calibration status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-[#009688]" />
            <CardTitle>System Status</CardTitle>
          </div>
          <CardDescription>Current state of calibration and configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Calibration</span>
            <Badge variant={settings.isCalibrated ? 'success' : 'warning'}>
              {settings.isCalibrated ? 'Calibrated' : 'Not calibrated — placeholders in use'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Configured fields</span>
            <Badge variant="outline">{fieldCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Edited from default</span>
            <Badge variant="outline">
              {fieldsChanged.length > 0 ? `${fieldsChanged.length} field${fieldsChanged.length > 1 ? 's' : ''}` : 'None'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Cheque size</span>
            <Badge variant="outline">
              {settings.chequeWidth}mm × {settings.chequeHeight}mm
            </Badge>
          </div>
          {!isDesktop && (
            <p className="text-xs text-slate-500">
              Running in Web / PWA mode — settings and calibrations are saved locally to this device.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Backup & restore */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#009688]" />
            <CardTitle>Backup &amp; Restore</CardTitle>
          </div>
          <CardDescription>
            Save all printer, layout, and calibration settings to a JSON file, or restore from a previous backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export Settings
          </Button>
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4" />
            Import Settings
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-700">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Resets every field position, calibration offset, and cheque dimension to the factory placeholders. Your
            selected printer is kept.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="destructive" onClick={handleResetDefaults}>
                <RotateCcw className="h-4 w-4" />
                Yes, reset everything
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="destructive" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
