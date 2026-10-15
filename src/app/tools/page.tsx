import React from 'react';
import { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { MarketplaceGrid } from '@/features/marketplaces/MarketplaceGrid';
import { Info, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Marketplace Shipping Label Tools | ShipCrop Studio',
  description: 'Browse shipping label cropper tools for Meesho, Flipkart, Amazon, Ajio, Snapdeal, and Myntra.',
};

export default function ToolsDirectoryPage() {
  return (
    <AppShell>
      <div className="bg-white border-b border-slate-200/80 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Tool Directory</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Marketplace Label Cropper Tools
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Select your selling platform below to launch the tailored document processing workspace. Each tool includes presets for standard 4&times;6&quot; thermal roll stickers and A4 paper.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1">
        {/* Support illustrative disclaimer notice */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-amber-950">Illustrative Compatibility Notice:</strong>{' '}
            All marketplace configurations and extraction dimensions presented here are illustrative specifications for the Phase 0 prototype. Verified compatibility and live PDF testing for each marketplace format will be validated in subsequent implementation phases.
          </div>
        </div>

        {/* Marketplace Grid with Live Search & Category Filtering */}
        <MarketplaceGrid showSearch={true} />
      </div>
    </AppShell>
  );
}
