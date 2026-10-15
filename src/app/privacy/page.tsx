import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, EyeOff, ServerOff, Cpu, AlertTriangle, ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Privacy & Architecture | ShipCrop Studio',
  description: 'Understand ShipCrop’s browser-only architecture and zero-upload client-side security model.',
};

export default function PrivacyPage() {
  return (
    <AppShell>
      {/* Header */}
      <div className="bg-white border-b border-slate-200/80 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Client-Side Privacy Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Your Documents Never Leave Your Device
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Shipping manifests contain sensitive customer addresses, phone numbers, and invoice amounts. ShipCrop is architected from day one to operate exclusively in local browser memory.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Important Distinction Banner */}
        <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-5 text-xs text-amber-950 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1.5 leading-relaxed">
            <h4 className="font-bold text-sm text-amber-900">
              Prototype Phase &amp; Security Status Notice
            </h4>
            <p>
              This web application is currently an interactive design prototype (Phase 0). We clearly distinguish planned production behavior from our current prototype:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-900">
              <li>
                <strong>Current Prototype Behavior:</strong> Files selected in this prototype are processed entirely through simulated mock interactions in your browser window. Zero network requests transmit document bytes.
              </li>
              <li>
                <strong>Production Phase 1 Goal:</strong> Real PDF cropping will use WebAssembly/Web Workers in client-side memory without ever contacting a backend API.
              </li>
              <li>
                <strong>Audit Transparency:</strong> The application has <em>not</em> yet undergone formal third-party security audits.
              </li>
            </ul>
          </div>
        </div>

        {/* 4 Pillars of Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ServerOff className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              Zero Server Uploads
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unlike cloud-based PDF converter websites, your documents are not sent to any remote server, proxy, or cloud storage bucket.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              Local Browser Execution
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              PDF manipulation executes directly within your device&apos;s browser thread and WebAssembly sandbox, utilizing your computer&apos;s local CPU.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              No Persistent Storage
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Selected files and extracted label objects are cleared from browser memory when you close the tab, reset the workspace, or refresh the page.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              No Mandatory Accounts
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No email registration, password, or cookies are required to process labels. We do not track seller identity or order volume.
            </p>
          </div>
        </div>

        {/* Section: How to verify yourself */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">
            How Technical Users Can Verify Zero Network Transmission
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            You can verify our zero-upload guarantee at any time using your browser&apos;s built-in developer tools:
          </p>
          <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-2">
            <li>Open Chrome Developer Tools (<kbd className="bg-slate-100 px-1.5 py-0.5 rounded border text-[10px] font-mono">F12</kbd> or <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border text-[10px] font-mono">Cmd + Option + I</kbd>).</li>
            <li>Switch to the <strong>Network</strong> tab.</li>
            <li>Select or upload any PDF document and trigger the crop action.</li>
            <li>Observe that no HTTP POST, PUT, or WebSocket frames are sent with document payload data.</li>
          </ol>
        </section>

        {/* Action button */}
        <div className="text-center pt-4">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-xs transition-colors"
          >
            <span>Proceed to Marketplace Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
