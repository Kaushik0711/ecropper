'use client';

import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  formattedSize: string;
  pageCount: number;
  status: 'ready' | 'processing' | 'completed' | 'error';
  rawFile?: File;
}

export interface FileRowProps {
  item: FileItem;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function FileRow({ item, onRemove, disabled = false }: FileRowProps) {
  const statusBadge = {
    ready: <Badge variant="default" size="sm">Ready to crop</Badge>,
    processing: <Badge variant="primary" size="sm">Processing...</Badge>,
    completed: <Badge variant="success" size="sm">Ready for download</Badge>,
    error: <Badge variant="danger" size="sm">Error</Badge>,
  }[item.status];

  return (
    <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
            {item.name}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
            <span>{item.formattedSize}</span>
            <span>•</span>
            <span>~{item.pageCount} pages detected</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {statusBadge}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={disabled}
          aria-label={`Remove file ${item.name}`}
          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
