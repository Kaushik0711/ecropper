import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePdfFile, MAX_PDF_SIZE_BYTES } from '../src/lib/pdf/load-pdf';

// Helper to create mock browser File object in Node.js
function createMockFile(name: string, content: string | Uint8Array, type: string = 'application/pdf'): File {
  const blobPart = typeof content === 'string' ? content : new Uint8Array(content);
  return new File([blobPart], name, { type });
}

describe('PDF File Validation Engine', () => {
  it('should validate a genuine PDF header (%PDF-1.7)', async () => {
    const validPdfHeader = '%PDF-1.7\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog >>\nendobj';
    const mockFile = createMockFile('order_labels.pdf', validPdfHeader);

    const result = await validatePdfFile(mockFile);
    assert.equal(result.isValid, true);
    assert.equal(result.error, undefined);
    assert.equal(result.fileSizeBytes, mockFile.size);
  });

  it('should reject an empty file (0 bytes)', async () => {
    const emptyFile = createMockFile('empty.pdf', '');
    const result = await validatePdfFile(emptyFile);

    assert.equal(result.isValid, false);
    assert.match(result.error || '', /empty \(0 bytes\)/i);
  });

  it('should reject a non-PDF file disguised with .pdf extension', async () => {
    const fakeFile = createMockFile('invoice.pdf', '<!DOCTYPE html><html><body>Invoice</body></html>', 'text/html');
    const result = await validatePdfFile(fakeFile);

    assert.equal(result.isValid, false);
    assert.match(result.error || '', /does not contain standard PDF signature \(%PDF-\)/i);
  });

  it('should reject files exceeding the maximum file size limit', async () => {
    // Test custom small limit for predictable testing (e.g. 500 bytes)
    const customLimit = 200;
    const largeContent = '%PDF-1.4\n' + 'X'.repeat(500);
    const mockLargeFile = createMockFile('oversized.pdf', largeContent);

    const result = await validatePdfFile(mockLargeFile, customLimit);
    assert.equal(result.isValid, false);
    assert.match(result.error || '', /exceeds maximum allowed limit/i);
  });

  it('should validate files that are safely within the default 50MB limit', async () => {
    const content = '%PDF-1.5\n' + '0'.repeat(1024);
    const mockFile = createMockFile('normal.pdf', content);

    const result = await validatePdfFile(mockFile, MAX_PDF_SIZE_BYTES);
    assert.equal(result.isValid, true);
    assert.equal(result.fileSizeBytes, mockFile.size);
  });
});
