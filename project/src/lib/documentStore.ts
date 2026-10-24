import type { DocumentRecord, Chunk } from './types';
import { SAMPLE_DOCUMENTS } from './sampleDocuments';
import { splitIntoChunks } from './chunking';
import { retrievalIndex } from './retrieval';

const docStore = new Map<string, DocumentRecord>();
const chunkStore = new Map<string, Chunk[]>();

let initialized = false;

export function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  for (const sample of SAMPLE_DOCUMENTS) {
    const chunks = splitIntoChunks(sample.content, sample.id, sample.name);
    docStore.set(sample.id, {
      id: sample.id,
      name: sample.name,
      type: sample.type,
      status: 'ready',
      enabled: true,
      chunkCount: chunks.length,
      sizeBytes: new Blob([sample.content]).size,
      uploadedAt: '2024-08-01T09:00:00.000Z',
      preview: sample.content.slice(0, 280).replace(/\n{2,}/g, '\n'),
      isSample: true,
    });
    chunkStore.set(sample.id, chunks);
  }
  rebuildIndex();
}

function rebuildIndex() {
  const enabledDocIds = new Set<string>();
  const allChunks: Chunk[] = [];
  for (const [docId, doc] of docStore) {
    if (doc.enabled && doc.status === 'ready') {
      enabledDocIds.add(docId);
      const chunks = chunkStore.get(docId) ?? [];
      allChunks.push(...chunks);
    }
  }
  retrievalIndex.setChunks(allChunks, enabledDocIds);
}

export function listDocuments(): DocumentRecord[] {
  ensureInitialized();
  return Array.from(docStore.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function getDocument(id: string): DocumentRecord | null {
  ensureInitialized();
  return docStore.get(id) ?? null;
}

export function getDocumentChunks(id: string): Chunk[] {
  ensureInitialized();
  return chunkStore.get(id) ?? [];
}

const ACCEPTED_TYPES = ['pdf', 'docx', 'txt', 'md'] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function detectType(name: string): DocumentRecord['type'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'docx';
  if (ext === 'md') return 'md';
  return 'txt';
}

export interface UploadResult {
  doc: DocumentRecord;
  error?: string;
}

export async function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  ensureInitialized();

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ACCEPTED_TYPES.includes(ext as never)) {
    return {
      doc: {
        id: '',
        name: file.name,
        type: 'txt',
        status: 'error',
        enabled: false,
        chunkCount: 0,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
        preview: '',
        isSample: false,
        errorMessage: 'Unsupported file type. Only PDF, DOCX, TXT and MD are allowed.',
      },
      error: 'Unsupported file type. Only PDF, DOCX, TXT and MD are allowed.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      doc: {
        id: '',
        name: file.name,
        type: 'txt',
        status: 'error',
        enabled: false,
        chunkCount: 0,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
        preview: '',
        isSample: false,
        errorMessage: 'File too large. Maximum size is 10 MB.',
      },
      error: 'File too large. Maximum size is 10 MB.',
    };
  }

  // Simulate upload progress
  for (let i = 0; i <= 100; i += 25) {
    if (onProgress) onProgress(i);
    await new Promise((r) => setTimeout(r, 60));
  }

  const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const type = detectType(file.name);

  // For txt/md we can read directly; for pdf/docx we extract text if possible
  let content = '';
  try {
    if (type === 'txt' || type === 'md') {
      content = await file.text();
    } else {
      // PDF/DOCX: attempt to read as text (works for simple text-based files);
      // binary files will produce cleaned placeholder text.
      content = await file.text();
      if (!content || /[\x00-\x08\x0E-\x1F]/.test(content)) {
        content = '';
      }
    }
  } catch {
    content = '';
  }

  const cleaned = content
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleaned.length < 20) {
    const doc: DocumentRecord = {
      id,
      name: file.name,
      type,
      status: 'error',
      enabled: false,
      chunkCount: 0,
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
      preview: '',
      isSample: false,
      errorMessage:
        'No readable text was found in this file. For PDF and DOCX, ensure the file contains selectable text (not scanned images).',
    };
    docStore.set(id, doc);
    return { doc, error: doc.errorMessage };
  }

  const chunks = splitIntoChunks(cleaned, id, file.name);
  const doc: DocumentRecord = {
    id,
    name: file.name,
    type,
    status: 'ready',
    enabled: true,
    chunkCount: chunks.length,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    preview: cleaned.slice(0, 280).replace(/\n{2,}/g, '\n'),
    isSample: false,
  };
  docStore.set(id, doc);
  chunkStore.set(id, chunks);
  rebuildIndex();
  return { doc };
}

export function setDocumentEnabled(id: string, enabled: boolean): DocumentRecord | null {
  ensureInitialized();
  const doc = docStore.get(id);
  if (!doc) return null;
  doc.enabled = enabled;
  doc.status = enabled ? 'ready' : 'disabled';
  docStore.set(id, doc);
  rebuildIndex();
  return doc;
}

export function deleteDocument(id: string): boolean {
  ensureInitialized();
  if (!docStore.has(id)) return false;
  docStore.delete(id);
  chunkStore.delete(id);
  retrievalIndex.removeChunksForDoc(id);
  rebuildIndex();
  return true;
}

export function reindexDocument(id: string): DocumentRecord | null {
  ensureInitialized();
  const doc = docStore.get(id);
  if (!doc) return null;
  const existing = chunkStore.get(id) ?? [];
  if (existing.length > 0) {
    // Re-chunk from existing chunk text (we don't store raw content separately)
    const fullText = existing.map((c) => c.text).join('\n');
    const chunks = splitIntoChunks(fullText, id, doc.name);
    chunkStore.set(id, chunks);
    doc.chunkCount = chunks.length;
    doc.status = 'ready';
  }
  docStore.set(id, doc);
  rebuildIndex();
  return doc;
}

export function getStats() {
  ensureInitialized();
  const docs = Array.from(docStore.values());
  return {
    documentCount: docs.length,
    chunkCount: docs.reduce((sum, d) => sum + d.chunkCount, 0),
    enabledCount: docs.filter((d) => d.enabled && d.status === 'ready').length,
  };
}
