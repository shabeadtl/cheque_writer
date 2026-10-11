import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FIELD_LABELS, DEFAULT_SETTINGS } from '@/lib/cheque-layout';
import type { AppSettings, FieldConfig } from '@/types/electron.d';
import { Settings, RotateCcw, Save, ChevronDown, ChevronUp } from 'lucide-react';

interface LayoutConfiguratorProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export function LayoutConfigurator({ settings, onSave }: LayoutConfiguratorProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleFieldChange = (
    fieldName: string,
    prop: keyof FieldConfig,
    value: string | number | boolean
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName]!,
          [prop]: value,
        },
      },
    }));
    setSaved(false);
  };

  const handleDimensionChange = (prop: 'chequeWidth' | 'chequeHeight', value: number) => {
    setLocalSettings((prev) => ({ ...prev, [prop]: value }));
    setSaved(false);
  };

  const handleOffsetChange = (prop: 'offsetX' | 'offsetY', value: number) => {
    setLocalSettings((prev) => ({ ...prev, [prop]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    onSave(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setLocalSettings({ ...settings, fields: DEFAULT_SETTINGS.fields });
    setSaved(false);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#009688]" />
            <CardTitle>Layout Configuration</CardTitle>
          </div>
          <Badge variant="warning">Calibration Required</Badge>
        </div>
        <CardDescription>
          Configure field positions, font sizes, and cheque dimensions. All positions are in millimeters from the top-left corner.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Cheque Dimensions */}
        <div className="rounded-lg border border-slate-300 p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            Cheque Dimensions (mm)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cheque-width">Width</Label>
              <Input
                id="cheque-width"
                type="number"
                step="0.5"
                value={localSettings.chequeWidth}
                onChange={(e) =>
                  handleDimensionChange('chequeWidth', parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cheque-height">Height</Label>
              <Input
                id="cheque-height"
                type="number"
                step="0.5"
                value={localSettings.chequeHeight}
                onChange={(e) =>
                  handleDimensionChange('chequeHeight', parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </div>

        {/* Calibration Offsets */}
        <div className="rounded-lg border border-slate-300 p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            Calibration Offsets (mm)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="offset-x">X Offset</Label>
              <Input
                id="offset-x"
                type="number"
                step="0.5"
                value={localSettings.offsetX}
                onChange={(e) =>
                  handleOffsetChange('offsetX', parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offset-y">Y Offset</Label>
              <Input
                id="offset-y"
                type="number"
                step="0.5"
                value={localSettings.offsetY}
                onChange={(e) =>
                  handleOffsetChange('offsetY', parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </div>

        {/* Field Configurations */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">
            Field Positions
          </h4>
          {Object.entries(localSettings.fields).map(([fieldName, config]) => (
            <div
              key={fieldName}
              className="rounded-lg border border-slate-300 overflow-hidden transition-all duration-200"
            >
              {/* Field header (toggle) */}
              <button
                className="flex w-full items-center justify-between p-3 text-left hover:bg-slate-100 transition-colors"
                onClick={() =>
                  setExpandedField(expandedField === fieldName ? null : fieldName)
                }
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {FIELD_LABELS[fieldName] || fieldName}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ({config.x}, {config.y})mm · {config.fontSize}pt
                  </span>
                </div>
                {expandedField === fieldName ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </button>

              {/* Field config (expanded) */}
              {expandedField === fieldName && (
                <div className="border-t border-slate-300 p-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    {/* X position */}
                    <div className="space-y-1">
                      <Label>X (mm)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={config.x}
                        onChange={(e) =>
                          handleFieldChange(fieldName, 'x', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>

                    {/* Y position */}
                    <div className="space-y-1">
                      <Label>Y (mm)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={config.y}
                        onChange={(e) =>
                          handleFieldChange(fieldName, 'y', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>

                    {/* Font size */}
                    <div className="space-y-1">
                      <Label>Font Size (pt)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="6"
                        max="24"
                        value={config.fontSize}
                        onChange={(e) =>
                          handleFieldChange(
                            fieldName,
                            'fontSize',
                            parseFloat(e.target.value) || 10
                          )
                        }
                      />
                    </div>

                    {/* Max width */}
                    <div className="space-y-1">
                      <Label>Max Width (mm)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={config.maxWidth}
                        onChange={(e) =>
                          handleFieldChange(
                            fieldName,
                            'maxWidth',
                            parseFloat(e.target.value) || 50
                          )
                        }
                      />
                    </div>

                    {/* Font family */}
                    <div className="space-y-1">
                      <Label>Font</Label>
                      <Select
                        value={config.fontFamily}
                        onChange={(e) =>
                          handleFieldChange(fieldName, 'fontFamily', e.target.value)
                        }
                      >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Tahoma">Tahoma</option>
                      </Select>
                    </div>

                    {/* Alignment */}
                    <div className="space-y-1">
                      <Label>Alignment</Label>
                      <Select
                        value={config.alignment}
                        onChange={(e) =>
                          handleFieldChange(
                            fieldName,
                            'alignment',
                            e.target.value as 'left' | 'center' | 'right'
                          )
                        }
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </Select>
                    </div>
                  </div>

                  {/* Bold toggle */}
                  <label className="mt-3 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.bold}
                      onChange={(e) =>
                        handleFieldChange(fieldName, 'bold', e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 bg-white accent-[var(--color-primary)]"
                    />
                    <span className="text-sm text-slate-600">Bold</span>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4" />
            {saved ? 'Saved!' : 'Save Layout'}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
