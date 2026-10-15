'use client';

import React from 'react';
import { Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/Progress';
import { JobStatus } from '@/lib/pdf/types';

export interface ProcessingStatusProps {
  status: JobStatus;
  progress?: number; // Optional genuine progress if measurable
  stageMessage: string;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export function ProcessingStatus({
  status,
  progress,
  stageMessage,
  isError = false,
  errorMessage,
  onRetry,
}: ProcessingStatusProps) {
  if (isError || status === 'failed') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-900">
            PDF Processing Error
          </h4>
          <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">
            {errorMessage || 'An error occurred during page crop embedding or output generation.'}
          </p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Retry Crop Operation
          </button>
        )}
      </div>
    );
  }

  const isIndeterminate = progress === undefined;

  return (
    <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center animate-spin">
            <Loader2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Generating Vector Output</span>
              <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 uppercase font-mono">
                {status}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              {stageMessage}
            </p>
          </div>
        </div>

        {!isIndeterminate && (
          <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {!isIndeterminate ? (
        <Progress value={progress} color="primary" />
      ) : (
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div className="h-full bg-blue-600 rounded-full animate-pulse w-2/3" />
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Local browser memory only • 0 bytes sent over network</span>
        </span>
        <span className="font-mono text-[10px] text-slate-400">
          Target: 4&times;6&quot; 288&times;432 pt
        </span>
      </div>
    </div>
  );
}
