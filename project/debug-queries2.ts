import { retrievalIndex } from './src/lib/retrieval';
import { ensureInitialized } from './src/lib/documentStore';
import { tokenize } from './src/lib/chunking';
import { answerQuestion } from './src/lib/retrieval';

ensureInitialized();

const cases = [
  'Who is the grievance redressal officer?',
  'What is the salary of the college principal?',
  'When do I need to be back at the hostel at night?',
];

for (const q of cases) {
  const tokens = tokenize(q);
  console.log(`\nQuery: "${q}"`);
  console.log(`Tokens: [${tokens.join(', ')}]`);
  const result = answerQuestion(q);
  console.log(`Status: ${result.status}`);
  console.log(`Answer: ${result.answer.slice(0, 150)}`);
  const results = retrievalIndex.retrieve(q, 3);
  for (const r of results) {
    console.log(`  Score: ${r.score.toFixed(4)} | matched: [${[...r.matchedTokens].join(',')}] | ${r.chunk.docName} | ${r.chunk.section}`);
    console.log(`    Text: ${r.chunk.text.slice(0, 120)}`);
  }
}
