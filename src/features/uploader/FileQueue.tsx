'use client';

import React from 'react';
import { Trash2, Files } from 'lucide-react';
import { FileItem, FileRow } from './FileRow';

export interface FileQueueProps {
  files: FileItem[];
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

export function FileQueue({
  files,
  onRemoveFile,
  onClearAll,
  disabled = false,
}: FileQueueProps) {
  if (files.length === 0) return null;

  const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
        <div className="flex items-center gap-1.5">
          <Files className="w-3.5 h-3.5 text-blue-600" />
          <span>Selected Files Queue ({files.length})</span>
          <span className="text-slate-400 font-normal">
            • ~{totalPages} total pages
          </span>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          disabled={disabled}
          className="text-slate-400 hover:text-rose-600 transition-colors inline-flex items-center gap-1 disabled:opacity-40"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <FileRow
            key={file.id}
            item={file}
            onRemove={onRemoveFile}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
