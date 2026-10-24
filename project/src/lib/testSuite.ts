import type { TestCase, TestReport, TestResult } from './types';
import { answerQuestion } from './retrieval';

export const TEST_CASES: TestCase[] = [
  // 10+ answerable questions
  {
    id: 't1',
    category: 'answerable',
    question: 'What is the grading system used by the college?',
    expectedType: 'answered',
    expectedKeywords: ['10-point', 'grading'],
    description: 'Should return the 10-point grading system from Academic Rules.',
  },
  {
    id: 't2',
    category: 'answerable',
    question: 'How many credits are required to graduate?',
    expectedType: 'answered',
    expectedKeywords: ['160', 'credits'],
    description: 'Should state the 160-credit minimum from Academic Rules.',
  },
  {
    id: 't3',
    category: 'answerable',
    question: 'What is the fine for overdue library books?',
    expectedType: 'answered',
    expectedKeywords: ['2', 'fine', 'day'],
    description: 'Should return Rs. 2 per day from Library Rules.',
  },
  {
    id: 't4',
    category: 'answerable',
    question: 'How many books can undergraduate students borrow from the library?',
    expectedType: 'answered',
    expectedKeywords: ['4', 'books', '14'],
    description: 'Should return 4 books for 14 days from Library Rules.',
  },
  {
    id: 't5',
    category: 'answerable',
    question: 'What is the minimum attendance required to appear for end-semester exams?',
    expectedType: 'answered',
    expectedKeywords: ['75'],
    description: 'Should return 75% minimum from Attendance Policy.',
  },
  {
    id: 't6',
    category: 'answerable',
    question: 'What is the annual tuition fee for engineering programs?',
    expectedType: 'answered',
    expectedKeywords: ['1,20,000'],
    description: 'Should return Rs. 1,20,000 from Fee Structure.',
  },
  {
    id: 't7',
    category: 'answerable',
    question: 'What CGPA is required for the merit scholarship?',
    expectedType: 'answered',
    expectedKeywords: ['8.5'],
    description: 'Should return CGPA 8.5 from Scholarships document.',
  },
  {
    id: 't8',
    category: 'answerable',
    question: 'What is the hostel curfew time?',
    expectedType: 'answered',
    expectedKeywords: ['9:30'],
    description: 'Should return 9:30 PM from Hostel Handbook.',
  },
  {
    id: 't9',
    category: 'answerable',
    question: 'What is the penalty for examination malpractice?',
    expectedType: 'answered',
    expectedKeywords: ['debarred', 'semester'],
    description: 'Should return debarment from Examination Policy.',
  },
  {
    id: 't10',
    category: 'answerable',
    question: 'Who is the grievance redressal officer?',
    expectedType: 'answered',
    expectedKeywords: ['sharma'],
    description: 'Should return Professor R. Sharma from Grievance Policy.',
  },
  {
    id: 't11',
    category: 'answerable',
    question: 'What is the minimum internship duration?',
    expectedType: 'answered',
    expectedKeywords: ['6', 'weeks'],
    description: 'Should return 6 weeks from Internship Policy.',
  },
  // 5+ unanswerable questions
  {
    id: 't12',
    category: 'unanswerable',
    question: 'What is the weather like on campus today?',
    expectedType: 'insufficient',
    description: 'No document covers weather — must return insufficient evidence.',
  },
  {
    id: 't13',
    category: 'unanswerable',
    question: 'What is the college cafeteria menu for next Tuesday?',
    expectedType: 'insufficient',
    description: 'No cafeteria menu in documents — must return insufficient evidence.',
  },
  {
    id: 't14',
    category: 'unanswerable',
    question: 'How do I register for a marathon happening in the city?',
    expectedType: 'insufficient',
    description: 'Marathon registration not in documents — must return insufficient evidence.',
  },
  {
    id: 't15',
    category: 'unanswerable',
    question: 'What is the salary of the college principal?',
    expectedType: 'insufficient',
    description: 'Staff salaries not in documents — must return insufficient evidence.',
  },
  {
    id: 't16',
    category: 'unanswerable',
    question: 'Which bus routes serve the college?',
    expectedType: 'insufficient',
    description: 'Transport routes not in documents — must return insufficient evidence.',
  },
  {
    id: 't17',
    category: 'unanswerable',
    question: 'What is the recipe for the mess paneer curry?',
    expectedType: 'insufficient',
    description: 'Recipes not in documents — must return insufficient evidence.',
  },
  // 2 multi-passage questions
  {
    id: 't18',
    category: 'multi-passage',
    question: 'What are the attendance and placement eligibility requirements?',
    expectedType: 'answered',
    expectedKeywords: ['75', '6.5'],
    description: 'Should combine attendance 75% and placement CGPA 6.5 from two documents.',
  },
  {
    id: 't19',
    category: 'multi-passage',
    question: 'What are the library borrowing limits and the overdue fine?',
    expectedType: 'answered',
    expectedKeywords: ['4', '2'],
    description: 'Should combine 4 books limit and Rs. 2 fine from Library Rules.',
  },
  // 1 vague question
  {
    id: 't20',
    category: 'vague',
    question: 'Tell me about fees',
    expectedType: 'answered',
    expectedKeywords: ['fee', 'tuition', 'rs'],
    description: 'Vague query should still match fee structure and return relevant info.',
  },
  // 1 paraphrased question
  {
    id: 't21',
    category: 'paraphrased',
    question: 'When do I need to be back at the hostel at night?',
    expectedType: 'answered',
    expectedKeywords: ['9:30'],
    description: 'Paraphrase of curfew question — should match hostel gate closing time.',
  },
];

export function runTests(): TestReport {
  const results: TestResult[] = [];

  for (const tc of TEST_CASES) {
    const result = answerQuestion(tc.question);

    let correct = false;
    let reason = '';

    if (tc.expectedType === 'insufficient') {
      correct = result.status === 'insufficient' && result.answer === 'Insufficient evidence.';
      reason = correct
        ? 'Correctly returned insufficient evidence.'
        : `Expected insufficient evidence but got: "${result.answer.slice(0, 80)}"`;
    } else {
      if (result.status !== 'answered') {
        correct = false;
        reason = 'Expected an answer but got insufficient evidence.';
      } else if (tc.expectedKeywords && tc.expectedKeywords.length > 0) {
        const lower = result.answer.toLowerCase();
        const matched = tc.expectedKeywords.filter((k) => lower.includes(k.toLowerCase()));
        if (matched.length > 0) {
          correct = true;
          reason = `Answer contains expected keywords: ${matched.join(', ')}.`;
        } else {
          correct = false;
          reason = `Answer missing expected keywords (${tc.expectedKeywords.join(', ')}). Got: "${result.answer.slice(0, 100)}"`;
        }
      } else {
        correct = result.status === 'answered';
        reason = correct ? 'Answer provided.' : 'No answer provided.';
      }
    }

    if (result.status === 'answered' && result.citations.length === 0) {
      correct = false;
      reason += ' Answer provided without citations.';
    }

    results.push({
      case: tc,
      answer: result.answer,
      status: result.status,
      citations: result.citations,
      correct,
      processingTimeMs: result.processingTimeMs,
      reason,
    });
  }

  const total = results.length;
  const correctCount = results.filter((r) => r.correct).length;
  const incorrect = total - correctCount;
  const accuracy = Math.round((correctCount / total) * 1000) / 10;

  return {
    results,
    total,
    correct: correctCount,
    incorrect,
    accuracy,
    ranAt: new Date().toISOString(),
    executed: true,
  };
}
