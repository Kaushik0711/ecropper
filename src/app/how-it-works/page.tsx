import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Scissors,
  FileUp,
  Sliders,
  Eye,
  Download,
  ArrowRight,
  Printer,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'How It Works | ShipCrop Studio',
  description: 'Step-by-step guide to preparing e-commerce shipping labels for 4x6" thermal printers.',
};

export default function HowItWorksPage() {
  const steps = [
    {
      step: '01',
      title: 'Select Your Marketplace Portal',
      description:
        'Choose from Meesho, Flipkart, Amazon, Ajio, Snapdeal, or Myntra. Each tool has pre-calibrated boundary geometries tailored to that marketplace’s manifest structure.',
      icon: <Scissors className="w-6 h-6 text-blue-600" />,
      actionText: 'Browse 6+ Marketplaces',
      actionHref: '/tools',
    },
    {
      step: '02',
      title: 'Choose Local PDF Manifests',
      description:
        'Drag and drop the unedited multi-order PDF downloaded directly from your seller dashboard. Files are read solely into your browser’s local memory — zero data is sent to external servers.',
      icon: <FileUp className="w-6 h-6 text-emerald-600" />,
      actionText: 'Supported Formats',
      actionHref: '#privacy',
    },
    {
      step: '03',
      title: 'Configure Output & Separation Options',
      description:
        'Choose your desired paper format: standard 4×6" (100×150mm) thermal roll, A4 4-in-1, or A4 2-in-1. Enable invoice separation or SKU sequence sorting to match your warehouse packing station.',
      icon: <Sliders className="w-6 h-6 text-amber-600" />,
      actionText: 'Thermal vs A4 Guide',
      actionHref: '#thermal',
    },
    {
      step: '04',
      title: 'Live Preview & Visual Verification',
      description:
        'Inspect your cropped labels on the interactive canvas before printing. Navigate through individual pages, zoom into barcode lines, and verify courier routing codes.',
      icon: <Eye className="w-6 h-6 text-purple-600" />,
      actionText: 'Try Interactive Workspace',
      actionHref: '/tools/meesho',
    },
    {
      step: '05',
      title: 'Download & Dispatch',
      description:
        'Instantly download the optimized PDF. If invoice separation was selected, you get a clean secondary PDF containing only packing slips for your filing cabinet.',
      icon: <Download className="w-6 h-6 text-sky-600" />,
      actionText: 'Start Cropping',
      actionHref: '/tools',
    },
  ];

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-white border-b border-slate-200/80 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workflow Guide</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            How ShipCrop Works
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            A frictionless, 100% in-browser workflow to convert unwieldy e-commerce PDFs into clean, professional shipping labels.
          </p>
        </div>
      </div>

      {/* Main Steps */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="space-y-8">
          {steps.map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start gap-6 transition-all hover:border-blue-300"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 shrink-0">
                {item.icon}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Step {item.step}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <Link
                href={item.actionHref}
                className="self-start md:self-center shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3.5 py-2 rounded-lg transition-colors"
              >
                <span>{item.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Section on Thermal vs A4 */}
        <section id="thermal" className="pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-slate-900">
              Thermal Printing vs. Standard A4
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Choose the layout that matches your warehouse equipment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-blue-600">
                <Printer className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">
                  4&times;6&quot; Direct Thermal Roll
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct thermal label printers (TVS, TSC, Zebra, Xprinter) use heat-sensitive sticker paper rolls. They need no ink, toner, or adhesive tape. ShipCrop renders native 203 DPI &amp; 300 DPI vectors with crisp barcodes for zero scan failures.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Exact 100mm &times; 150mm dimensions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Peel-and-stick dispatch in 2 seconds</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Zero tape or ribbon cost</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-blue-600">
                <Layers className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">
                  A4 Multi-Label Sheets (4-in-1 / 2-in-1)
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you use a standard laser or inkjet printer with A4 sticker paper or plain photocopy paper, ShipCrop packs 4 cropped labels per sheet with cutting guidelines, saving up to 75% on paper consumption.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Works with regular HP, Canon, Epson printers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cuts paper waste by 75%</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Evenly spaced cut guides</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-4">
          <h2 className="text-2xl font-bold">Try the Interactive Prototype</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Select a marketplace and test the uploader, setting controls, and simulated processing workflow.
          </p>
          <div className="pt-2">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-xs transition-colors"
            >
              <span>Launch Tool Directory</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
