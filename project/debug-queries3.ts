import { retrievalIndex, answerQuestion } from './src/lib/retrieval';
import { ensureInitialized } from './src/lib/documentStore';
import { tokenize } from './src/lib/chunking';

ensureInitialized();

const cases = [
  'Who is the grievance redressal officer?',
  'What are the attendance and placement eligibility requirements?',
  'Tell me about fees',
  'When do I need to be back at the hostel at night?',
];

for (const q of cases) {
  const tokens = tokenize(q);
  console.log(`\nQuery: "${q}"`);
  console.log(`Tokens: [${tokens.join(', ')}]`);
  const result = answerQuestion(q);
  console.log(`Status: ${result.status}`);
  console.log(`Answer: ${result.answer.slice(0, 200)}`);
  console.log(`Citations: ${result.citations.length}`);
}
