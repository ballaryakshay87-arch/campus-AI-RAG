import type {
  ChatResult,
  ChatMessage,
  DocumentRecord,
  HealthStatus,
  TestReport,
  Chunk,
} from './types';
import { answerQuestion, getSystemPrompt } from './retrieval';
import {
  listDocuments,
  getDocument,
  getDocumentChunks,
  uploadDocument,
  setDocumentEnabled,
  deleteDocument,
  reindexDocument,
  getStats,
} from './documentStore';
import { runTests } from './testSuite';

export interface ChatRequest {
  question: string;
  history?: ChatMessage[];
}

export interface ApiError {
  error: string;
  detail?: string;
}

function json(body: unknown, status = 200): [unknown, number] {
  return [body, status];
}

function errorResponse(message: string, detail?: string, status = 400): [unknown, number] {
  return [json({ error: message, detail }, status)[0], status];
}

export async function handleChat(req: ChatRequest): Promise<[unknown, number]> {
  if (!req || typeof req.question !== 'string' || req.question.trim().length === 0) {
    return errorResponse('Validation failed', 'The "question" field is required and must be non-empty.', 422);
  }
  if (req.question.length > 2000) {
    return errorResponse('Validation failed', 'Question is too long (max 2000 characters).', 422);
  }

  const result: ChatResult = answerQuestion(req.question.trim());

  return json({
    question: req.question.trim(),
    answer: result.answer,
    status: result.status,
    citations: result.citations,
    processingTimeMs: result.processingTimeMs,
    conflict: result.conflict ?? false,
    systemPrompt: getSystemPrompt(),
  });
}

export async function handleListDocuments(): Promise<[unknown, number]> {
  const docs = listDocuments();
  return json({ documents: docs, count: docs.length });
}

export async function handleGetDocument(id: string): Promise<[unknown, number]> {
  const doc = getDocument(id);
  if (!doc) return errorResponse('Not found', `No document with id "${id}" was found.`, 404);
  const chunks = getDocumentChunks(id);
  return json({ document: doc, chunks });
}

export async function handleUploadDocument(
  file: File | undefined,
  onProgress?: (pct: number) => void,
): Promise<[unknown, number]> {
  if (!file) return errorResponse('Validation failed', 'No file was provided in the upload.', 422);

  const { doc, error } = await uploadDocument(file, onProgress);
  if (error) {
    return json({ document: doc, error }, 422);
  }
  return json({ document: doc, success: true }, 201);
}

export async function handlePatchDocument(
  id: string,
  body: { enabled?: boolean },
): Promise<[unknown, number]> {
  const doc = getDocument(id);
  if (!doc) return errorResponse('Not found', `No document with id "${id}" was found.`, 404);
  if (typeof body.enabled !== 'boolean') {
    return errorResponse('Validation failed', 'The "enabled" field must be a boolean.', 422);
  }
  const updated = setDocumentEnabled(id, body.enabled);
  return json({ document: updated });
}

export async function handleDeleteDocument(id: string): Promise<[unknown, number]> {
  const doc = getDocument(id);
  if (!doc) return errorResponse('Not found', `No document with id "${id}" was found.`, 404);
  deleteDocument(id);
  return json({ success: true, id });
}

export async function handleReindexDocument(id: string): Promise<[unknown, number]> {
  const doc = getDocument(id);
  if (!doc) return errorResponse('Not found', `No document with id "${id}" was found.`, 404);
  const updated = reindexDocument(id);
  return json({ document: updated, success: true });
}

export async function handleHealth(): Promise<[unknown, number]> {
  const stats = getStats();
  const health: HealthStatus = {
    status: 'healthy',
    backend: true,
    vectorStore: true,
    embeddingModel: 'tfidf-cosine (browser fallback)',
    llmModel: 'extractive-passage-selector (browser fallback)',
    documentCount: stats.documentCount,
    chunkCount: stats.chunkCount,
  };
  return json(health);
}

export async function handleGetTests(): Promise<[unknown, number]> {
  const report: TestReport = runTests();
  return json(report);
}

export function handleCors(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Type re-export for the middleware
export type { Chunk };
