'use client';

import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';
import { validatePdfFile } from '@/lib/pdf/load-pdf';

export interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxFileSizeMb?: number;
  disabled?: boolean;
}

export function FileDropzone({
  onFilesSelected,
  maxFiles = 1,
  maxFileSizeMb = 50,
  disabled = false,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setValidationError(null);

    const validFiles: File[] = [];
    const maxSizeBytes = maxFileSizeMb * 1024 * 1024;

    for (const file of Array.from(fileList)) {
      // Must have .pdf extension or application/pdf MIME type
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        setValidationError(`Only PDF documents are supported. Skipped: ${file.name}`);
        continue;
      }

      // Check header magic bytes and size
      const check = await validatePdfFile(file, maxSizeBytes);
      if (!check.isValid) {
        setValidationError(check.error || `Invalid PDF file: ${file.name}`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles.slice(0, maxFiles));
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;
    validateAndAddFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    validateAndAddFiles(e.target.files);
    // Reset file input value so re-selecting same file triggers event
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer select-none group ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          disabled={disabled}
          onChange={handleFileInputChange}
          className="hidden"
          id="pdf-file-picker"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 duration-200 ${
              isDragOver
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 shadow-xs border border-slate-200'
            }`}
          >
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              Drag &amp; drop shipping label PDF here
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              or <span className="text-blue-600 font-semibold underline">browse from your computer</span>
            </p>
          </div>

          {/* Configurable limits label */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              <FileText className="w-3 h-3 text-red-500" />
              <span>PDF documents only</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              <span>Max ~{maxFileSizeMb}MB (local browser memory)</span>
            </span>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
