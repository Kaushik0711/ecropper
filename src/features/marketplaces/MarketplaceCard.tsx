import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Printer } from 'lucide-react';
import { MarketplaceConfig } from '@/config/marketplaces';
import { Badge } from '@/components/ui/Badge';

export interface MarketplaceCardProps {
  marketplace: MarketplaceConfig;
}

export function MarketplaceCard({ marketplace }: MarketplaceCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Banner Accent */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-2xs border ${marketplace.color.bg} ${marketplace.color.text} ${marketplace.color.border}`}
            >
              {marketplace.shortName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {marketplace.name}
                </h3>
                {marketplace.popular && (
                  <Badge variant="primary" size="sm">
                    {marketplace.badge || 'Popular'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {marketplace.category === 'fashion'
                  ? 'Fashion & Apparel'
                  : 'Multi-category Marketplace'}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed min-h-[36px] line-clamp-2">
          {marketplace.tagLine}
        </p>

        {/* Feature Pills */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
          {marketplace.supportedFeatures.slice(0, 3).map((feat) => (
            <span
              key={feat.id}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/70"
            >
              <Check className="w-3 h-3 text-emerald-600" />
              <span>{feat.label}</span>
            </span>
          ))}
          {marketplace.supportedFeatures.length > 3 && (
            <span className="text-[10px] text-slate-400 font-medium self-center pl-1">
              +{marketplace.supportedFeatures.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 px-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span>4&times;6&quot; Thermal &amp; A4</span>
        </div>

        <Link
          href={`/tools/${marketplace.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all"
        >
          <span>Open Tool</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
