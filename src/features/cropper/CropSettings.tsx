'use client';

import React, { useState } from 'react';
import {
  Printer,
  FileText,
  Sliders,
  Layers,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { MarketplaceConfig } from '@/config/marketplaces';

export interface CropSettingsState {
  outputFormat: 'thermal-4x6' | 'a4-4in1' | 'a4-2in1';
  cropLabelsOnly: boolean;
  separateInvoices: boolean;
  sortSku: boolean;
  sharpenBarcodes: boolean;
  marginMm: number;
  targetDpi: 203 | 300;
}

export interface CropSettingsProps {
  marketplace: MarketplaceConfig;
  settings: CropSettingsState;
  onSettingsChange: (settings: CropSettingsState) => void;
  onResetSettings: () => void;
  disabled?: boolean;
}

export function CropSettings({
  marketplace,
  settings,
  onSettingsChange,
  onResetSettings,
  disabled = false,
}: CropSettingsProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const updateSetting = <K extends keyof CropSettingsState>(
    key: K,
    value: CropSettingsState[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>{marketplace.name} Settings</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure output layout and manifest extraction
          </p>
        </div>
        <button
          type="button"
          onClick={onResetSettings}
          disabled={disabled}
          title="Reset to default settings"
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. Output Layout Radio Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            Target Output Layout
          </label>
          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
            Phase 1 Vector Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Option A: 4x6 Thermal */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => updateSetting('outputFormat', 'thermal-4x6')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer select-none ${
              settings.outputFormat === 'thermal-4x6'
                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">4&times;6&quot; Thermal</span>
              <Printer className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">288 &times; 432 pt (Active)</p>
          </button>

          {/* Option B: A4 4-in-1 (Phase 2) */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => updateSetting('outputFormat', 'a4-4in1')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer select-none opacity-80 ${
              settings.outputFormat === 'a4-4in1'
                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">A4 4-in-1</span>
              <Layers className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[10px] text-amber-600 font-medium mt-1">Phase 2 layout</p>
          </button>

          {/* Option C: A4 2-in-1 (Phase 2) */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => updateSetting('outputFormat', 'a4-2in1')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer select-none opacity-80 ${
              settings.outputFormat === 'a4-2in1'
                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">A4 2-in-1</span>
              <FileText className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[10px] text-amber-600 font-medium mt-1">Phase 2 layout</p>
          </button>
        </div>
      </div>

      {/* 2. Feature Toggles */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <Switch
          checked={settings.cropLabelsOnly}
          onChange={(v) => updateSetting('cropLabelsOnly', v)}
          disabled={disabled}
          label="Manual Crop Box Region Only"
          description="Embeds the exact region defined on the canvas onto the newly generated output pages."
        />

        <Switch
          checked={settings.separateInvoices}
          onChange={(v) => updateSetting('separateInvoices', v)}
          disabled={true}
          label="Separate Tax Invoices (Phase 2)"
          description="Automatic invoice boundary isolation requires invoice OCR detection (Phase 2)."
        />

        <Switch
          checked={settings.sortSku}
          onChange={(v) => updateSetting('sortSku', v)}
          disabled={true}
          label="Sort Orders by Product SKU (Phase 2)"
          description="Automatic barcode / SKU sorting requires OCR text parsing (Phase 2)."
        />

        <Switch
          checked={settings.sharpenBarcodes}
          onChange={(v) => updateSetting('sharpenBarcodes', v)}
          disabled={disabled}
          label="Lossless Vector Barcode Preservation"
          description="Embeds source page vectors directly without rasterizing to preserve crisp thermal printing."
        />
      </div>

      {/* 3. Advanced Calibration Settings Accordion */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 transition-colors"
        >
          <span>Print Calibration Settings</span>
          {advancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {advancedOpen && (
          <div className="mt-3 p-3.5 bg-slate-50 rounded-xl space-y-3 border border-slate-200/80 text-xs">
            {/* Margin selection */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Print Safety Margin (Padding)
              </label>
              <div className="flex items-center gap-2">
                {[0, 2, 4].map((mm) => (
                  <button
                    key={mm}
                    type="button"
                    onClick={() => updateSetting('marginMm', mm)}
                    className={`px-3 py-1.5 rounded-lg border font-medium ${
                      settings.marginMm === mm
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {mm} mm {mm === 2 ? '(Recommended)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* DPI selection */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Target Head Resolution
              </label>
              <div className="flex items-center gap-2">
                {([203, 300] as const).map((dpi) => (
                  <button
                    key={dpi}
                    type="button"
                    onClick={() => updateSetting('targetDpi', dpi)}
                    className={`px-3 py-1.5 rounded-lg border font-medium ${
                      settings.targetDpi === dpi
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {dpi} DPI {dpi === 203 ? '(TVS / Zebra / TSC)' : '(High Density)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-1">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>
                Phase 1 uses vector embedding to preserve native resolution. The 2mm margin prevents physical edge cutoff on thermal rolls.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
