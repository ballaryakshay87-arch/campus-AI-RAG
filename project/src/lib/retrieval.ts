import type { Chunk, Citation, ChatResult } from './types';
import { tokenize } from './chunking';

const SYSTEM_PROMPT =
  'You are the official College Knowledge Assistant. Answer using ONLY retrieved passages from approved college documents. Never use external knowledge, assumptions or guesses. Give concise, factual answers with citations. If the passages do not contain sufficient evidence, reply exactly "Insufficient evidence." Never invent dates, fees, rules or procedures. If sources conflict, explain and cite both.';

export const RELEVANCE_THRESHOLD = 0.10;
export const MIN_PASSAGE_COVERAGE = 0.10;
export const MAX_RETRIEVED = 5;

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

interface ScoredChunk {
  chunk: Chunk;
  score: number;
  matchedTokens: Set<string>;
}

class RetrievalIndex {
  private chunks: Chunk[] = [];
  private enabledDocIds: Set<string> = new Set();
  private df: Map<string, number> = new Map();
  private tfCache: Map<string, Map<string, number>> = new Map();
  private chunkTokenSets: Map<string, Set<string>> = new Map();
  private totalDocs = 0;

  setChunks(chunks: Chunk[], enabledDocIds: Set<string>) {
    this.chunks = chunks;
    this.enabledDocIds = enabledDocIds;
    this.df.clear();
    this.tfCache.clear();
    this.chunkTokenSets.clear();
    this.totalDocs = chunks.length;

    for (const chunk of chunks) {
      const tokens = tokenize(chunk.text);
      const tf = new Map<string, number>();
      const tokenSet = new Set<string>();
      for (const t of tokens) {
        tf.set(t, (tf.get(t) ?? 0) + 1);
        tokenSet.add(t);
      }
      this.tfCache.set(chunk.id, tf);
      this.chunkTokenSets.set(chunk.id, tokenSet);
      for (const t of tokenSet) {
        this.df.set(t, (this.df.get(t) ?? 0) + 1);
      }
    }
  }

  getChunkCount(): number {
    return this.chunks.length;
  }

  getChunksForDoc(docId: string): Chunk[] {
    return this.chunks.filter((c) => c.docId === docId);
  }

  removeChunksForDoc(docId: string) {
    this.chunks = this.chunks.filter((c) => c.docId !== docId);
  }

  private idf(term: string): number {
    const df = this.df.get(term) ?? 0;
    if (df === 0) return 0;
    return Math.log((1 + this.totalDocs) / (1 + df)) + 1;
  }

  private vectorMagnitude(tfMap: Map<string, number>): number {
    let sum = 0;
    for (const [term, tf] of tfMap) {
      const w = tf * this.idf(term);
      sum += w * w;
    }
    return Math.sqrt(sum) || 1;
  }

  retrieve(query: string, topK = MAX_RETRIEVED): ScoredChunk[] {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0 || this.chunks.length === 0) return [];

    const queryTf = new Map<string, number>();
    const queryTokenSet = new Set<string>();
    for (const t of queryTokens) {
      queryTf.set(t, (queryTf.get(t) ?? 0) + 1);
      queryTokenSet.add(t);
    }
    const queryMag = this.vectorMagnitude(queryTf);

