import { handleHealth, handleChat, handleListDocuments, handleGetTests } from './src/lib/apiHandlers';

async function main() {
  const [health] = await handleHealth();
  console.log('=== Health ===');
  console.log(JSON.stringify(health, null, 2));

  const [chat] = await handleChat({ question: 'What is the grading system used by the college?' });
  console.log('\n=== Chat (grading) ===');
  console.log('Status:', chat.status);
  console.log('Answer:', String(chat.answer).slice(0, 150));
  console.log('Citations:', chat.citations?.length);

  const [chat2] = await handleChat({ question: 'What is the weather like today?' });
  console.log('\n=== Chat (unanswerable) ===');
  console.log('Status:', chat2.status);
  console.log('Answer:', chat2.answer);

  const [docs] = await handleListDocuments();
  console.log('\n=== Documents ===');
  console.log('Count:', docs.count);
  for (const d of docs.documents.slice(0, 4)) {
    console.log(`  ${d.name} - ${d.chunkCount} chunks - ${d.status}`);
  }

  const [tests] = await handleGetTests();
  console.log('\n=== Tests ===');
  console.log('Total:', tests.total);
  console.log('Correct:', tests.correct);
  console.log('Incorrect:', tests.incorrect);
  console.log('Accuracy:', tests.accuracy + '%');
  console.log('Executed:', tests.executed);
  const failed = tests.results.filter((r: any) => !r.correct);
  if (failed.length > 0) {
    console.log('\nFailed tests:');
    for (const f of failed) {
      console.log(`  ${f.case.id} [${f.case.category}]: ${f.reason.slice(0, 120)}`);
    }
  } else {
    console.log('\nAll tests passed!');
  }
}

main().catch(console.error);
