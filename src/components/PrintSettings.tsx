import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { AppSettings, PrinterInfo } from '@/types/electron.d';
import { Printer, RefreshCw, Save } from 'lucide-react';

interface PrintSettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export function PrintSettings({ settings, onSave }: PrintSettingsProps) {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(settings.selectedPrinter);
  const [scaleFactor, setScaleFactor] = useState(settings.scaleFactor);
  const [marginType, setMarginType] = useState(settings.marginType);
  const [customMargins, setCustomMargins] = useState(settings.customMargins);
  const [saved, setSaved] = useState(false);

  const loadPrinters = useCallback(async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const list = await window.electronAPI.getPrinters();
        setPrinters(list);
        // Auto-select default printer if none selected
        if (!selectedPrinter && list.length > 0) {
          const defaultPrinter = list.find((p) => p.isDefault);
          if (defaultPrinter) {
            setSelectedPrinter(defaultPrinter.name);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load printers:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPrinter]);

  useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  const handleSave = () => {
    onSave({
      ...settings,
      selectedPrinter,
      scaleFactor,
      marginType,
      customMargins,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Printer className="h-5 w-5 text-[#009688]" />
          <CardTitle>Printer Settings</CardTitle>
        </div>
        <CardDescription>
          Select your printer and configure print parameters
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Printer Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="printer-select">Printer</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadPrinters}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <Select
            id="printer-select"
            value={selectedPrinter}
            onChange={(e) => setSelectedPrinter(e.target.value)}
          >
            <option value="">— Select a printer —</option>
            {printers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.displayName || p.name}
                {p.isDefault ? ' (Default)' : ''}
              </option>
            ))}
          </Select>
          {printers.length === 0 && !loading && (
            <p className="text-xs text-slate-500">
              {window.electronAPI
                ? 'No printers found. Check your printer connections.'
                : 'Printer detection requires the desktop app.'}
            </p>
          )}
          {selectedPrinter && (
            <div className="flex gap-2">
              {printers
                .filter((p) => p.name === selectedPrinter)
                .map((p) => (
                  <Badge
                    key={p.name}
                    variant={p.status === 0 ? 'success' : 'warning'}
                  >
                    {p.status === 0 ? 'Ready' : `Status: ${p.status}`}
                  </Badge>
                ))}
            </div>
          )}
        </div>

        {/* Scale Factor */}
        <div className="space-y-2">
          <Label htmlFor="scale-factor">Print Scale (%)</Label>
          <Input
            id="scale-factor"
            type="number"
            min="50"
            max="200"
            step="1"
            value={scaleFactor}
            onChange={(e) => setScaleFactor(parseInt(e.target.value) || 100)}
          />
          <p className="text-xs text-slate-500">
            100% = actual size. Adjust if your printer scales output.
          </p>
        </div>

        {/* Margins */}
        <div className="space-y-2">
          <Label htmlFor="margin-type">Margins</Label>
          <Select
            id="margin-type"
            value={marginType}
            onChange={(e) =>
              setMarginType(e.target.value as 'default' | 'none' | 'custom')
            }
          >
            <option value="none">None (recommended for cheques)</option>
            <option value="default">Printer Default</option>
            <option value="custom">Custom</option>
          </Select>
        </div>

        {/* Custom Margins */}
        {marginType === 'custom' && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <div className="space-y-1">
              <Label htmlFor="margin-top">Top (px)</Label>
              <Input
                id="margin-top"
                type="number"
                min="0"
                value={customMargins.top}
                onChange={(e) =>
                  setCustomMargins((m) => ({
                    ...m,
                    top: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="margin-bottom">Bottom (px)</Label>
              <Input
                id="margin-bottom"
                type="number"
                min="0"
                value={customMargins.bottom}
                onChange={(e) =>
                  setCustomMargins((m) => ({
                    ...m,
                    bottom: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="margin-left">Left (px)</Label>
              <Input
                id="margin-left"
                type="number"
                min="0"
                value={customMargins.left}
                onChange={(e) =>
                  setCustomMargins((m) => ({
                    ...m,
                    left: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="margin-right">Right (px)</Label>
              <Input
                id="margin-right"
                type="number"
                min="0"
                value={customMargins.right}
                onChange={(e) =>
                  setCustomMargins((m) => ({
                    ...m,
                    right: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
        )}

        {/* Save */}
        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4" />
          {saved ? 'Saved!' : 'Save Printer Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
