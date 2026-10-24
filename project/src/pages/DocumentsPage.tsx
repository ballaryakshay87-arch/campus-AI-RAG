import { useState, useEffect } from 'react';
import type { DocumentRecord, Chunk } from '@/lib/types';
import { fetchDocuments, fetchDocument, deleteDocument, patchDocument, reindexDocument, ApiError } from '@/lib/api';
import {
  FileText,
  FileCheck,
  FileX,
  RefreshCw,
  Trash2,
  Eye,
  X,
  Loader2,
  Search,
  AlertCircle,
} from 'lucide-react';

export function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DocumentRecord | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDocuments();
      setDocs(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleToggle(doc: DocumentRecord) {
    setActionLoading(doc.id);
    try {
      const updated = await patchDocument(doc.id, !doc.enabled);
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
      showToast(`Document ${!doc.enabled ? 'enabled' : 'disabled'}.`, 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update document.', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(doc: DocumentRecord) {
    if (!confirm(`Delete "${doc.name}"? This will remove all its chunks and embeddings.`)) return;
    setActionLoading(doc.id);
    try {
      await deleteDocument(doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      showToast('Document deleted.', 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to delete document.', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReindex(doc: DocumentRecord) {
    setActionLoading(doc.id);
    try {
      const updated = await reindexDocument(doc.id);
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
      showToast('Document re-indexed.', 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to re-index.', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePreview(doc: DocumentRecord) {
    setSelected(doc);
    setChunks([]);
    try {
      const data = await fetchDocument(doc.id);
      setChunks(data.chunks);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to load document.', 'error');
    }
  }

  const filtered = docs.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8 mt-14 md:mt-0">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Documents</h1>
          <p className="text-slate-500 text-sm">
            Browse approved college documents. {docs.length} documents, {docs.reduce((s, d) => s + d.chunkCount, 0)} chunks indexed.
          </p>
        </div>

        {toast && (
          <div className={`fixed top-20 md:top-6 right-6 z-50 card px-4 py-3 flex items-center gap-2 animate-fade-in-up ${toast.type === 'success' ? 'border-green-200' : 'border-red-200'}`}>
            {toast.type === 'success' ? <FileCheck className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span className="text-sm">{toast.msg}</span>
          </div>
        )}

        <div className="relative mb-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="card border-red-200 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={load} className="btn-secondary">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No documents found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc) => (
              <div key={doc.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${doc.enabled ? 'bg-blue-50' : 'bg-slate-100'}`}>
                    <FileText className={`w-5 h-5 ${doc.enabled ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-slate-800 text-sm truncate">{doc.name}</h3>
                      {doc.isSample && (
                        <span className="badge bg-sky-100 text-sky-700 text-[10px]">Sample</span>
                      )}
                      {doc.status === 'ready' && doc.enabled && (
                        <span className="badge bg-green-100 text-green-700"><FileCheck className="w-3 h-3" /> Ready</span>
                      )}
                      {doc.status === 'disabled' && (
                        <span className="badge bg-slate-100 text-slate-500"><FileX className="w-3 h-3" /> Disabled</span>
                      )}
                      {doc.status === 'error' && (
                        <span className="badge bg-red-100 text-red-600"><AlertCircle className="w-3 h-3" /> Error</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{doc.chunkCount} chunks</span>
                      <span>{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                      <span className="uppercase">{doc.type}</span>
                    </div>
                    {doc.errorMessage && (
                      <p className="text-xs text-red-500 mt-1">{doc.errorMessage}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handlePreview(doc)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleReindex(doc)} disabled={actionLoading === doc.id} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50" title="Re-index">
                      {actionLoading === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleToggle(doc)} disabled={actionLoading === doc.id} className={`p-2 rounded-lg transition-colors ${doc.enabled ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`} title={doc.enabled ? 'Disable' : 'Enable'}>
                      {doc.enabled ? <FileX className="w-4 h-4" /> : <FileCheck className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(doc)} disabled={actionLoading === doc.id} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <PreviewModal doc={selected} chunks={chunks} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function PreviewModal({ doc, chunks, onClose }: { doc: DocumentRecord; chunks: Chunk[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <h2 className="font-semibold text-slate-800 text-sm truncate">{doc.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="card p-3 text-center">
              <p className="text-xs text-slate-400">Chunks</p>
              <p className="text-lg font-bold text-blue-700">{doc.chunkCount}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xs text-slate-400">Size</p>
              <p className="text-lg font-bold text-blue-700">{(doc.sizeBytes / 1024).toFixed(1)}KB</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xs text-slate-400">Type</p>
              <p className="text-lg font-bold text-blue-700 uppercase">{doc.type}</p>
            </div>
          </div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Preview</h3>
          <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mb-4 leading-relaxed">{doc.preview}</p>
          <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Chunks ({chunks.length})</h3>
          <div className="space-y-2">
            {chunks.slice(0, 10).map((c) => (
              <div key={c.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge bg-blue-50 text-blue-600 text-[10px]">{c.section}</span>
                  <span className="text-[10px] text-slate-400">Chunk #{c.index}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{c.text.slice(0, 150)}...</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
