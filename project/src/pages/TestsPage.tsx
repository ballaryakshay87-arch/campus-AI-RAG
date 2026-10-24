import { useState, useEffect } from 'react';
import type { TestReport, TestResult } from '@/lib/types';
import { fetchTests, ApiError } from '@/lib/api';
import {
  TestTube,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  TrendingUp,
} from 'lucide-react';

export function TestsPage() {
  const [report, setReport] = useState<TestReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTests();
      setReport(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to run tests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    run();
  }, []);

  return (
    <div className="p-4 md:p-8 mt-14 md:mt-0">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Test Report</h1>
            <p className="text-slate-500 text-sm">
              Automated tests verifying answer accuracy, insufficient-evidence handling, and citation quality.
            </p>
          </div>
          <button onClick={run} disabled={loading} className="btn-secondary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Re-run Tests
          </button>
        </div>

        {loading && !report && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Running {21} test cases...</p>
          </div>
        )}

        {error && (
          <div className="card border-red-200 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={run} className="btn-secondary">Retry</button>
          </div>
        )}

        {report && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TestTube className="w-5 h-5 text-blue-600" />
                  <span className="text-xs text-slate-400 font-medium">Total Tests</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">{report.total}</p>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-xs text-slate-400 font-medium">Correct</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{report.correct}</p>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-slate-400 font-medium">Incorrect</span>
                </div>
                <p className="text-3xl font-bold text-red-500">{report.incorrect}</p>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-xs text-slate-400 font-medium">Accuracy</span>
                </div>
                <p className="text-3xl font-bold text-blue-700">{report.accuracy}%</p>
              </div>
            </div>

            {report.executed && (
              <div className="card border-green-200 bg-green-50/50 p-3 mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-xs text-green-700">
                  Tests were actually executed at {new Date(report.ranAt).toLocaleString()}. No test is marked as passed without being run.
                </p>
              </div>
            )}

            {/* Category breakdown */}
            <div className="card p-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">By Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {['answerable', 'unanswerable', 'multi-passage', 'vague', 'paraphrased'].map((cat) => {
                  const catResults = report.results.filter((r) => r.case.category === cat);
                  const correct = catResults.filter((r) => r.correct).length;
                  return (
                    <div key={cat} className="text-center">
                      <p className="text-xs text-slate-400 capitalize mb-1">{cat.replace('-', ' ')}</p>
                      <p className="text-sm font-bold text-slate-700">{correct}/{catResults.length}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test results */}
            <div className="space-y-2">
              {report.results.map((result) => (
                <TestRow
                  key={result.case.id}
                  result={result}
                  expanded={expanded === result.case.id}
                  onToggle={() => setExpanded(expanded === result.case.id ? null : result.case.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TestRow({ result, expanded, onToggle }: { result: TestResult; expanded: boolean; onToggle: () => void }) {
  const { case: tc, correct, status } = result;
  const categoryColors: Record<string, string> = {
    answerable: 'bg-blue-100 text-blue-700',
    unanswerable: 'bg-amber-100 text-amber-700',
    'multi-passage': 'bg-purple-100 text-purple-700',
    vague: 'bg-slate-100 text-slate-600',
    paraphrased: 'bg-sky-100 text-sky-700',
  };

  return (
    <div className={`card overflow-hidden ${correct ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-red-400'}`}>
      <button onClick={onToggle} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="flex-shrink-0 mt-0.5">
          {correct ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`badge text-[10px] ${categoryColors[tc.category]}`}>{tc.category.replace('-', ' ')}</span>
            <span className={`badge text-[10px] ${status === 'answered' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
              {status === 'answered' ? 'Answered' : 'Insufficient'}
            </span>
            {correct ? (
              <span className="badge text-[10px] bg-green-50 text-green-600">Pass</span>
            ) : (
              <span className="badge text-[10px] bg-red-50 text-red-500">Fail</span>
            )}
            <span className="text-[10px] text-slate-400 ml-auto">{result.processingTimeMs}ms</span>
          </div>
          <p className="text-sm font-medium text-slate-800">{tc.question}</p>
          <p className="text-xs text-slate-400 mt-0.5">{tc.description}</p>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400 mt-1" /> : <ChevronRight className="w-4 h-4 text-slate-400 mt-1" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Expected</p>
              <p className="text-sm text-slate-700">
                Type: <span className="font-medium">{tc.expectedType === 'answered' ? 'Answered' : 'Insufficient evidence'}</span>
              </p>
              {tc.expectedKeywords && (
                <p className="text-sm text-slate-700 mt-1">
                  Keywords: <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{tc.expectedKeywords.join(', ')}</span>
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Actual Answer</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2 leading-relaxed">{result.answer}</p>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Verdict</p>
            <p className={`text-sm ${correct ? 'text-green-600' : 'text-red-500'}`}>{result.reason}</p>
          </div>

          {result.citations.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Citations ({result.citations.length})
              </p>
              <div className="space-y-2">
                {result.citations.map((c, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-700">{c.docName}</span>
                      <span className="badge bg-blue-50 text-blue-600 text-[10px]">{c.section}</span>
                      <span className="badge bg-sky-50 text-sky-600 text-[10px]">Score {c.score}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-mono">"{c.passage.slice(0, 200)}..."</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
