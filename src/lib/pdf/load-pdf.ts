import * as pdfjsLib from 'pdfjs-dist';
import { ValidationResult } from './types';

// Maximum supported size in bytes (50MB by default, configurable)
export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024;

let isWorkerConfigured = false;

/**
 * Configure PDF.js worker in the browser environment.
 * Uses local, zero-network public worker script matching the installed pdfjs-dist version.
 */
export function configurePdfJsWorker(): void {
  if (typeof window === 'undefined') return;
  if (!isWorkerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    isWorkerConfigured = true;
  }
}

/**
 * Validate raw file header for PDF signature (%PDF-) and file size.
 */
export async function validatePdfFile(file: File, maxSizeBytes: number = MAX_PDF_SIZE_BYTES): Promise<ValidationResult> {
  if (!file) {
    return { isValid: false, error: 'No file provided.' };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'The selected file is empty (0 bytes).' };
  }

  if (file.size > maxSizeBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      isValid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit (${maxMb} MB).`,
      fileSizeBytes: file.size,
    };
  }

  // Check magic number (%PDF-) in first 1024 bytes
  try {
    const slice = file.slice(0, 1024);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const headerString = new TextDecoder('ascii').decode(bytes);

    if (!headerString.includes('%PDF-')) {
      return {
        isValid: false,
        error: 'Invalid file format: File header does not contain standard PDF signature (%PDF-).',
        fileSizeBytes: file.size,
      };
    }
  } catch (err) {
    return {
      isValid: false,
      error: `Failed to read file signature: ${err instanceof Error ? err.message : String(err)}`,
      fileSizeBytes: file.size,
    };
  }

  return { isValid: true, fileSizeBytes: file.size };
}

export interface LoadedPdfHandle {
  document: pdfjsLib.PDFDocumentProxy;
  rawBytes: Uint8Array;
  destroy: () => void;
}

/**
 * Loads a PDF document locally into browser memory using PDF.js.
 * Strictly browser-only; zero network requests.
 */
export async function loadPdfDocument(file: File): Promise<LoadedPdfHandle> {
  configurePdfJsWorker();

  const validation = await validatePdfFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid PDF file');
  }

  // Read file bytes once
  const arrayBuffer = await file.arrayBuffer();
  const rawBytes = new Uint8Array(arrayBuffer);

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: rawBytes,
      cMapUrl: undefined,
      cMapPacked: true,
      stopAtErrors: false,
    });

    const document = await loadingTask.promise;

    return {
      document,
      rawBytes,
      destroy: () => {
        try {
          const docObj = document as unknown as Record<string, () => void>;
          if (typeof docObj.cleanup === 'function') {
            docObj.cleanup();
          }
          const taskObj = loadingTask as unknown as Record<string, () => void>;
          if (typeof taskObj.destroy === 'function') {
            taskObj.destroy();
          }
        } catch {
          // ignore cleanup errors on destroyed instances
        }
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes('password') || message.toLowerCase().includes('encrypted')) {
      throw new Error('Encrypted or password-protected PDFs are not currently supported. Please remove the password and try again.');
    }
    throw new Error(`Failed to parse PDF document: ${message}`);
  }
}
