export interface Chunk {
  id: string;
  docId: string;
  docName: string;
  text: string;
  page: number;
  section: string;
  index: number;
}

export interface Citation {
  docId: string;
  docName: string;
  passage: string;
  page: number;
  section: string;
  score: number;
}

export interface ChatResult {
  answer: string;
  status: 'answered' | 'insufficient';
  citations: Citation[];
  processingTimeMs: number;
  conflict?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'answered' | 'insufficient' | 'loading' | 'error';
  citations?: Citation[];
  processingTimeMs?: number;
  conflict?: boolean;
  error?: string;
}

export interface DocumentRecord {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'md';
  status: 'ready' | 'processing' | 'error' | 'disabled';
  enabled: boolean;
  chunkCount: number;
  sizeBytes: number;
  uploadedAt: string;
  preview: string;
  errorMessage?: string;
  isSample: boolean;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  backend: boolean;
  vectorStore: boolean;
  embeddingModel: string;
  llmModel: string;
  documentCount: number;
  chunkCount: number;
}

export interface TestCase {
  id: string;
  category: 'answerable' | 'unanswerable' | 'multi-passage' | 'vague' | 'paraphrased';
  question: string;
  expectedType: 'answered' | 'insufficient';
  expectedKeywords?: string[];
  description: string;
}

export interface TestResult {
  case: TestCase;
  answer: string;
  status: 'answered' | 'insufficient';
  citations: Citation[];
  correct: boolean;
  processingTimeMs: number;
  reason: string;
}

export interface TestReport {
  results: TestResult[];
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  ranAt: string;
  executed: boolean;
}
