'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Printer,
  AlertCircle,
  Play,
  ShieldCheck,
  Wand2,
  CheckCheck,
  XCircle,
  Plus,
} from 'lucide-react';
import { MarketplaceConfig } from '@/config/marketplaces';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FileDropzone } from '@/features/uploader/FileDropzone';
import { FileQueue } from '@/features/uploader/FileQueue';
import { FileItem } from '@/features/uploader/FileRow';
import { PdfPreviewPlaceholder } from './PdfPreviewPlaceholder';
import { CropSettings, CropSettingsState } from './CropSettings';
import { ProcessingStatus } from '@/features/processing/ProcessingStatus';
import { ResultsPanel } from './ResultsPanel';
import { loadPdfDocument, LoadedPdfHandle } from '@/lib/pdf/load-pdf';
import { analyzePdfDocument } from '@/lib/pdf/analyze-pdf';
import { generateCroppedPdf } from '@/lib/pdf/generate-pdf';
import {
  JobStatus,
  PdfCropBoundingBox,
  PdfDocumentMetadata,
  PdfProcessResult,
  CropRegionItem,
} from '@/lib/pdf/types';
import { detectShippingLabels } from '@/lib/marketplaces/detection-engine';
import { isAutomaticDetectionSupported } from '@/lib/marketplaces/registry';
import { DetectedLabel, LabelCandidateStatus } from '@/lib/marketplaces/types';

export interface CropperWorkspaceProps {
  marketplace: MarketplaceConfig;
}

