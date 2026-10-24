"""Test runner — 21 test cases covering all required categories."""

import time
from datetime import datetime, timezone
from app.rag import answer_question

TEST_CASES = [
    # 10+ answerable
    {"id": "t1", "category": "answerable", "question": "What is the grading system used by the college?",
     "expected_type": "answered", "expected_keywords": ["10-point", "grading"],
     "description": "Should return the 10-point grading system from Academic Rules."},
    {"id": "t2", "category": "answerable", "question": "How many credits are required to graduate?",
     "expected_type": "answered", "expected_keywords": ["160", "credits"],
     "description": "Should state the 160-credit minimum from Academic Rules."},
    {"id": "t3", "category": "answerable", "question": "What is the fine for overdue library books?",
     "expected_type": "answered", "expected_keywords": ["2", "fine", "day"],
     "description": "Should return Rs. 2 per day from Library Rules."},
    {"id": "t4", "category": "answerable", "question": "How many books can undergraduate students borrow from the library?",
     "expected_type": "answered", "expected_keywords": ["4", "books", "14"],
     "description": "Should return 4 books for 14 days from Library Rules."},
    {"id": "t5", "category": "answerable", "question": "What is the minimum attendance required to appear for end-semester exams?",
     "expected_type": "answered", "expected_keywords": ["75"],
     "description": "Should return 75% minimum from Attendance Policy."},
    {"id": "t6", "category": "answerable", "question": "What is the annual tuition fee for engineering programs?",
     "expected_type": "answered", "expected_keywords": ["1,20,000"],
     "description": "Should return Rs. 1,20,000 from Fee Structure."},
    {"id": "t7", "category": "answerable", "question": "What CGPA is required for the merit scholarship?",
     "expected_type": "answered", "expected_keywords": ["8.5"],
     "description": "Should return CGPA 8.5 from Scholarships document."},
    {"id": "t8", "category": "answerable", "question": "What is the hostel curfew time?",
     "expected_type": "answered", "expected_keywords": ["9:30"],
     "description": "Should return 9:30 PM from Hostel Handbook."},
    {"id": "t9", "category": "answerable", "question": "What is the penalty for examination malpractice?",
     "expected_type": "answered", "expected_keywords": ["debarred", "semester"],
     "description": "Should return debarment from Examination Policy."},
    {"id": "t10", "category": "answerable", "question": "Who is the grievance redressal officer?",
     "expected_type": "answered", "expected_keywords": ["sharma"],
     "description": "Should return Professor R. Sharma from Grievance Policy."},
    {"id": "t11", "category": "answerable", "question": "What is the minimum internship duration?",
     "expected_type": "answered", "expected_keywords": ["6", "weeks"],
     "description": "Should return 6 weeks from Internship Policy."},
    # 5+ unanswerable
    {"id": "t12", "category": "unanswerable", "question": "What is the weather like on campus today?",
     "expected_type": "insufficient", "expected_keywords": [],
     "description": "No document covers weather — must return insufficient evidence."},
    {"id": "t13", "category": "unanswerable", "question": "What is the college cafeteria menu for next Tuesday?",
     "expected_type": "insufficient", "expected_keywords": [],
     "description": "No cafeteria menu in documents — must return insufficient evidence."},
    {"id": "t14", "category": "unanswerable", "question": "How do I register for a marathon happening in the city?",
     "expected_type": "insufficient", "expected_keywords": [],
     "description": "Marathon registration not in documents — must return insufficient evidence."},
    {"id": "t15", "category": "unanswerable", "question": "What is the salary of the college principal?",
     "expected_type": "insufficient", "expected_keywords": [],
     "description": "Staff salaries not in documents — must return insufficient evidence."},
    {"id": "t16", "category": "unanswerable", "question": "Which bus routes serve the college?",
     "expected_type": "insufficient", "expected_keywords": [],
     "description": "Transport routes not in documents — must return insufficient evidence."},
    {"id": "t17", "category": "unanswerable", "question": "What is the recipe for the mess paneer curry?",
     "expected_type": "insufficient", "expected_keywords": [],
     "description": "Recipes not in documents — must return insufficient evidence."},
    # 2 multi-passage
    {"id": "t18", "category": "multi-passage", "question": "What are the attendance and placement eligibility requirements?",
     "expected_type": "answered", "expected_keywords": ["75", "6.5"],
     "description": "Should combine attendance 75% and placement CGPA 6.5 from two documents."},
    {"id": "t19", "category": "multi-passage", "question": "What are the library borrowing limits and the overdue fine?",
     "expected_type": "answered", "expected_keywords": ["4", "2"],
     "description": "Should combine 4 books limit and Rs. 2 fine from Library Rules."},
    # 1 vague
    {"id": "t20", "category": "vague", "question": "Tell me about fees",
     "expected_type": "answered", "expected_keywords": ["fee", "tuition", "rs"],
     "description": "Vague query should still match fee structure and return relevant info."},
    # 1 paraphrased
    {"id": "t21", "category": "paraphrased", "question": "When do I need to be back at the hostel at night?",
     "expected_type": "answered", "expected_keywords": ["9:30"],
     "description": "Paraphrase of curfew question — should match hostel gate closing time."},
]


def run_all_tests() -> dict:
    """Execute all test cases against the RAG pipeline and return a report."""
    results = []

    for tc in TEST_CASES:
        start = time.time()
        result = answer_question(tc["question"])
        elapsed = int((time.time() - start) * 1000)

        correct = False
        reason = ""

        if tc["expected_type"] == "insufficient":
            correct = result["status"] == "insufficient" and result["answer"] == "Insufficient evidence."
            reason = ("Correctly returned insufficient evidence."
                      if correct
                      else f'Expected insufficient evidence but got: "{result["answer"][:80]}"')
        else:
            if result["status"] != "answered":
                correct = False
                reason = "Expected an answer but got insufficient evidence."
            elif tc["expected_keywords"]:
                lower = result["answer"].lower()
                matched = [k for k in tc["expected_keywords"] if k.lower() in lower]
                if matched:
                    correct = True
                    reason = f"Answer contains expected keywords: {', '.join(matched)}."
                else:
                    correct = False
                    reason = (f'Answer missing expected keywords ({", ".join(tc["expected_keywords"])}). '
                              f'Got: "{result["answer"][:100]}"')
            else:
                correct = result["status"] == "answered"
                reason = "Answer provided." if correct else "No answer provided."

        if result["status"] == "answered" and not result["citations"]:
            correct = False
            reason += " Answer provided without citations."

        results.append({
            "case": {
                "id": tc["id"],
                "category": tc["category"],
                "question": tc["question"],
                "expected_type": tc["expected_type"],
                "expected_keywords": tc["expected_keywords"],
                "description": tc["description"],
            },
            "answer": result["answer"],
            "status": result["status"],
            "citations": result["citations"],
            "correct": correct,
            "processing_time_ms": elapsed,
            "reason": reason,
        })

    total = len(results)
    correct_count = sum(1 for r in results if r["correct"])
    incorrect = total - correct_count
    accuracy = round((correct_count / total) * 100, 1) if total > 0 else 0

    return {
        "results": results,
        "total": total,
        "correct": correct_count,
        "incorrect": incorrect,
        "accuracy": accuracy,
        "ran_at": datetime.now(timezone.utc).isoformat(),
        "executed": True,
    }