    const scored: ScoredChunk[] = [];
    for (const chunk of this.chunks) {
      if (!this.enabledDocIds.has(chunk.docId)) continue;
      const chunkTf = this.tfCache.get(chunk.id);
      if (!chunkTf) continue;

      let dot = 0;
      const matched = new Set<string>();
      for (const [term, qtf] of queryTf) {
        const ctf = chunkTf.get(term);
        if (ctf) {
          dot += qtf * ctf * this.idf(term) * this.idf(term);
          matched.add(term);
        }
      }
      const chunkMag = this.vectorMagnitude(chunkTf);
      const score = dot / (queryMag * chunkMag);
      if (score > 0 && matched.size > 0) {
        scored.push({ chunk, score, matchedTokens: matched });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

export const retrievalIndex = new RetrievalIndex();

// Abbreviations and initials that should not trigger sentence splits
function splitSentences(text: string): string[] {
  let p = text.replace(/\bRs\./g, 'Rs§');
  p = p.replace(/\bProf\./g, 'Prof§');
  p = p.replace(/\bDr\./g, 'Dr§');
  p = p.replace(/\bNo\./g, 'No§');
  p = p.replace(/\be\.g\./g, 'e§g§');
  p = p.replace(/\bi\.e\./g, 'i§e§');
  // Protect single-letter initials like "R. Sharma"
  p = p.replace(/\b([A-Z])\.\s/g, '$1§ ');

  return p
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/§/g, '.').trim())
    .filter((s) => s.length > 15);
}

function isDisclaimer(sentence: string): boolean {
  const lower = sentence.toLowerCase();
  return (
    lower.includes('demo sample policy data') ||
    lower.includes('not verified facts') ||
    lower.startsWith('#')
  );
}

// Synonyms: if a query token matches a synonym, count it as matched
const SYNONYMS: Map<string, string[]> = new Map([
  ['curfew', ['gate', 'close', 'closing', 'return', 'night', 'back']],
  ['hostel', ['hostel', 'dormitory', 'residence']],
  ['night', ['pm', 'evening', 'night', 'curfew', 'gate']],
  ['back', ['return', 'close', 'closing', 'curfew']],
  ['scholarship', ['scholarship', 'aid', 'grant', 'financial']],
  ['fee', ['fee', 'fees', 'tuition', 'cost', 'charge', 'payment']],
  ['exam', ['exam', 'examination', 'test']],
  ['grade', ['grade', 'grading', 'cgpa', 'gpa', 'point']],
]);

function expandedMatchedCount(matchedTokens: Set<string>, queryTokens: string[]): number {
  let count = 0;
  for (const qt of queryTokens) {
    if (matchedTokens.has(qt)) {
      count++;
      continue;
    }
    // Check synonyms
    const syns = SYNONYMS.get(qt);
    if (syns && syns.some((s) => matchedTokens.has(s))) {
      count++;
    }
  }
  return count;
}

// Check if a passage has sufficient query coverage
function hasSufficientCoverage(scored: ScoredChunk[], queryTokens: string[]): boolean {
  if (scored.length === 0) return false;
  const top = scored[0];
  const queryTokenSet = new Set(queryTokens);
  const matchedCount = expandedMatchedCount(top.matchedTokens, queryTokens);
  const totalQueryTokens = queryTokenSet.size;

  if (totalQueryTokens <= 1) return matchedCount >= 1;
  if (totalQueryTokens === 2) {
    // For 2-token queries, require both to match OR one with very high score
    if (matchedCount >= 2) return true;
    if (matchedCount >= 1 && top.score >= 0.5) return true;
    return false;
  }
  // For 3+ token queries, require at least 2 matches (with synonym expansion)
  // But allow single match if score is very high (strong topical match)
  if (matchedCount >= 2) return true;
  if (matchedCount >= 1 && top.score >= 0.5) return true;
  return false;
}

function detectConflict(scored: ScoredChunk[], query: string): boolean {
  if (scored.length < 2) return false;
  if (scored[0].score < 0.25) return false;

  const top = scored.filter((s) => s.score >= MIN_PASSAGE_COVERAGE).slice(0, 4);
  if (top.length < 2) return false;

  const docIds = new Set(top.map((s) => s.chunk.docId));
  if (docIds.size < 2) return false;

  // Multi-topic queries (containing "and") are NOT conflicts — they ask about different things
  if (/\band\b/i.test(query)) return false;

  // Only flag conflict for single-topic queries about values
  const conflictTopics = ['fee', 'fine', 'cost', 'charge', 'scholarship', 'deadline',
    'eligibility', 'curfew', 'fine', 'penalty'];
  const queryTokens = tokenize(query);
  const isConflictTopic = queryTokens.some((t) => conflictTopics.some((c) => t.includes(c)));
  if (!isConflictTopic) return false;

  // Check if different docs cite different numeric values
  const numbers = new Map<string, Set<string>>();
  for (const s of top) {
    const found = s.chunk.text.match(/Rs\.?\s*[\d,]+|\d+\s*(?:%|percent|points|days?|weeks?|lakhs?)/gi);
    if (found && found.length > 0) {
      const key = s.chunk.docId;
      if (!numbers.has(key)) numbers.set(key, new Set());
      for (const v of found) {
        numbers.get(key)!.add(v.replace(/\s+/g, ' ').toLowerCase());
      }
    }
  }
  if (numbers.size < 2) return false;

  const allSets = Array.from(numbers.values());
  const firstSet = allSets[0];
  const secondSet = allSets[1];
  return !Array.from(firstSet).every((v) => secondSet.has(v));
}

export function extractAnswer(
  query: string,
  scored: ScoredChunk[],
): { answer: string; conflict: boolean } {
  const queryTokens = tokenize(query);

  if (scored.length === 0 || queryTokens.length === 0) {
    return { answer: 'Insufficient evidence.', conflict: false };
  }

  const topScore = scored[0].score;
  if (topScore < RELEVANCE_THRESHOLD) {
    return { answer: 'Insufficient evidence.', conflict: false };
  }

  // Coverage check: ensure the top passage actually covers the query
  if (!hasSufficientCoverage(scored, queryTokens)) {
    return { answer: 'Insufficient evidence.', conflict: false };
  }

  const conflict = detectConflict(scored, query);

  // Use top passages (those above coverage threshold)
  const usedPassages = scored.filter((s) => s.score >= MIN_PASSAGE_COVERAGE).slice(0, 3);
  if (usedPassages.length === 0) {
    return { answer: 'Insufficient evidence.', conflict: false };
  }

  // Answer extraction: score sentences by query term overlap, pick the best
  const queryTokenSet = new Set(queryTokens);
  const allSentences: { sentence: string; chunk: Chunk; passageIdx: number; sentScore: number }[] = [];
  for (let pi = 0; pi < usedPassages.length; pi++) {
    const { chunk, score } = usedPassages[pi];
    const sentences = splitSentences(chunk.text).filter((s) => !isDisclaimer(s));
    for (const sentence of sentences) {
      const sTokens = tokenize(sentence);
      if (sTokens.length === 0) continue;
      let overlap = 0;
      for (const t of sTokens) {
        if (queryTokenSet.has(t)) overlap++;
        for (const [qt, syns] of SYNONYMS) {
          if (queryTokenSet.has(qt) && syns.includes(t)) {
            overlap++;
            break;
          }
        }
      }
      // Bonus for sentences containing specific facts (numbers, currency, names, times)
      const hasSpecifics = /\d|Rs\.|\d{1,2}:\d{2}|Professor|Prof\b|Dr\b/i.test(sentence);
      // Extra bonus for sentences with times (e.g. "9:30 PM") or currency
      const hasTime = /\d{1,2}:\d{2}\s*[AP]M/i.test(sentence);
      const hasCurrency = /Rs\.?\s*[\d,]+/i.test(sentence);
      const specificsBonus = (hasSpecifics ? 0.1 : 0) + (hasTime ? 0.15 : 0) + (hasCurrency ? 0.1 : 0);
      const sentScore = overlap / Math.max(sTokens.length, 1) + score * 0.2 + specificsBonus;
      allSentences.push({ sentence, chunk, passageIdx: pi, sentScore });
    }
  }

  if (allSentences.length === 0) {
    return { answer: 'Insufficient evidence.', conflict: false };
  }

  // For multi-passage queries (query contains "and" or multiple topics),
  // combine sentences from different docs
  const isMultiTopic = /\band\b/i.test(query) || usedPassages.length > 1 && !conflict;

  if (conflict) {
    const byDoc = new Map<string, string[]>();
    for (const s of allSentences) {
      const arr = byDoc.get(s.chunk.docId) ?? [];
      arr.push(s.sentence);
      byDoc.set(s.chunk.docId, arr);
    }
    const parts: string[] = [];
    for (const [, arr] of byDoc) {
      const docChunk = allSentences.find((s) => s.chunk.docId === byDoc.keys().next().value);
      const firstChunk = allSentences.find((s) => s.chunk.docId === [...byDoc.keys()].find(k => s.chunk.docId === k));
      if (firstChunk) {
        parts.push(`${firstChunk.chunk.docName} (${firstChunk.chunk.section}): ${arr.join(' ')}`);
      }
    }
    return {
      answer: `Sources appear to conflict. ${parts.join(' | ')}`,
      conflict: true,
    };
  }

  if (isMultiTopic && usedPassages.length >= 2) {
    // For multi-topic: pick best sentence from each relevant doc
    const combined: string[] = [];
    const seenDocs = new Set<string>();
    const byDocBest = new Map<string, { sentence: string; sentScore: number }>();
    for (const s of allSentences) {
      const existing = byDocBest.get(s.chunk.docId);
      if (!existing || s.sentScore > existing.sentScore) {
        byDocBest.set(s.chunk.docId, { sentence: s.sentence, sentScore: s.sentScore });
      }
    }
    // Order docs by their best sentence score
    const sortedDocs = Array.from(byDocBest.entries()).sort((a, b) => b[1].sentScore - a[1].sentScore);
    for (const [docId, best] of sortedDocs) {
      if (!seenDocs.has(docId)) {
        combined.push(best.sentence);
        seenDocs.add(docId);
      }
      if (combined.length >= 3) break;
    }
    return { answer: combined.join(' '), conflict: false };
  }

  // Default: pick the best-scoring sentences across ALL used passages
  const sortedSentences = [...allSentences].sort((a, b) => b.sentScore - a.sentScore);
  const answer = sortedSentences.slice(0, 2).map((s) => s.sentence).join(' ');
  return { answer, conflict: false };
}

export function buildCitations(scored: ScoredChunk[]): Citation[] {
  return scored
    .filter((s) => s.score >= MIN_PASSAGE_COVERAGE)
    .slice(0, MAX_RETRIEVED)
    .map((s) => ({
      docId: s.chunk.docId,
      docName: s.chunk.docName,
      passage: s.chunk.text.trim(),
      page: s.chunk.page,
      section: s.chunk.section,
      score: Math.round(s.score * 1000) / 1000,
    }));
}

export function answerQuestion(query: string): ChatResult {
  const start = performance.now();
  const scored = retrievalIndex.retrieve(query);
  const { answer, conflict } = extractAnswer(query, scored);
  const citations = buildCitations(scored);
  const status: 'answered' | 'insufficient' =
    answer === 'Insufficient evidence.' ? 'insufficient' : 'answered';
  const processingTimeMs = Math.round(performance.now() - start);
  return { answer, status, citations, processingTimeMs, conflict };
}
