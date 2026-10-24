import { useState } from 'react';
import type { ChatMessage, Citation } from '@/lib/types';
import { sendChat, ApiError } from '@/lib/api';
import {
  Send,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Lightbulb,
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What is the grading system used by the college?',
  'How many credits are required to graduate?',
  'What is the minimum attendance for exams?',
  'What is the annual tuition fee for engineering?',
  'What CGPA is needed for merit scholarship?',
  'What is the hostel curfew time?',
];

function uid() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask(question: string, retryId?: string) {
    const q = question.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: retryId ? `${retryId}-u` : uid(),
      role: 'user',
      content: q,
      status: 'answered',
    };

    const assistantId = retryId ?? uid();
    const loadingMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      status: 'loading',
    };

    if (retryId) {
      setMessages((prev) => [
        ...prev,
        loadingMsg,
      ]);
    } else {
      setMessages((prev) => [...prev, userMsg, loadingMsg]);
    }
    setInput('');
    setLoading(true);

    try {
      const res = await sendChat(q);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                id: assistantId,
                role: 'assistant',
                content: res.answer,
                status: res.status,
                citations: res.citations,
                processingTimeMs: res.processingTimeMs,
                conflict: res.conflict,
              }
            : m,
        ),
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to get a response.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                id: assistantId,
                role: 'assistant',
                content: '',
                status: 'error',
                error: message,
              }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function retry(id: string) {
    const userMsg = messages.find((m) => m.id === `${id}-u`);
    const question = userMsg?.content ?? input;
    // Remove the error message
    setMessages((prev) => prev.filter((m) => m.id !== id));
    ask(question, id);
  }

  return (
    <div className="flex flex-col h-screen md:h-screen max-h-screen">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 mt-14 md:mt-0">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in-up">
              <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                College Knowledge Assistant
              </h2>
              <p className="text-slate-500 max-w-md mx-auto mb-8">
                Ask questions about academic rules, exams, library, hostel, scholarships,
                fees, attendance, placements and more. Answers are based only on approved
                college documents.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    className="card p-4 text-left text-sm text-slate-700 hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <Lightbulb className="w-4 h-4 text-blue-600 inline mr-2 group-hover:scale-110 transition-transform" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} onRetry={() => retry(msg.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-200 bg-white px-4 md:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    ask(input);
                  }
                }}
                placeholder="Ask a question about college policies..."
                rows={1}
                disabled={loading}
                className="w-full resize-none border border-slate-300 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 disabled:bg-slate-50"
              />
            </div>
            <button
              onClick={() => ask(input)}
              disabled={!input.trim() || loading}
              className="btn-primary h-12 w-12 p-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Answers use only approved documents. The assistant will never guess or use outside knowledge.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, onRetry }: { msg: ChatMessage; onRetry: () => void }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in-up">
        <div className="bg-blue-900 text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-[80%] text-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  if (msg.status === 'loading') {
    return (
      <div className="flex justify-start animate-fade-in-up">
        <div className="card px-4 py-4 max-w-[80%]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full typing-dot" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full typing-dot" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full typing-dot" style={{ animationDelay: '0.4s' }} />
            <span className="text-xs text-slate-400 ml-2">Searching documents...</span>
          </div>
        </div>
      </div>
    );
  }

  if (msg.status === 'error') {
    return (
      <div className="flex justify-start animate-fade-in-up">
        <div className="card border-red-200 px-4 py-4 max-w-[80%]">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Something went wrong</span>
          </div>
          <p className="text-sm text-slate-600 mb-3">{msg.error}</p>
          <button onClick={onRetry} className="btn-secondary text-sm py-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const answered = msg.status === 'answered';

  return (
    <div className="flex justify-start animate-fade-in-up">
      <div className="card px-5 py-4 max-w-[85%] w-full">
        <div className="flex items-center gap-2 mb-3">
          {answered ? (
            <span className="badge bg-green-100 text-green-700">
              <ShieldCheck className="w-3.5 h-3.5" /> Answered from documents
            </span>
          ) : (
            <span className="badge bg-amber-100 text-amber-700">
              <ShieldAlert className="w-3.5 h-3.5" /> Insufficient evidence
            </span>
          )}
          {msg.conflict && (
            <span className="badge bg-orange-100 text-orange-700">
              <AlertCircle className="w-3.5 h-3.5" /> Sources conflict
            </span>
          )}
          {msg.processingTimeMs !== undefined && (
            <span className="text-xs text-slate-400 ml-auto">{msg.processingTimeMs}ms</span>
          )}
        </div>
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </p>
        {answered && msg.citations && msg.citations.length > 0 && (
          <CitationList citations={msg.citations} />
        )}
      </div>
    </div>
  );
}

function CitationList({ citations }: { citations: Citation[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-blue-700 font-medium hover:text-blue-800"
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <FileText className="w-4 h-4" />
        {citations.length} {citations.length === 1 ? 'citation' : 'citations'}
      </button>
      {expanded && (
        <div className="mt-3 space-y-3">
          {citations.map((c, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  {c.docName}
                </span>
                <div className="flex items-center gap-2">
                  {c.section && (
                    <span className="badge bg-blue-50 text-blue-600 text-[10px]">{c.section}</span>
                  )}
                  {c.page > 0 && (
                    <span className="badge bg-slate-100 text-slate-500 text-[10px]">Page {c.page}</span>
                  )}
                  <span className="badge bg-sky-50 text-sky-600 text-[10px]">
                    Score {c.score}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-mono bg-white rounded-lg p-2 border border-slate-100">
                "{c.passage}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
