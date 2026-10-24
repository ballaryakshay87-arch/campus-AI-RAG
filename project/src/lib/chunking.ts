import type { Chunk } from './types';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'of', 'to', 'in',
  'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up',
  'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'its',
  'they', 'them', 'their', 'what', 'which', 'who', 'this', 'that', 'these',
  'those', 'am', 'if', 'because', 'as', 'until', 'while', 'also',
  // Domain-common words that appear in nearly every college policy doc
  'college', 'student', 'students', 'policy', 'rules', 'section', 'year',
  'academic', 'must', 'per', 'every', 'shall', 'required', 'required',
  'demo', 'sample', 'data', 'verified', 'facts', 'real', 'knowledge',
  'assistant', 'not', 'clearly', 'labelled',
  // Common conversational words that shouldn't drive retrieval
  'tell', 'me', 'about', 'like', 'get', 'want', 'know', 'info', 'information',
  'happening', 'next', 'today', 'tomorrow',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

export interface ChunkOptions {
  maxChunkSize?: number;
  overlap?: number;
}

// Remove the demo disclaimer header from chunk text before indexing
function stripDisclaimer(text: string): string {
  // Remove lines that are part of the demo disclaimer
  return text
    .replace(/^This is DEMO sample policy data[^\n]*\n*/i, '')
    .replace(/^.*not verified facts about a real college\.\n*/i, '')
    .replace(/^#[^\n]*\n+/i, '')
    .trim();
}

export function splitIntoChunks(
  text: string,
  docId: string,
  docName: string,
  options: ChunkOptions = {},
): Chunk[] {
  const maxChunkSize = options.maxChunkSize ?? 500;
  const overlap = options.overlap ?? 100;

  const chunks: Chunk[] = [];
  const lines = text.split('\n');
  let currentSection = 'General';
  let currentPage = 1;
  let chunkIndex = 0;
  let buffer = '';

  const flush = () => {
    let trimmed = buffer.trim();
    if (trimmed.length < 20) {
      buffer = '';
      return;
    }
    // Strip disclaimer from each chunk
    trimmed = stripDisclaimer(trimmed);
    if (trimmed.length < 20) {
      buffer = '';
      return;
    }
    chunks.push({
      id: `${docId}-chunk-${chunkIndex}`,
      docId,
      docName,
      text: trimmed,
      page: currentPage,
      section: currentSection,
      index: chunkIndex,
    });
    chunkIndex++;
    buffer = '';
  };

  for (const line of lines) {
    const sectionMatch = line.match(/^Section\s+(\d+)/i);
    const pageMatch = line.match(/Page\s+(\d+)/i);

    if (sectionMatch) {
      flush();
      currentSection = `Section ${sectionMatch[1]}`;
      continue;
    }
    if (pageMatch) {
      flush();
      currentPage = parseInt(pageMatch[1], 10);
      continue;
    }

    // Skip disclaimer and title lines during chunking
    if (/^This is DEMO sample policy data/i.test(line.trim())) continue;
    if (/^.*not verified facts about a real college/i.test(line.trim())) continue;
    if (/^#/.test(line.trim())) continue;

    if (buffer.length + line.length + 1 > maxChunkSize && buffer.length > 0) {
      flush();
      if (overlap > 0) {
        const words = buffer.split(/\s+/);
        buffer = words.slice(-Math.ceil(overlap / 5)).join(' ') + ' ';
      }
    }
    buffer += line + '\n';
  }
  flush();
  return chunks;
}
