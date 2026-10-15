import React from 'react';
import Link from 'next/link';
import { Scissors, ShieldCheck, CheckCircle } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Scissors className="w-4 h-4 -rotate-45" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                ShipCrop Studio
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed text-xs">
              Fast, high-precision shipping label cropper for e-commerce sellers.
              Formats messy manifest PDFs into clean 4&times;6&quot; thermal stickers and A4 sheets.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 w-fit">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Zero-upload, 100% Client-Side</span>
            </div>
          </div>

          {/* Marketplace Tools */}
          <div>
            <h4 className="text-slate-200 font-semibold text-sm mb-3">Marketplaces</h4>
            <ul className="space-y-2">
              {SITE_CONFIG.footerLinks.tools.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources & Guides */}
          <div>
            <h4 className="text-slate-200 font-semibold text-sm mb-3">Resources</h4>
            <ul className="space-y-2">
              {SITE_CONFIG.footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Architecture */}
          <div>
            <h4 className="text-slate-200 font-semibold text-sm mb-3">Privacy &amp; Trust</h4>
            <p className="text-slate-400 mb-3 text-xs leading-relaxed">
              Designed strictly for seller operational efficiency. No accounts, no subscriptions, and zero document transmission.
            </p>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Supports 203 DPI &amp; 300 DPI printers</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Automated SKU sorting &amp; picklists</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Single-click invoice separation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prototype Disclaimer Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col md:flex-row justify-between items-center gap-3">
          <p>
            &copy; 2026 ShipCrop Studio. All product names, logos, and brands are property of their respective owners.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-300 underline">
              Privacy Architecture
            </Link>
            <Link href="/faq" className="hover:text-slate-300 underline">
              FAQ
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400/90 font-medium">Phase 0 Design Prototype</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
