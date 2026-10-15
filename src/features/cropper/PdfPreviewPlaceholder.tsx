'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Eye,
  Sparkles,
  Printer,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MarketplaceConfig } from '@/config/marketplaces';
import { LoadedPdfHandle } from '@/lib/pdf/load-pdf';
import { PdfCropBoundingBox, ViewportCropRect } from '@/lib/pdf/types';
import { viewportToPdfCrop, pdfCropToViewport, TransformableViewport } from '@/lib/pdf/coordinates';
import { CropSelectionOverlay } from './CropSelectionOverlay';
import { RenderTask, PageViewport } from 'pdfjs-dist';

import { DetectedLabel, LabelCandidateStatus } from '@/lib/marketplaces/types';

export interface PdfPreviewProps {
  marketplace: MarketplaceConfig;
  pdfHandle: LoadedPdfHandle | null;
  fileName?: string;
  totalPages?: number;
  outputFormat?: string;
  onCropChange: (crop: PdfCropBoundingBox) => void;
  onSelectSampleFile?: () => void;
  isSampleFile?: boolean;
  detectedLabels?: DetectedLabel[];
  selectedCandidateId?: string | null;
  onSelectCandidate?: (id: string) => void;
  onUpdateCandidateBounds?: (id: string, newBounds: PdfCropBoundingBox) => void;
  onUpdateCandidateStatus?: (id: string, status: LabelCandidateStatus) => void;
  onDeleteCandidate?: (id: string) => void;
  onAddCandidate?: () => void;
}

