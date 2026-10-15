import React from 'react';
import Link from 'next/link';
import {
  Scissors,
  Printer,
  FileText,
  Layers,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { MarketplaceGrid } from '@/features/marketplaces/MarketplaceGrid';
import { FAQAccordion } from '@/features/faq/FAQAccordion';
import { FAQ_DATA } from '@/config/site';

export default function HomePage() {
  return (
    <AppShell>
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 py-16 sm:py-24">
        {/* Subtle decorative grid background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200/80 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 0 Design &amp; Interactive Prototype</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Prepare E-Commerce Shipping Labels in Seconds.
            </h1>

            {/* Value Proposition */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Transform multi-page marketplace PDF manifests into sharp, print-ready{' '}
              <strong className="text-slate-900 font-semibold">4&times;6&quot; thermal stickers</strong> and clean{' '}
              <strong className="text-slate-900 font-semibold">A4 layouts</strong>. Separate tax invoices and sort by SKU with zero data leaves your browser.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/tools"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-sm hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>Start Cropping Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-5 py-3.5 rounded-xl border border-slate-300 shadow-2xs transition-colors"
              >
                <span>How It Works</span>
              </Link>
            </div>

            {/* Key feature pills */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% Client-Side Privacy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>4&times;6&quot; Thermal &amp; A4 Paper</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Automated SKU Ordering</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Marketplace Selection Grid */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                <span>Direct Marketplace Tools</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Select Your Marketplace Manifest
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Tailored label extraction presets for leading Indian e-commerce seller portals.
              </p>
            </div>

            <Link
              href="/tools"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
            >
              <span>View all tools</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <MarketplaceGrid showSearch={false} limit={6} />
        </div>
      </section>

      {/* 3. Three-Step Workflow Explanation */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              From Downloaded Manifest to Dispatch-Ready Labels
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Designed to eliminate manual PDF editing, cutting with scissors, and tape wasted on A4 paper.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-xs">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                1. Select Marketplace &amp; PDF
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose your marketplace and drag your downloaded seller PDF. ShipCrop auto-detects page counts and document dimensions.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-xs">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                2. Configure Output &amp; Invoices
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose 4&times;6&quot; roll or A4 sheet layout. Toggle invoice separation, barcode sharpening, and SKU picking sequence.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-xs">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                3. Instant Download &amp; Print
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Preview cropped documents in real time and download the clean PDF ready for your thermal printer or desktop laser printer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Showcase */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Purpose-Built for Sellers
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Engineered for High-Volume Fulfillment
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Scissors className="w-5 h-5 -rotate-45" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Precision Cropping</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strips unwanted headers, instructions, and seller notes to extract clean, standard-size shipping stickers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Thermal Roll Ready</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calibrated for 4&times;6&quot; direct thermal printers (TVS, Zebra, TSC, Rollo) with 203 DPI and 300 DPI barcode clarity.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Tax Invoice Separation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Extracts customer invoices into a separate downloadable PDF, keeping accounts organized without mixing thermal labels.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">SKU Sorting &amp; Picklist</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sorts orders by item SKU code and generates a warehouse packing summary to accelerate parcel dispatch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ Section Preview */}
      <section className="py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Everything you need to know about formats, privacy, and thermal printing.
            </p>
          </div>

          <FAQAccordion items={FAQ_DATA.slice(0, 4)} defaultOpenId="supported-marketplaces" />

          <div className="text-center mt-8">
            <Link
              href="/faq"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
            >
              View all FAQs &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Prominent Bottom CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Format Your Shipping Labels?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto">
            Test the Phase 0 interactive prototype with sample marketplace PDFs and experience the streamlined workflow.
          </p>
          <div className="pt-2">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-bold text-sm px-6 py-3.5 rounded-xl shadow-md transition-colors"
            >
              <span>Explore Marketplace Tools</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
