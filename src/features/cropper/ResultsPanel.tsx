'use client';

import React from 'react';
import {
  Download,
  CheckCircle2,
  FileText,
  RotateCcw,
  Info,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MarketplaceConfig } from '@/config/marketplaces';
import { CropSettingsState } from './CropSettings';
import { PdfProcessResult } from '@/lib/pdf/types';

export interface ResultsPanelProps {
  marketplace: MarketplaceConfig;
  result: PdfProcessResult;
  settings: CropSettingsState;
  onProcessAnother: () => void;
  onSimulateError: () => void;
}

export function ResultsPanel({
  result,
  settings,
  onProcessAnother,
  onSimulateError,
}: ResultsPanelProps) {
  const handleRealDownload = () => {
    if (!result.outputUrl && !result.outputBytes) return;

    // Trigger browser download via temporary anchor element
    let downloadUrl = result.outputUrl;
    let autoRevoke = false;

    if (!downloadUrl && result.outputBytes) {
      const blob = new Blob([result.outputBytes as unknown as BlobPart], { type: 'application/pdf' });
      downloadUrl = URL.createObjectURL(blob);
      autoRevoke = true;
    }

    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = result.outputFileName || 'Cropped_Labels_Thermal_4x6.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (autoRevoke) {
        setTimeout(() => URL.revokeObjectURL(downloadUrl!), 1000);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-200/90 shadow-md p-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Success Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/80">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                PDF Generated Successfully
              </h3>
              <Badge variant="success" size="sm">
                Real Vector PDF
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Processed {result.sourcePageCount} source page{result.sourcePageCount === 1 ? '' : 's'} into {result.outputPageCount} thermal label page{result.outputPageCount === 1 ? '' : 's'}{result.acceptedCount ? ` (${result.acceptedCount} detected & accepted)` : ''} in {result.processingTimeMs}ms • Margin: {settings.marginMm}mm • Vector Preserved
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onProcessAnother}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Process Another File
        </Button>
      </div>

      {/* Processed File Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <span className="text-[11px] font-medium text-slate-500 block">Source File</span>
          <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate" title={result.sourceFileName}>
            {result.sourceFileName}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <span className="text-[11px] font-medium text-slate-500 block">Output Pages</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block">
            {result.outputPageCount} <span className="text-xs font-normal text-slate-500">label page{result.outputPageCount === 1 ? '' : 's'}</span>
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <span className="text-[11px] font-medium text-slate-500 block">Output Size</span>
          <span className="text-xs font-bold text-slate-900 mt-1 block font-mono">
            {result.outputDimensions.widthPt} &times; {result.outputDimensions.heightPt} pt
          </span>
          <span className="text-[10px] text-slate-500 block">
            ({result.outputDimensions.widthMm} &times; {result.outputDimensions.heightMm} mm)
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <span className="text-[11px] font-medium text-slate-500 block">File Size</span>
          <span className="text-xs font-bold text-slate-900 mt-1 block font-mono">
            {result.outputBytes ? `${(result.outputBytes.byteLength / 1024).toFixed(1)} KB` : 'N/A'}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block">
            100% Client-Side
          </span>
        </div>
      </div>

      {/* Output Actions & Downloads */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Download Generated Documents
        </h4>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Primary Action: Real PDF Download */}
          <Button
            variant="primary"
            size="lg"
            className="flex-1 font-bold shadow-md hover:shadow-lg transition-all"
            onClick={handleRealDownload}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download {result.outputFileName}
          </Button>

          {/* Secondary Action: Invoices (Phase 2) */}
          <Button
            variant="outline"
            size="lg"
            disabled={true}
            className="flex-1 opacity-60 cursor-not-allowed"
            leftIcon={<FileText className="w-4 h-4 text-slate-400" />}
          >
            <span>Tax Invoices (Phase 2)</span>
          </Button>

          {/* Tertiary Action: Picklist (Phase 2) */}
          <Button
            variant="secondary"
            size="lg"
            disabled={true}
            className="opacity-60 cursor-not-allowed"
            leftIcon={<Layers className="w-4 h-4 text-slate-400" />}
          >
            <span>Picklist (Phase 2)</span>
          </Button>
        </div>
      </div>

      {/* Privacy Guarantee & Diagnostics */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">
              Verified Real PDF Generation:
            </span>{' '}
            <span>
              This file was assembled in your browser using pdf-lib vector embedding. Zero network requests were made.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSimulateError}
          className="text-xs text-slate-400 hover:text-rose-600 underline font-medium shrink-0 cursor-pointer"
        >
          Test Error Recovery State
        </button>
      </div>
    </div>
  );
}
