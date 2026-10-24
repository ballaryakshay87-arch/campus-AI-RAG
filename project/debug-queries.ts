import { retrievalIndex } from './src/lib/retrieval';
import { ensureInitialized } from './src/lib/documentStore';
import { tokenize } from './src/lib/chunking';

ensureInitialized();

const failing = [
  'What is the weather like on campus today?',
  'What is the college cafeteria menu for next Tuesday?',
  'How do I register for a marathon happening in the city?',
  'What is the salary of the college principal?',
];

for (const q of failing) {
  const tokens = tokenize(q);
  console.log(`\nQuery: "${q}"`);
  console.log(`Tokens: [${tokens.join(', ')}]`);
  const results = retrievalIndex.retrieve(q, 3);
  for (const r of results) {
    console.log(`  Score: ${r.score.toFixed(4)} | ${r.chunk.docName} | ${r.chunk.section}`);
    console.log(`    Text: ${r.chunk.text.slice(0, 100)}`);
  }
}
