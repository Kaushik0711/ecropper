'use client';

import React, { useRef, useCallback } from 'react';
import { ViewportCropRect, PdfCropBoundingBox } from '@/lib/pdf/types';
import {
  clampViewportRect,
  pdfCropToViewport,
  viewportToPdfCrop,
  TransformableViewport,
} from '@/lib/pdf/coordinates';
import { DetectedLabel, LabelCandidateStatus } from '@/lib/marketplaces/types';
import { Check, X, Plus, Trash2 } from 'lucide-react';

export interface CropSelectionOverlayProps {
  canvasWidth: number;
  canvasHeight: number;
  viewport?: TransformableViewport;
  // Multi-candidate mode (Phase 2):
  candidates?: DetectedLabel[];
  selectedCandidateId?: string | null;
  onSelectCandidate?: (id: string) => void;
  onUpdateCandidateBounds?: (id: string, newBounds: PdfCropBoundingBox) => void;
  onUpdateCandidateStatus?: (id: string, status: LabelCandidateStatus) => void;
  onDeleteCandidate?: (id: string) => void;
  onAddManualCrop?: () => void;
  // Fallback single-crop mode (Phase 1):
  cropRect?: ViewportCropRect;
  onChange?: (rect: ViewportCropRect) => void;
  disabled?: boolean;
}

type HandleType = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const MIN_CROP_DIMENSION = 30; // Minimum visual crop dimension in pixels

