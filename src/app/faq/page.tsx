import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { FAQAccordion } from '@/features/faq/FAQAccordion';
import { FAQ_DATA } from '@/config/site';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | ShipCrop Studio',
  description: 'Answers regarding marketplace support, PDF formatting, thermal printing, and browser security.',
};

export default function FAQPage() {
  return (
    <AppShell>
      {/* Header */}
      <div className="bg-white border-b border-slate-200/80 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Help Center & FAQ</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Frequently Asked Questions
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about preparing shipping labels, thermal paper specifications, and zero-upload privacy.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Transparent note */}
        <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-5 text-xs text-blue-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <h4 className="font-bold text-sm text-blue-950">
              Prototype Evaluation Notice
            </h4>
            <p>
              ShipCrop is currently in Phase 0 (UI/UX Design & Interactive Prototype). All answers below accurately reflect our technical architecture and planned capabilities. No real PDF parsing or generation is executed in this prototype.
            </p>
          </div>
        </div>

        {/* Main FAQ Accordion List */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <span>General & Architectural Questions</span>
          </h2>
          <FAQAccordion items={FAQ_DATA} defaultOpenId="supported-marketplaces" />
        </section>

        {/* Still have questions? */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900">
            Have feedback on this design prototype?
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            We are actively refining the user flows, printer presets, and keyboard shortcuts before beginning Phase 1.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-xs transition-colors"
            >
              <span>Test the Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors"
            >
              <span>Privacy Policy</span>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
