import { useState, useRef, useCallback } from 'react';
import type { DocumentRecord } from '@/lib/types';
import { uploadDocument, ApiError } from '@/lib/api';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';

const ACCEPTED = ['.pdf', '.docx', '.txt', '.md'];
const MAX_SIZE = 10 * 1024 * 1024;

interface UploadItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  result?: DocumentRecord;
  error?: string;
}

export function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED.includes(ext)) return 'Unsupported file type. Only PDF, DOCX, TXT, MD are allowed.';
    if (file.size > MAX_SIZE) return 'File too large. Maximum size is 10 MB.';
    return null;
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const newItems: UploadItem[] = arr.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
      error: validateFile(file) ?? undefined,
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  async function uploadOne(index: number) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, status: 'uploading', progress: 0, error: undefined } : it)));

    try {
      const result = await uploadDocument(items[index].file, (pct) => {
        setItems((prev) => prev.map((it, i) => (i === index ? { ...it, progress: pct } : it)));
      });
      setItems((prev) =>
        prev.map((it, i) =>
          i === index
            ? {
                ...it,
                status: result.error ? 'error' : 'success',
                progress: 100,
                result: result.document,
                error: result.error,
              }
            : it,
        ),
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((it, i) =>
          i === index
            ? { ...it, status: 'error', error: err instanceof ApiError ? err.message : 'Upload failed.' }
            : it,
        ),
      );
    }
  }

  async function uploadAll() {
    const valid = items.filter((it) => it.status === 'pending' && !it.error);
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'pending' && !items[i].error) {
        await uploadOne(i);
      }
    }
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const successCount = items.filter((i) => i.status === 'success').length;
  const errorCount = items.filter((i) => i.status === 'error').length;
  const pendingCount = items.filter((i) => i.status === 'pending' && !i.error).length;

  return (
    <div className="p-4 md:p-8 mt-14 md:mt-0">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Admin Upload</h1>
          <p className="text-slate-500 text-sm">
            Upload approved college documents (PDF, DOCX, TXT, MD). Documents are processed,
            chunked and embedded automatically.
          </p>
        </div>

        {/* Admin notice */}
        <div className="card border-blue-200 bg-blue-50/50 p-4 mb-6 flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Admin access required</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Document management is restricted to administrators. In production, this page is
              protected by role-based authentication.
            </p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED.join(',')}
            onChange={(e) => e.target.files && addFiles(e.target.files)}
            className="hidden"
          />
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${dragging ? 'bg-blue-600' : 'bg-slate-100'}`}>
            <UploadCloud className={`w-8 h-8 ${dragging ? 'text-white' : 'text-slate-400'}`} />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">
            {dragging ? 'Drop files here' : 'Drag and drop files, or click to browse'}
          </p>
          <p className="text-xs text-slate-400">
            PDF, DOCX, TXT, MD — Max 10 MB each
          </p>
        </div>

        {/* Upload queue */}
        {items.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700">
                {items.length} file{items.length !== 1 ? 's' : ''} queued
              </h2>
              {pendingCount > 0 && (
                <button onClick={uploadAll} className="btn-primary text-sm py-2">
                  <UploadCloud className="w-4 h-4" /> Upload All ({pendingCount})
                </button>
              )}
            </div>

            {successCount > 0 || errorCount > 0 ? (
              <div className="flex gap-4 mb-4 text-sm">
                {successCount > 0 && (
                  <span className="text-green-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> {successCount} uploaded
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> {errorCount} failed
                  </span>
                )}
              </div>
            ) : null}

            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.status === 'success' ? 'bg-green-50' :
                      item.status === 'error' ? 'bg-red-50' :
                      'bg-blue-50'
                    }`}>
                      {item.status === 'uploading' ? (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      ) : item.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : item.status === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.file.name}</p>
                        <button onClick={() => removeItem(i)} className="p-1 text-slate-300 hover:text-red-500 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(item.file.size / 1024).toFixed(1)} KB — {item.file.name.split('.').pop()?.toUpperCase()}
                      </p>

                      {item.status === 'uploading' && (
                        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                        </div>
                      )}

                      {item.status === 'success' && item.result && (
                        <p className="text-xs text-green-600 mt-1.5">
                          Processed successfully — {item.result.chunkCount} chunks created.
                        </p>
                      )}

                      {item.error && (
                        <p className="text-xs text-red-500 mt-1.5">{item.error}</p>
                      )}

                      {item.status === 'pending' && !item.error && (
                        <button onClick={() => uploadOne(i)} className="btn-secondary text-xs py-1.5 px-3 mt-2">
                          <UploadCloud className="w-3.5 h-3.5" /> Upload
                        </button>
                      )}
                      {item.status === 'error' && (
                        <button onClick={() => uploadOne(i)} className="btn-secondary text-xs py-1.5 px-3 mt-2">
                          <UploadCloud className="w-3.5 h-3.5" /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