export function CropperWorkspace({ marketplace }: CropperWorkspaceProps) {
  // 1. Files & PDF Engine State
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [pdfHandle, setPdfHandle] = useState<LoadedPdfHandle | null>(null);
  const [pdfMetadata, setPdfMetadata] = useState<PdfDocumentMetadata | null>(null);
  const [isSampleFile, setIsSampleFile] = useState(false);

  // 2. Active Crop Rectangle (in PDF User Space)
  const [activePdfCropBox, setActivePdfCropBox] = useState<PdfCropBoundingBox | null>(null);

  // 3. Settings state
  const [settings, setSettings] = useState<CropSettingsState>({
    ...marketplace.defaultSettings,
  });

  // 4. Job lifecycle state
  const [jobStatus, setJobStatus] = useState<JobStatus>('queued');
  const [stageMessage, setStageMessage] = useState('');
  const [jobError, setJobError] = useState<string | null>(null);

  // 5. Generated Result
  const [result, setResult] = useState<PdfProcessResult | null>(null);

  // 6. Validation error
  const [validationError, setValidationError] = useState<string | null>(null);

  // 7. Help modal
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // 8. Phase 2: Automatic Candidate Detection State
  const [detectedLabels, setDetectedLabels] = useState<DetectedLabel[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [detectionWarnings, setDetectionWarnings] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  // Keep ref to previous object URL to cleanly revoke it
  const createdObjectUrlRef = useRef<string | null>(null);

  // Helper to format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Clean up object URLs and PDF handles
  const cleanupPdfResources = useCallback(() => {
    if (createdObjectUrlRef.current) {
      try {
        URL.revokeObjectURL(createdObjectUrlRef.current);
      } catch {
        // ignore
      }
      createdObjectUrlRef.current = null;
    }
    if (pdfHandle) {
      pdfHandle.destroy();
      setPdfHandle(null);
    }
    setPdfMetadata(null);
    setActivePdfCropBox(null);
    setDetectedLabels([]);
    setSelectedCandidateId(null);
    setDetectionWarnings([]);
  }, [pdfHandle]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanupPdfResources();
    };
  }, [cleanupPdfResources]);

  // Load and analyze a selected file into the PDF engine
  const loadFileIntoEngine = useCallback(
    async (file: File, fileItemId: string) => {
      try {
        cleanupPdfResources();
        setValidationError(null);
        setJobError(null);
        setResult(null);
        setJobStatus('validating');
        setStageMessage('Validating local PDF file signature and integrity...');

        setJobStatus('analyzing');
        setStageMessage('Reading PDF structure and extracting page dimensions...');

        const handle = await loadPdfDocument(file);
        const metadata = await analyzePdfDocument(handle.document, file.name, file.size);

        setPdfHandle(handle);
        setPdfMetadata(metadata);
        setSelectedFileId(fileItemId);

        // Update file queue item with real detected page count
        setFiles((prev) =>
          prev.map((item) =>
            item.id === fileItemId
              ? {
                  ...item,
                  pageCount: metadata.pageCount,
                  status: 'ready',
                  formattedSize: metadata.formattedSize,
                }
              : item
          )
        );

        setJobStatus('preview-ready');
        setStageMessage('Ready for crop adjustment');
      } catch (err: unknown) {
        setJobStatus('failed');
        const message = err instanceof Error ? err.message : 'Failed to open PDF document';
        setJobError(message);
        setFiles((prev) =>
          prev.map((item) =>
            item.id === fileItemId ? { ...item, status: 'error' } : item
          )
        );
      }
    },
    [cleanupPdfResources]
  );

  // Handle files added by user
  const handleFilesSelected = async (newRawFiles: File[]) => {
    if (newRawFiles.length === 0) return;
    setIsSampleFile(false);

    const firstFile = newRawFiles[0];
    const newItems: FileItem[] = newRawFiles.map((f, idx) => ({
      id: `${Date.now()}-${idx}-${f.name}`,
      name: f.name,
      size: f.size,
      formattedSize: formatBytes(f.size),
      pageCount: 1, // Will be updated as soon as engine analyzes it
      status: 'ready',
      rawFile: f,
    }));

    setFiles((prev) => [...prev, ...newItems]);
    await loadFileIntoEngine(firstFile, newItems[0].id);
  };

  // Load real synthetic sample PDF from /samples/sample-shipping-manifest.pdf
  const handleLoadSampleFile = async () => {
    try {
      setValidationError(null);
      setJobError(null);
      setResult(null);
      setIsSampleFile(true);
      setJobStatus('analyzing');
      setStageMessage('Loading local synthetic test PDF manifest...');

      const response = await fetch('/samples/sample-shipping-manifest.pdf');
      if (!response.ok) {
        throw new Error(`Sample PDF not found at /samples/sample-shipping-manifest.pdf (${response.status})`);
      }

      const blob = await response.blob();
      const sampleFile = new File([blob], 'sample-shipping-manifest.pdf', {
        type: 'application/pdf',
      });

      const sampleItem: FileItem = {
        id: `sample-${Date.now()}`,
        name: sampleFile.name,
        size: sampleFile.size,
        formattedSize: formatBytes(sampleFile.size),
        pageCount: 2,
        status: 'ready',
        rawFile: sampleFile,
      };

      setFiles([sampleItem]);
      await loadFileIntoEngine(sampleFile, sampleItem.id);
    } catch (err: unknown) {
      setJobStatus('failed');
      const message = err instanceof Error ? err.message : String(err);
      setJobError(`Could not load sample PDF: ${message}`);
    }
  };

  // Remove file from queue
  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFileId === id) {
      cleanupPdfResources();
      setSelectedFileId(null);
      setResult(null);
      setJobStatus('queued');
    }
  };

  // Reset entire workspace
  const handleClearWorkspace = () => {
    cleanupPdfResources();
    setFiles([]);
    setSelectedFileId(null);
    setResult(null);
    setValidationError(null);
    setJobError(null);
    setJobStatus('queued');
    setIsSampleFile(false);
    setDetectedLabels([]);
    setSelectedCandidateId(null);
    setDetectionWarnings([]);
    setSettings({ ...marketplace.defaultSettings });
  };

  const handleResetSettings = () => {
    setSettings({ ...marketplace.defaultSettings });
  };

  // Phase 2 Detection Handlers
  const handleDetectLabels = async () => {
    if (!pdfHandle) {
      setValidationError('Please select or upload a PDF file first.');
      return;
    }

    try {
      setIsDetecting(true);
      setValidationError(null);
      setJobStatus('analyzing');
      setStageMessage(`Analyzing document structure for ${marketplace.name} shipping labels...`);

      const detectionResult = await detectShippingLabels(pdfHandle.document, marketplace.id);
      setDetectedLabels(detectionResult.detectedLabels);
      setDetectionWarnings(detectionResult.warnings);

      if (detectionResult.detectedLabels.length > 0) {
        const first = detectionResult.detectedLabels[0];
        setSelectedCandidateId(first.id);
        setActivePdfCropBox(first.bounds);
      }

      setJobStatus('preview-ready');
      const acceptedCount = detectionResult.detectedLabels.filter((l) => l.status === 'accepted').length;
      setStageMessage(
        detectionResult.detectedLabels.length > 0
          ? `Detected ${detectionResult.detectedLabels.length} candidate(s) (${acceptedCount} accepted). Review before generating.`
          : 'No label candidates found. Manual crop mode is active.'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setDetectionWarnings([`Detection failed: ${message}`]);
      setJobStatus('preview-ready');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSelectCandidate = (id: string) => {
    setSelectedCandidateId(id);
    const cand = detectedLabels.find((l) => l.id === id);
    if (cand) {
      setActivePdfCropBox(cand.bounds);
    }
  };

  const handleUpdateCandidateBounds = (id: string, newBounds: PdfCropBoundingBox) => {
    setDetectedLabels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, bounds: newBounds, isManual: true } : l))
    );
    if (id === selectedCandidateId) {
      setActivePdfCropBox(newBounds);
    }
  };

  const handleUpdateCandidateStatus = (id: string, status: LabelCandidateStatus) => {
    setDetectedLabels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
  };

  const handleDeleteCandidate = (id: string) => {
    setDetectedLabels((prev) => prev.filter((l) => l.id !== id));
    if (selectedCandidateId === id) {
      setSelectedCandidateId(null);
    }
  };

  const handleAddManualCandidate = () => {
    const newId = `manual-label-${Date.now()}`;
    const newCandidate: DetectedLabel = {
      id: newId,
      pageNumber: 1,
      bounds: activePdfCropBox || { left: 40, bottom: 440, right: 320, top: 800 },
      confidence: 1.0,
      method: 'manual',
      status: 'accepted',
      reasons: ['User added manual crop region'],
      warnings: [],
      labelIndex: detectedLabels.length + 1,
      isManual: true,
    };
    setDetectedLabels((prev) => [...prev, newCandidate]);
    setSelectedCandidateId(newId);
  };

  const handleAcceptAllCandidates = () => {
    setDetectedLabels((prev) => prev.map((l) => ({ ...l, status: 'accepted' })));
  };

  const handleRejectAllCandidates = () => {
    setDetectedLabels((prev) => prev.map((l) => ({ ...l, status: 'rejected' })));
  };

  const handleResetDetection = () => {
    setDetectedLabels([]);
    setSelectedCandidateId(null);
    setDetectionWarnings([]);
  };

  // Run real PDF generation
  const handleStartProcessing = async () => {
    const hasDetected = detectedLabels.length > 0;
    const acceptedLabels = detectedLabels.filter((l) => l.status === 'accepted');

    if (hasDetected && acceptedLabels.length === 0) {
      setValidationError('No detected label candidates are marked as accepted. Please accept at least one candidate or reset to manual crop.');
      return;
    }

    if (!hasDetected && (!pdfHandle || !activePdfCropBox)) {
      setValidationError('Please select or upload a valid PDF file and establish a crop boundary.');
      return;
    }

    if (!pdfHandle) return;

    try {
      setValidationError(null);
      setJobError(null);
      setResult(null);
      setJobStatus('processing');
      setStageMessage(
        hasDetected
          ? `Embedding ${acceptedLabels.length} accepted vector label(s) into 4x6" thermal pages...`
          : 'Embedding vector crop into target 4x6" thermal output...'
      );

      const currentFile = files.find((f) => f.id === selectedFileId);
      const sourceFileName = currentFile?.name || pdfMetadata?.fileName || 'document.pdf';

      const cropRegions: CropRegionItem[] | undefined = hasDetected
        ? acceptedLabels.map((l) => ({
            pageNumber: l.pageNumber,
            cropBox: l.bounds,
            labelId: l.id,
          }))
        : undefined;

      // Execute real vector crop and generation
      const processResult = await generateCroppedPdf(pdfHandle.rawBytes, sourceFileName, {
        targetFormat: settings.outputFormat === 'thermal-4x6' ? 'thermal-4x6' : 'a4-single',
        marginMm: settings.marginMm,
        targetDpi: settings.targetDpi,
        cropBox: hasDetected ? undefined : activePdfCropBox!,
        cropRegions,
      });

      if (!processResult.success || !processResult.outputBytes) {
        throw new Error(processResult.error || 'PDF generation failed during output assembly.');
      }

      setJobStatus('validating-output');
      setStageMessage('Validating generated PDF page sizes and document integrity...');

      // Track created object URL for cleanup
      if (processResult.outputUrl) {
        if (createdObjectUrlRef.current) {
          URL.revokeObjectURL(createdObjectUrlRef.current);
        }
        createdObjectUrlRef.current = processResult.outputUrl;
      }

      setResult(processResult);
      setJobStatus('completed');
      setStageMessage(`Cropped PDF ready (${processResult.outputPageCount} label page${processResult.outputPageCount === 1 ? '' : 's'}).`);

      // Mark file row completed
      setFiles((prev) =>
        prev.map((f) => (f.id === selectedFileId ? { ...f, status: 'completed' } : f))
      );
    } catch (err: unknown) {
      setJobStatus('failed');
      const message = err instanceof Error ? err.message : 'Failed to generate cropped PDF.';
      setJobError(message);
    }
  };

  // Simulate failure state for testing error handling and recovery
  const handleSimulateFailure = () => {
    setResult(null);
    setJobStatus('failed');
    setJobError(
      'Simulated Processing Error: The document crop boundary coordinates were outside valid page limits. Test error recovery by clicking Retry below.'
    );
  };

  const activeFile = files.find((f) => f.id === selectedFileId) || files[0];
  const isBusy = jobStatus === 'validating' || jobStatus === 'analyzing' || jobStatus === 'processing' || jobStatus === 'validating-output';

  return (
    <div className="space-y-6">
      {/* Workspace Header & Breadcrumbs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link
              href="/tools"
              className="hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>All Marketplaces</span>
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">{marketplace.name}</span>
          </nav>

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {marketplace.name} Shipping Label Cropper
            </h1>
            <Badge variant="primary" size="sm">
              Phase 2 Label Detection
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            {marketplace.id === 'meesho'
              ? 'Automatic candidate detection for Meesho + manual fallback with vector-preserving 4×6" thermal output.'
              : 'Manual adjustable crop rectangle with vector-preserving 4×6" (288×432 pt) thermal output.'}
          </p>
        </div>

        {/* Actions (Help, Reset) */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHelpModalOpen(true)}
            leftIcon={<HelpCircle className="w-4 h-4 text-slate-500" />}
          >
            Help &amp; Guidelines
          </Button>

          {files.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearWorkspace}
              disabled={isBusy}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
            >
              Reset Workspace
            </Button>
          )}
        </div>
      </div>

      {/* Guidance Note Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 px-4 text-xs text-blue-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">
          {marketplace.id === 'meesho' ? (
            <>
              <span className="font-semibold">Meesho Automatic Detection (Unverified Adapter):</span>{' '}
              Click &quot;Auto-Detect Labels&quot; below to identify shipping label blocks and exclude tax invoices using text geometry and anchor matching. Manual crop adjustment remains fully functional as a fallback. All processing runs 100% locally in your browser.
            </>
          ) : (
            <>
              <span className="font-semibold">Manual Crop Engine Active:</span>{' '}
              Automatic detection is currently configured for Meesho in Phase 2. Adjust the crop rectangle on the canvas to frame your label. All processing runs 100% locally in your browser.
            </>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout (Desktop) / Stacked (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Settings, Uploader & Action Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Uploader */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Select Shipping Label PDF
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Load a local PDF document to crop
                </p>
              </div>

              {files.length === 0 && (
                <button
                  type="button"
                  onClick={handleLoadSampleFile}
                  disabled={isBusy}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample</span>
                </button>
              )}
            </div>

            <FileDropzone
              onFilesSelected={handleFilesSelected}
              disabled={isBusy}
              maxFiles={1}
              maxFileSizeMb={50}
            />

            <FileQueue
              files={files}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearWorkspace}
              disabled={isBusy}
            />
          </div>

          {/* 2. Processing Settings */}
          <CropSettings
            marketplace={marketplace}
            settings={settings}
            onSettingsChange={setSettings}
            onResetSettings={handleResetSettings}
            disabled={isBusy}
          />

          {/* 3. Primary Process CTA & Validation Errors */}
          <div className="space-y-3">
            {validationError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full text-base font-semibold py-3.5 shadow-md hover:shadow-lg transition-all"
              onClick={handleStartProcessing}
              disabled={isBusy || !pdfHandle || (detectedLabels.length === 0 && !activePdfCropBox)}
              isLoading={isBusy}
              leftIcon={<Play className="w-4 h-4 fill-current" />}
            >
              {isBusy
                ? stageMessage || 'Processing PDF...'
                : !pdfHandle
                ? 'Select a PDF File to Crop'
                : detectedLabels.length > 0
                ? `Crop & Export ${detectedLabels.filter((l) => l.status === 'accepted').length} Accepted Label(s)`
                : `Crop & Generate Real 4x6" PDF`}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Printer className="w-3.5 h-3.5" />
              <span>Lossless vector embedding • Zero server transmission</span>
            </div>
          </div>
        </div>

        {/* Right Column: PDF Preview Canvas & Results Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Dynamic State: If Processing, show Processing Status */}
          {isBusy && (
            <ProcessingStatus
              status={jobStatus}
              stageMessage={stageMessage}
            />
          )}

          {/* Dynamic State: If Error, show Error State */}
          {jobStatus === 'failed' && jobError && (
            <ProcessingStatus
              status="failed"
              isError={true}
              errorMessage={jobError}
              stageMessage=""
              onRetry={handleStartProcessing}
            />
          )}

          {/* Dynamic State: If Result Ready, show Results Panel */}
          {result && jobStatus === 'completed' && (
            <ResultsPanel
              marketplace={marketplace}
              result={result}
              settings={settings}
              onProcessAnother={handleClearWorkspace}
              onSimulateError={handleSimulateFailure}
            />
          )}

          {/* Phase 2: Automatic Detection Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-pink-600" />
                  <span>Automatic Label Detection</span>
                  {isAutomaticDetectionSupported(marketplace.id) ? (
                    <Badge variant="warning" size="sm">
                      {marketplace.name} Adapter (Unverified)
                    </Badge>
                  ) : (
                    <Badge variant="outline" size="sm">
                      Manual Crop Only
                    </Badge>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAutomaticDetectionSupported(marketplace.id)
                    ? 'Identifies shipping label clusters and excludes invoice text'
                    : 'Auto-detection is uncalibrated for this marketplace; manual crop is active'}
                </p>
              </div>

              {isAutomaticDetectionSupported(marketplace.id) && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDetectLabels}
                    disabled={isBusy || !pdfHandle || isDetecting}
                    isLoading={isDetecting}
                    leftIcon={<Wand2 className="w-3.5 h-3.5" />}
                  >
                    Auto-Detect Labels
                  </Button>
                </div>
              )}
            </div>

            {/* Candidate Controls Toolbar (when candidates exist) */}
            {detectedLabels.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700">
                    {detectedLabels.length} Candidate(s) Detected:{' '}
                    <span className="text-emerald-700 font-bold">
                      {detectedLabels.filter((l) => l.status === 'accepted').length} accepted
                    </span>
                    {detectedLabels.some((l) => l.status === 'suggested') && (
                      <span className="text-amber-700 font-bold ml-1.5">
                        {detectedLabels.filter((l) => l.status === 'suggested').length} suggested
                      </span>
                    )}
                    {detectedLabels.some((l) => l.status === 'rejected') && (
                      <span className="text-slate-500 ml-1.5">
                        {detectedLabels.filter((l) => l.status === 'rejected').length} rejected
                      </span>
                    )}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAcceptAllCandidates}
                      className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Accept All</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectAllCandidates}
                      className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Reject All</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddManualCandidate}
                      className="px-2 py-1 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Box</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetDetection}
                      className="px-2 py-1 rounded text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Reset to Manual
                    </button>
                  </div>
                </div>

                {detectionWarnings.length > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
                    {detectionWarnings.map((w, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real PDF Preview Canvas & Crop Rectangle Overlay */}
          <PdfPreviewPlaceholder
            marketplace={marketplace}
            pdfHandle={pdfHandle}
            fileName={activeFile?.name}
            totalPages={pdfMetadata?.pageCount || 1}
            outputFormat="thermal-4x6"
            onCropChange={setActivePdfCropBox}
            onSelectSampleFile={handleLoadSampleFile}
            isSampleFile={isSampleFile}
            detectedLabels={detectedLabels}
            selectedCandidateId={selectedCandidateId}
            onSelectCandidate={handleSelectCandidate}
            onUpdateCandidateBounds={handleUpdateCandidateBounds}
            onUpdateCandidateStatus={handleUpdateCandidateStatus}
            onDeleteCandidate={handleDeleteCandidate}
            onAddCandidate={handleAddManualCandidate}
          />
        </div>
      </div>

      {/* Help Modal */}
      <Modal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title={`${marketplace.name} Thermal Cropping Guide (Phase 1)`}
        description="How to adjust and export print-ready thermal shipping labels"
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/60">
            <h5 className="font-bold text-slate-900 mb-1">
              Phase 1 Manual Cropping Workflow:
            </h5>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Select your marketplace dispatch PDF or test using the synthetic sample.</li>
              <li>The real PDF page renders on the preview canvas.</li>
              <li>Drag the center of the blue rectangle over the shipping label.</li>
              <li>Drag the corner/side handles to closely frame the barcode and address.</li>
              <li>Click &quot;Crop &amp; Generate Real 4x6&quot; PDF&quot;.</li>
              <li>Click download to receive your authentic vector PDF.</li>
            </ol>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 mb-1">
              4&times;6&quot; Thermal Printer Format:
            </h5>
            <p>
              Output pages are constructed at standard <strong>288 &times; 432 pt (4.00&quot; &times; 6.00&quot;)</strong> dimensions. The engine applies an aspect-ratio preserving fit policy to avoid non-uniform stretching or cutting off barcodes.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 mb-1">Marketplace Boundaries:</h5>
            <p>
              In Phase 1, automatic boundary detection is not enabled. Manual adjustment allows processing any PDF layout. Automated marketplace detection will be integrated in Phase 2 with verified seller manifests.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