export function PdfPreviewPlaceholder({
  marketplace,
  pdfHandle,
  fileName,
  totalPages = 1,
  onCropChange,
  onSelectSampleFile,
  isSampleFile = false,
  detectedLabels,
  selectedCandidateId,
  onSelectCandidate,
  onUpdateCandidateBounds,
  onUpdateCandidateStatus,
  onDeleteCandidate,
  onAddCandidate,
}: PdfPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [renderedViewport, setRenderedViewport] = useState<TransformableViewport | null>(null);

  // Stored PDF user-space crop bounding box (independent of zoom scale)
  const [pdfCropBox, setPdfCropBox] = useState<PdfCropBoundingBox | null>(null);

  // Visual crop rectangle in current viewport canvas pixels
  const [viewportCropRect, setViewportCropRect] = useState<ViewportCropRect>({
    x: 20,
    y: 20,
    width: 280,
    height: 380,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const currentViewportRef = useRef<TransformableViewport | null>(null);

  const pageCandidates = detectedLabels?.filter((l) => l.pageNumber === currentPage);
  const hasDetectedOnThisPage = Boolean(pageCandidates && pageCandidates.length > 0);
  const acceptedOnThisPage = pageCandidates?.filter((c) => c.status === 'accepted').length || 0;

  // Handle rendering of the current page onto the canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfHandle || !canvasRef.current) return;

    try {
      // Cancel any ongoing rendering task to prevent canvas collision
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore cancel error
        }
        renderTaskRef.current = null;
      }

      const page = await pdfHandle.document.getPage(currentPage);
      const viewport: PageViewport = page.getViewport({ scale: zoomScale });
      currentViewportRef.current = viewport;

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Handle high-DPI displays cleanly
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const renderContext = {
        canvasContext: context,
        viewport,
        canvas,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;

      await task.promise;
      renderTaskRef.current = null;
      setIsRendering(false);
      setRenderError(null);

      const w = Math.floor(viewport.width);
      const h = Math.floor(viewport.height);
      setCanvasDimensions({ width: w, height: h });
      setRenderedViewport(viewport);

      // If we already have a stored PDF crop box, recalculate viewport crop rect for this zoom scale
      if (pdfCropBox) {
        const recomputedViewportRect = pdfCropToViewport(pdfCropBox, viewport);
        setViewportCropRect(recomputedViewportRect);
      } else {
        // Initialize default crop box (approx 4x6" aspect ratio, centered in upper half of page)
        const initialW = Math.min(w * 0.85, 300 * zoomScale);
        const initialH = Math.min(h * 0.75, initialW * 1.4);
        const initialX = Math.max(10, Math.floor((w - initialW) / 2));
        const initialY = Math.max(15, Math.floor(h * 0.05));

        const initialRect = {
          x: initialX,
          y: initialY,
          width: initialW,
          height: initialH,
        };
        setViewportCropRect(initialRect);

        // Convert to PDF user space and notify parent
        const convertedPdfBox = viewportToPdfCrop(initialRect, viewport);
        setPdfCropBox(convertedPdfBox);
        onCropChange(convertedPdfBox);
      }
    } catch (err: unknown) {
      const errorObj = err as { name?: string; message?: string };
      if (errorObj?.name === 'RenderingCancelledException') {
        // Normal cancellation when switching pages rapidly
        return;
      }
      setIsRendering(false);
      setRenderError(`Failed to render page ${currentPage}: ${errorObj?.message || String(err)}`);
    }
  }, [pdfHandle, currentPage, zoomScale, pdfCropBox, onCropChange]);

  useEffect(() => {
    let cancelled = false;
    if (pdfHandle) {
      // Schedule render in microtask to avoid synchronous render execution during mount
      queueMicrotask(() => {
        if (!cancelled) {
          setIsRendering(true);
          renderCurrentPage().catch((e) => {
            if (!cancelled) {
              console.error('Error rendering page:', e);
            }
          });
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [pdfHandle, currentPage, zoomScale, renderCurrentPage]);

  // Handle crop rectangle adjustment by user
  const handleCropChange = (newViewportRect: ViewportCropRect) => {
    setViewportCropRect(newViewportRect);

    if (currentViewportRef.current) {
      const convertedPdfBox = viewportToPdfCrop(newViewportRect, currentViewportRef.current);
      setPdfCropBox(convertedPdfBox);
      onCropChange(convertedPdfBox);
    }
  };

  // Reset crop to default
  const handleResetCrop = () => {
    if (canvasDimensions.width > 0 && currentViewportRef.current) {
      const w = canvasDimensions.width;
      const h = canvasDimensions.height;
      const initialW = Math.min(w * 0.85, 300 * zoomScale);
      const initialH = Math.min(h * 0.75, initialW * 1.4);
      const initialX = Math.max(10, Math.floor((w - initialW) / 2));
      const initialY = Math.max(15, Math.floor(h * 0.05));

      const rect = { x: initialX, y: initialY, width: initialW, height: initialH };
      setViewportCropRect(rect);
      const converted = viewportToPdfCrop(rect, currentViewportRef.current);
      setPdfCropBox(converted);
      onCropChange(converted);
    }
  };

  const handleZoomIn = () => setZoomScale((s) => Math.min(parseFloat((s + 0.2).toFixed(2)), 2.0));
  const handleZoomOut = () => setZoomScale((s) => Math.max(parseFloat((s - 0.2).toFixed(2)), 0.6));
  const handleResetZoom = () => setZoomScale(1.0);

  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Top Preview Toolbar */}
      <div className="p-3 px-4 border-b border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Document info */}
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">
            {marketplace.name} Preview
          </Badge>
          {pdfHandle ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-slate-700 font-semibold truncate max-w-[180px]">
                {fileName || 'Document.pdf'}
              </span>
              {isSampleFile && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                  Sample
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">No document loaded</span>
          )}
        </div>

        {/* Center: Page Navigation */}
        {pdfHandle && totalPages > 1 && (
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || isRendering}
              aria-label="Previous page"
              className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-slate-700 text-xs min-w-[65px] text-center select-none">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || isRendering}
              aria-label="Next page"
              className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Zoom & Reset Crop Controls */}
        <div className="flex items-center gap-2">
          {pdfHandle && (
            <button
              onClick={handleResetCrop}
              className="px-2 py-1 rounded-lg font-medium border text-[11px] bg-white text-slate-600 border-slate-200 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              title="Reset crop selection to default"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span className="hidden sm:inline">Reset Crop</span>
            </button>
          )}

          <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={handleZoomOut}
              disabled={!pdfHandle || zoomScale <= 0.6 || isRendering}
              aria-label="Zoom out"
              className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 hover:bg-slate-100 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold text-slate-600 w-11 text-center select-none font-mono">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={!pdfHandle || zoomScale >= 2.0 || isRendering}
              aria-label="Zoom in"
              className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 hover:bg-slate-100 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              disabled={!pdfHandle || zoomScale === 1.0}
              aria-label="Reset zoom"
              title="Fit to 100%"
              className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 hover:bg-slate-100 border-l border-slate-100 ml-0.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 bg-slate-100/90 p-4 sm:p-6 overflow-auto flex items-center justify-center min-h-[420px] sm:min-h-[520px]">
        {pdfHandle ? (
          <div className="relative inline-block shadow-xl rounded-sm border border-slate-300 bg-white">
            {/* Canvas Rendering PDF Page */}
            <canvas ref={canvasRef} className="block select-none" />

            {/* Interactive Crop Selection Overlay */}
            {canvasDimensions.width > 0 && !isRendering && (
              <CropSelectionOverlay
                canvasWidth={canvasDimensions.width}
                canvasHeight={canvasDimensions.height}
                viewport={renderedViewport || undefined}
                candidates={pageCandidates}
                selectedCandidateId={selectedCandidateId}
                onSelectCandidate={onSelectCandidate}
                onUpdateCandidateBounds={onUpdateCandidateBounds}
                onUpdateCandidateStatus={onUpdateCandidateStatus}
                onDeleteCandidate={onDeleteCandidate}
                onAddManualCrop={onAddCandidate}
                cropRect={viewportCropRect}
                onChange={handleCropChange}
                disabled={isRendering}
              />
            )}

            {/* Loading Spinner during render */}
            {isRendering && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 z-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-700">
                  Rendering PDF Page {currentPage}...
                </span>
              </div>
            )}

            {/* Render Error Alert */}
            {renderError && (
              <div className="absolute inset-x-4 top-4 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs flex items-center gap-2 z-30">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{renderError}</span>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center p-8 max-w-md space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 text-slate-400 mx-auto flex items-center justify-center shadow-xs">
              <FileSearch className="w-8 h-8 text-blue-600/70" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-800">
                Real PDF Preview Canvas
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Drag and drop a PDF manifest above to view authentic document pages, inspect barcodes, and adjust the 4&times;6&quot; thermal crop rectangle.
              </p>
            </div>
            {onSelectSampleFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectSampleFile}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-600" />}
              >
                Load Synthetic Sample PDF
              </Button>
            )}
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <Printer className="w-3.5 h-3.5" />
              <span>Vector-preserving 4&times;6&quot; (288&times;432 pt) thermal embedding</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="p-2.5 px-4 bg-white border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-blue-500" />
          <span>
            {hasDetectedOnThisPage
              ? `Found ${pageCandidates!.length} candidate label(s) on Page ${currentPage} (${acceptedOnThisPage} accepted)`
              : pdfHandle
              ? 'Drag center to move crop box; drag corners/edges to resize'
              : 'Interactive Canvas (Phase 1 Real PDF Engine)'}
          </span>
        </span>
        {pdfCropBox && (
          <span className="text-slate-600 font-mono text-[10px] font-medium">
            Crop: {(pdfCropBox.right - pdfCropBox.left).toFixed(0)} &times; {(pdfCropBox.top - pdfCropBox.bottom).toFixed(0)} pt
            {' '}({(((pdfCropBox.right - pdfCropBox.left) * 25.4) / 72).toFixed(1)} &times; {(((pdfCropBox.top - pdfCropBox.bottom) * 25.4) / 72).toFixed(1)} mm)
          </span>
        )}
      </div>
    </div>
  );
}
