import type {
  ChatResult,
  DocumentRecord,
  HealthStatus,
  TestReport,
  Chunk,
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
    },
  });

  let body: unknown;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  if (!res.ok) {
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as Record<string, unknown>).error)
        : `Request failed with status ${res.status}`;
    const detail =
      typeof body === 'object' && body !== null && 'detail' in body
        ? String((body as Record<string, unknown>).detail)
        : undefined;
    throw new ApiError(message, res.status, detail);
  }

  return body as T;
}

export class ApiError extends Error {
  status: number;
  detail?: string;
  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export interface ChatResponse {
  question: string;
  answer: string;
  status: 'answered' | 'insufficient';
  citations: ChatResult['citations'];
  processingTimeMs: number;
  conflict: boolean;
  systemPrompt: string;
}

export async function sendChat(question: string): Promise<ChatResponse> {
  return request<ChatResponse>('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
}

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  const data = await request<{ documents: DocumentRecord[]; count: number }>(
    '/api/documents',
  );
  return data.documents;
}

export async function fetchDocument(
  id: string,
): Promise<{ document: DocumentRecord; chunks: Chunk[] }> {
  return request<{ document: DocumentRecord; chunks: Chunk[] }>(
    `/api/documents/${encodeURIComponent(id)}`,
  );
}

export async function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ document: DocumentRecord; error?: string }> {
  // Simulate progress for the UI since fetch doesn't support upload progress
  if (onProgress) onProgress(10);
  const formData = new FormData();
  formData.append('file', file);

  const data = await request<{ document: DocumentRecord; error?: string; success?: boolean }>(
    '/api/documents/upload',
    {
      method: 'POST',
      body: formData,
    },
  );
  if (onProgress) onProgress(100);
  return data;
}

export async function patchDocument(
  id: string,
  enabled: boolean,
): Promise<DocumentRecord> {
  const data = await request<{ document: DocumentRecord }>(
    `/api/documents/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    },
  );
  return data.document;
}

export async function deleteDocument(id: string): Promise<void> {
  await request<{ success: boolean }>(
    `/api/documents/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}

export async function reindexDocument(id: string): Promise<DocumentRecord> {
  const data = await request<{ document: DocumentRecord; success: boolean }>(
    `/api/documents/${encodeURIComponent(id)}/reindex`,
    { method: 'POST' },
  );
  return data.document;
}

export async function fetchHealth(): Promise<HealthStatus> {
  return request<HealthStatus>('/api/health');
}

export async function fetchTests(): Promise<TestReport> {
  return request<TestReport>('/api/tests');
}