export function CropSelectionOverlay({
  canvasWidth,
  canvasHeight,
  viewport,
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  onUpdateCandidateBounds,
  onUpdateCandidateStatus,
  onDeleteCandidate,
  onAddManualCrop,
  cropRect,
  onChange,
  disabled = false,
}: CropSelectionOverlayProps) {
  const isDraggingRef = useRef(false);
  const activeHandleRef = useRef<HandleType | null>(null);
  const dragTargetIdRef = useRef<string | null>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initialRect: ViewportCropRect }>({
    startX: 0,
    startY: 0,
    initialRect: { x: 0, y: 0, width: 0, height: 0 },
  });

  const isMultiMode = Boolean(candidates && candidates.length > 0 && viewport);

  // Find active candidate in multi-mode
  const activeCandidate = isMultiMode
    ? candidates?.find((c) => c.id === selectedCandidateId) || candidates?.[0]
    : null;

  // Active visual rect
  const activeVisualRect: ViewportCropRect = React.useMemo(() => {
    if (isMultiMode && activeCandidate && viewport) {
      return pdfCropToViewport(activeCandidate.bounds, viewport);
    }
    return cropRect || { x: 40, y: 40, width: 280, height: 380 };
  }, [isMultiMode, activeCandidate, viewport, cropRect]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, handle: HandleType, candidateId?: string) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = true;
      activeHandleRef.current = handle;
      dragTargetIdRef.current = candidateId || null;

      if (candidateId && onSelectCandidate) {
        onSelectCandidate(candidateId);
      }

      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialRect: { ...activeVisualRect },
      };

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [disabled, activeVisualRect, onSelectCandidate]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !activeHandleRef.current || disabled) return;

      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;
      const { initialRect } = dragStartRef.current;
      const handle = activeHandleRef.current;

      let newX = initialRect.x;
      let newY = initialRect.y;
      let newW = initialRect.width;
      let newH = initialRect.height;

      if (handle === 'move') {
        newX = initialRect.x + deltaX;
        newY = initialRect.y + deltaY;
      } else {
        if (handle.includes('e')) {
          newW = Math.max(MIN_CROP_DIMENSION, initialRect.width + deltaX);
        }
        if (handle.includes('s')) {
          newH = Math.max(MIN_CROP_DIMENSION, initialRect.height + deltaY);
        }
        if (handle.includes('w')) {
          const maxDeltaW = initialRect.width - MIN_CROP_DIMENSION;
          const clampedDeltaX = Math.min(maxDeltaW, deltaX);
          newX = initialRect.x + clampedDeltaX;
          newW = initialRect.width - clampedDeltaX;
        }
        if (handle.includes('n')) {
          const maxDeltaH = initialRect.height - MIN_CROP_DIMENSION;
          const clampedDeltaY = Math.min(maxDeltaH, deltaY);
          newY = initialRect.y + clampedDeltaY;
          newH = initialRect.height - clampedDeltaY;
        }
      }

      const clamped = clampViewportRect(
        { x: newX, y: newY, width: newW, height: newH },
        canvasWidth,
        canvasHeight,
        MIN_CROP_DIMENSION
      );

      if (isMultiMode && activeCandidate && viewport && onUpdateCandidateBounds) {
        const newPdfBounds = viewportToPdfCrop(clamped, viewport);
        onUpdateCandidateBounds(activeCandidate.id, newPdfBounds);
      } else if (onChange) {
        onChange(clamped);
      }
    },
    [
      canvasWidth,
      canvasHeight,
      disabled,
      isMultiMode,
      activeCandidate,
      viewport,
      onUpdateCandidateBounds,
      onChange,
    ]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    activeHandleRef.current = null;
    dragTargetIdRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div
      className="absolute inset-0 select-none overflow-hidden"
      style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Top action toolbar for multi-label mode */}
      {isMultiMode && onAddManualCrop && (
        <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-xs px-2 py-1 rounded-md text-white text-xs shadow-md">
          <button
            type="button"
            onClick={onAddManualCrop}
            className="flex items-center gap-1 hover:text-blue-300 transition-colors cursor-pointer"
            title="Add a custom crop box on this page"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Label Box</span>
          </button>
        </div>
      )}

      {/* Render Single Mode Dimming Masks */}
      {!isMultiMode && (
        <>
          <div
            className="absolute bg-slate-900/40 pointer-events-none transition-all duration-75"
            style={{
              top: 0,
              left: 0,
              width: `${canvasWidth}px`,
              height: `${Math.max(0, activeVisualRect.y)}px`,
            }}
          />
          <div
            className="absolute bg-slate-900/40 pointer-events-none transition-all duration-75"
            style={{
              top: `${Math.min(canvasHeight, activeVisualRect.y + activeVisualRect.height)}px`,
              left: 0,
              width: `${canvasWidth}px`,
              height: `${Math.max(0, canvasHeight - (activeVisualRect.y + activeVisualRect.height))}px`,
            }}
          />
          <div
            className="absolute bg-slate-900/40 pointer-events-none transition-all duration-75"
            style={{
              top: `${activeVisualRect.y}px`,
              left: 0,
              width: `${Math.max(0, activeVisualRect.x)}px`,
              height: `${activeVisualRect.height}px`,
            }}
          />
          <div
            className="absolute bg-slate-900/40 pointer-events-none transition-all duration-75"
            style={{
              top: `${activeVisualRect.y}px`,
              left: `${Math.min(canvasWidth, activeVisualRect.x + activeVisualRect.width)}px`,
              width: `${Math.max(0, canvasWidth - (activeVisualRect.x + activeVisualRect.width))}px`,
              height: `${activeVisualRect.height}px`,
            }}
          />
        </>
      )}

      {/* MULTI-MODE: Render all other candidates first */}
      {isMultiMode &&
        viewport &&
        candidates?.map((cand) => {
          if (cand.id === activeCandidate?.id) return null; // active rendered separately with handles
          const vRect = pdfCropToViewport(cand.bounds, viewport);

          const statusStyles =
            cand.status === 'accepted'
              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-900 hover:bg-emerald-500/25'
              : cand.status === 'rejected'
              ? 'border-slate-400 bg-slate-500/10 text-slate-500 opacity-60 line-through'
              : 'border-amber-500 bg-amber-500/15 text-amber-900 border-dashed hover:bg-amber-500/25';

          return (
            <div
              key={cand.id}
              className={`absolute border-2 rounded-sm cursor-pointer transition-colors shadow-xs ${statusStyles}`}
              style={{
                left: `${vRect.x}px`,
                top: `${vRect.y}px`,
                width: `${vRect.width}px`,
                height: `${vRect.height}px`,
              }}
              onClick={() => onSelectCandidate && onSelectCandidate(cand.id)}
            >
              <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-xs font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                <span>#{cand.labelIndex}</span>
                <span className="capitalize">{cand.status}</span>
              </div>
            </div>
          );
        })}

      {/* Active / Single Selection Box */}
      <div
        className={`absolute border-2 rounded-sm shadow-md transition-all duration-75 ${
          isMultiMode
            ? activeCandidate?.status === 'accepted'
              ? 'border-emerald-600 bg-emerald-500/10'
              : activeCandidate?.status === 'rejected'
              ? 'border-slate-500 bg-slate-500/10'
              : 'border-blue-600 bg-blue-500/10'
            : 'border-blue-500'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-move'}`}
        style={{
          left: `${activeVisualRect.x}px`,
          top: `${activeVisualRect.y}px`,
          width: `${activeVisualRect.width}px`,
          height: `${activeVisualRect.height}px`,
        }}
        onPointerDown={(e) => handlePointerDown(e, 'move', activeCandidate?.id)}
      >
        {/* Rule of Thirds grid */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/30">
          <div className="border-r border-b border-white/20" />
          <div className="border-r border-b border-white/20" />
          <div className="border-b border-white/20" />
          <div className="border-r border-b border-white/20" />
          <div className="border-r border-b border-white/20" />
          <div className="border-b border-white/20" />
          <div className="border-r border-b border-white/20" />
          <div className="border-r border-b border-white/20" />
          <div />
        </div>

        {/* Multi-candidate Badge with Quick Actions */}
        {isMultiMode && activeCandidate && (
          <div className="absolute -top-7 left-0 bg-slate-900 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-2 select-none z-20">
            <span>Label #{activeCandidate.labelIndex}</span>
            <span className="text-slate-300">
              {Math.round(activeCandidate.confidence * 100)}%
            </span>

            {/* Accept / Reject Toggle Button */}
            {onUpdateCandidateStatus && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateCandidateStatus(
                    activeCandidate.id,
                    activeCandidate.status === 'accepted' ? 'rejected' : 'accepted'
                  );
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5 cursor-pointer ${
                  activeCandidate.status === 'accepted'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : activeCandidate.status === 'rejected'
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                {activeCandidate.status === 'accepted' ? (
                  <>
                    <Check className="w-2.5 h-2.5" />
                    <span>Accepted</span>
                  </>
                ) : activeCandidate.status === 'rejected' ? (
                  <>
                    <X className="w-2.5 h-2.5" />
                    <span>Rejected</span>
                  </>
                ) : (
                  <span>Accept</span>
                )}
              </button>
            )}

            {/* Delete button */}
            {onDeleteCandidate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCandidate(activeCandidate.id);
                }}
                className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Remove this candidate"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )}

        {/* Single Mode Badge */}
        {!isMultiMode && (
          <div className="absolute -top-7 left-0 bg-blue-600 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 pointer-events-none select-none">
            <span>Manual Crop Region</span>
          </div>
        )}

        {/* 8 Resize Handles */}
        <div
          className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs shadow-xs cursor-nwse-resize z-10"
          onPointerDown={(e) => handlePointerDown(e, 'nw', activeCandidate?.id)}
        />
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-white border-2 border-blue-600 rounded-xs shadow-xs cursor-ns-resize z-10"
          onPointerDown={(e) => handlePointerDown(e, 'n', activeCandidate?.id)}
        />
        <div
          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs shadow-xs cursor-nesw-resize z-10"
          onPointerDown={(e) => handlePointerDown(e, 'ne', activeCandidate?.id)}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2.5 h-4 bg-white border-2 border-blue-600 rounded-xs shadow-xs cursor-ew-resize z-10"
          onPointerDown={(e) => handlePointerDown(e, 'e', activeCandidate?.id)}
        />
        <div
          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs shadow-xs cursor-nwse-resize z-10"
          onPointerDown={(e) => handlePointerDown(e, 'se', activeCandidate?.id)}
        />
        <div
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-white border-2 border-blue-600 rounded-xs shadow-xs cursor-ns-resize z-10"
          onPointerDown={(e) => handlePointerDown(e, 's', activeCandidate?.id)}
        />
        <div
          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs shadow-xs cursor-nesw-resize z-10"
          onPointerDown={(e) => handlePointerDown(e, 'sw', activeCandidate?.id)}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2.5 h-4 bg-white border-2 border-blue-600 rounded-xs shadow-xs cursor-ew-resize z-10"
          onPointerDown={(e) => handlePointerDown(e, 'w', activeCandidate?.id)}
        />
      </div>
    </div>
  );
}
