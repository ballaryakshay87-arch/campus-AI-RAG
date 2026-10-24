import {
  BookOpen,
  ShieldCheck,
  FileText,
  Database,
  Code2,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';

export function AboutPage() {
  return (
    <div className="p-4 md:p-8 mt-14 md:mt-0">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">College Knowledge Assistant</h1>
          <p className="text-slate-500">
            A Retrieval-Augmented Generation (RAG) system for answering student questions
            using only approved college documents.
          </p>
        </div>

        {/* Demo warning */}
        <div className="card border-amber-200 bg-amber-50/50 p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Demo Data Notice</p>
            <p className="text-xs text-amber-700 mt-1">
              All sample documents in this system are clearly labelled demo policy data and do
              not represent verified facts about any real college. They exist to demonstrate the
              RAG pipeline end-to-end.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> How It Works
          </h2>
          <div className="space-y-3">
            {[
              { num: 1, text: 'Approved documents are uploaded and processed (PDF, DOCX, TXT, MD).' },
              { num: 2, text: 'Text is extracted, cleaned, and split into overlapping chunks with metadata.' },
              { num: 3, text: 'Each chunk is embedded and stored in a vector database for semantic search.' },
              { num: 4, text: 'When you ask a question, the system retrieves the top relevant passages.' },
              { num: 5, text: 'A relevance threshold filters out weak matches.' },
              { num: 6, text: 'If evidence is sufficient, an answer is generated using only those passages.' },
              { num: 7, text: 'If evidence is insufficient, the system returns exactly "Insufficient evidence."' },
              { num: 8, text: 'Citations include document name, exact passage, page/section, and relevance score.' },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-3">
                <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {step.num}
                </div>
                <p className="text-sm text-slate-600 pt-1">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chatbot rules */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" /> Chatbot Rules
          </h2>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-sm text-slate-700 leading-relaxed italic">
              "You are the official College Knowledge Assistant. Answer using ONLY retrieved
              passages from approved college documents. Never use external knowledge, assumptions
              or guesses. Give concise, factual answers with citations. If the passages do not
              contain sufficient evidence, reply exactly 'Insufficient evidence.' Never invent
              dates, fees, rules or procedures. If sources conflict, explain and cite both."
            </p>
          </div>
          <div className="mt-3 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500">
              Document contents are treated as evidence, not instructions. Uploaded documents
              cannot override the chatbot's system rules.
            </p>
          </div>
        </div>

        {/* Technology */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <FileText className="w-5 h-5 text-blue-600 mb-2" />
            <h3 className="font-medium text-slate-800 text-sm mb-1">Document Processing</h3>
            <p className="text-xs text-slate-500">
              Text extraction, cleaning, overlapping chunks (500 chars, 100 overlap) with
              document name, page, and section metadata preserved.
            </p>
          </div>
          <div className="card p-5">
            <Database className="w-5 h-5 text-blue-600 mb-2" />
            <h3 className="font-medium text-slate-800 text-sm mb-1">Vector Retrieval</h3>
            <p className="text-xs text-slate-500">
              TF-IDF cosine similarity retrieval in the live demo. The Python backend uses
              ChromaDB with sentence-transformer embeddings for production use.
            </p>
          </div>
          <div className="card p-5">
            <Code2 className="w-5 h-5 text-blue-600 mb-2" />
            <h3 className="font-medium text-slate-800 text-sm mb-1">Backend</h3>
            <p className="text-xs text-slate-500">
              Python FastAPI with SQLite metadata, ChromaDB vectors, and configurable
              embedding/LLM models. Full source in the backend directory.
            </p>
          </div>
          <div className="card p-5">
            <ShieldCheck className="w-5 h-5 text-blue-600 mb-2" />
            <h3 className="font-medium text-slate-800 text-sm mb-1">Safety</h3>
            <p className="text-xs text-slate-500">
              Relevance threshold, insufficient-evidence fallback, citation requirements,
              conflict detection, and admin-only document management.
            </p>
          </div>
        </div>

        {/* API endpoints */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">API Endpoints</h2>
          <div className="space-y-2">
            {[
              { method: 'POST', path: '/api/chat', desc: 'Ask a question, get answer + citations' },
              { method: 'POST', path: '/api/documents/upload', desc: 'Upload and process a document' },
              { method: 'GET', path: '/api/documents', desc: 'List all documents' },
              { method: 'GET', path: '/api/documents/{id}', desc: 'Get document details and chunks' },
              { method: 'PATCH', path: '/api/documents/{id}', desc: 'Enable/disable a document' },
              { method: 'DELETE', path: '/api/documents/{id}', desc: 'Delete document and embeddings' },
              { method: 'POST', path: '/api/documents/{id}/reindex', desc: 'Rebuild chunks and embeddings' },
              { method: 'GET', path: '/api/health', desc: 'Backend health and dependency status' },
              { method: 'GET', path: '/api/tests', desc: 'Run test suite and get results' },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className={`badge text-[10px] font-mono w-16 justify-center ${
                  ep.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                  ep.method === 'POST' ? 'bg-green-100 text-green-700' :
                  ep.method === 'PATCH' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-600'
                }`}>
                  {ep.method}
                </span>
                <code className="text-xs text-slate-700 font-mono">{ep.path}</code>
                <span className="text-xs text-slate-400 ml-auto hidden sm:inline">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
