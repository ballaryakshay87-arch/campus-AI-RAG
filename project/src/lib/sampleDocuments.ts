export interface SampleDoc {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'md';
  content: string;
}

const header = (name: string) =>
  `This is DEMO sample policy data for the College Knowledge Assistant, not verified facts about a real college.\n\n# ${name}\n\n`;

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'sample-academic-rules',
    name: 'Academic Rules and Regulations 2024-25.pdf',
    type: 'pdf',
    content:
      header('Academic Rules and Regulations 2024-25') +
      `Section 1: Grading System\n` +
      `The college follows a 10-point grading system. Grades are assigned as follows: O (Outstanding, 10 points, 90-100%), A+ (9 points, 80-89%), A (8 points, 70-79%), B+ (7 points, 60-69%), B (6 points, 50-59%), C (5 points, 45-49%), P (4 points, 40-44%), F (Fail, below 40%).\n\n` +
      `Section 2: Semester Structure\n` +
      `Each academic year consists of two semesters. The odd semester runs from August to December and the even semester runs from January to May. Each semester has 18 weeks of instruction including mid-semester and end-semester examinations.\n\n` +
      `Section 3: Minimum Credits\n` +
      `A student must earn a minimum of 160 credits to graduate with a Bachelor's degree. Each course carries between 2 and 4 credits depending on contact hours.\n\n` +
      `Section 4: Promotion Rules\n` +
      `A student is promoted to the next semester only if they have earned at least 50% of the credits offered in the previous semester. Students failing to meet this requirement must repeat the semester.`,
  },
  {
    id: 'sample-examination-policy',
    name: 'Examination Policy 2024-25.pdf',
    type: 'pdf',
    content:
      header('Examination Policy 2024-25') +
      `Section 1: Examination Schedule\n` +
      `End-semester examinations are conducted during the last two weeks of each semester. Mid-semester examinations are held in the 8th week. The examination timetable is published at least 30 days before the exams begin.\n\n` +
      `Section 2: Hall Ticket\n` +
      `Students must carry a printed hall ticket and a valid college ID card to every examination. Entry to the exam hall is not permitted without these documents.\n\n` +
      `Section 3: Malpractice\n` +
      `Any student found guilty of malpractice during an examination will be debarred from all examinations for one full semester and the current exam will be cancelled. Repeat offences lead to expulsion from the college.\n\n` +
      `Section 4: Re-evaluation\n` +
      `Students may apply for re-evaluation of end-semester answer scripts within 10 days of result publication. The re-evaluation fee is Rs. 500 per subject. Re-evaluated marks are final and binding.`,
  },
  {
    id: 'sample-library-rules',
    name: 'Library Rules and Services.pdf',
    type: 'pdf',
    content:
      header('Library Rules and Services') +
      `Section 1: Membership and Access\n` +
      `All enrolled students are automatically members of the college library. The library is open from 8:30 AM to 8:00 PM on all working days. Students must swipe their college ID card at the entrance.\n\n` +
      `Section 2: Borrowing Limits\n` +
      `Undergraduate students may borrow up to 4 books at a time for a period of 14 days. Postgraduate students may borrow up to 6 books for 21 days. Reference books and journals are not issued and must be read within the library.\n\n` +
      `Section 3: Overdue Fines\n` +
      `A fine of Rs. 2 per day is charged for each overdue book. If a book is overdue by more than 30 days, borrowing privileges are suspended until the book is returned and the fine is paid.\n\n` +
      `Section 4: Lost Books\n` +
      `If a borrowed book is lost, the student must either replace it with the same or latest edition or pay twice the current market price of the book.`,
  },
  {
    id: 'sample-hostel-rules',
    name: 'Hostel Handbook 2024-25.pdf',
    type: 'pdf',
    content:
      header('Hostel Handbook 2024-25') +
      `Section 1: Allocation\n` +
      `Hostel seats are allotted based on academic merit and distance from residence. First-year students are given priority for hostel accommodation. The annual hostel fee for boys is Rs. 35,000 and for girls is Rs. 33,000 inclusive of food.\n\n` +
      `Section 2: Curfew and Entry\n` +
      `Hostel gates close at 9:30 PM. Students must return to the hostel before the gate closing time. Late entry requires prior written permission from the hostel warden. Repeated late entries may result in eviction from the hostel.\n\n` +
      `Section 3: Visitors\n` +
      `Visitors are allowed only between 10:00 AM and 5:00 PM. No overnight guests are permitted. Parents may visit on the second Saturday of every month.\n\n` +
      `Section 4: Mess Timings\n` +
      `Breakfast is served from 7:30 AM to 9:00 AM, lunch from 12:30 PM to 2:00 PM, snacks from 4:30 PM to 5:30 PM, and dinner from 7:30 PM to 9:00 PM.`,
  },
  {
    id: 'sample-scholarships',
    name: 'Scholarship and Financial Aid.pdf',
    type: 'pdf',
    content:
      header('Scholarship and Financial Aid') +
      `Section 1: Merit Scholarship\n` +
      `Students who achieve a CGPA of 8.5 or above in a semester are eligible for a merit scholarship of Rs. 10,000 per semester. The scholarship is credited to the student's bank account within 60 days of result publication.\n\n` +
      `Section 2: Need-Based Financial Aid\n` +
      `Students with family annual income below Rs. 3 lakhs are eligible for need-based financial aid covering up to 50% of tuition fees. Applications must be submitted with income proof to the financial aid office by August 31st each year.\n\n` +
      `Section 3: Sports Scholarship\n` +
      `Students representing the college at the state or national level in sports receive a scholarship of Rs. 7,500 per semester and exemption from attendance for the days of participation.\n\n` +
      `Section 4: Research Grant\n` +
      `Undergraduate students undertaking research projects can apply for a grant of up to Rs. 25,000. The proposal must be approved by the department head and the research committee.`,
  },
  {
    id: 'sample-fee-structure',
    name: 'Fee Structure 2024-25.pdf',
    type: 'pdf',
    content:
      header('Fee Structure 2024-25') +
      `Section 1: Tuition Fees\n` +
      `The annual tuition fee for Bachelor of Engineering programs is Rs. 1,20,000. For Bachelor of Science programs it is Rs. 75,000. For postgraduate programs the annual tuition fee is Rs. 90,000. Fees must be paid in two equal instalments before August 15th and January 15th.\n\n` +
      `Section 2: Other Fees\n` +
      `A one-time admission fee of Rs. 5,000 is charged at the time of admission. The library fee is Rs. 1,500 per year, the examination fee is Rs. 2,000 per year, and the sports and cultural fee is Rs. 1,000 per year.\n\n` +
      `Section 3: Late Payment\n` +
      `A late fee of Rs. 500 per week is charged for overdue tuition payments. If fees remain unpaid for more than 4 weeks, the student's access to classes and examinations may be withheld.\n\n` +
      `Section 4: Refunds\n` +
      `If a student withdraws admission before the start of classes, 90% of the tuition fee is refunded. Withdrawal within 30 days of class commencement gets a 50% refund. No refund is given after 30 days.`,
  },
  {
    id: 'sample-attendance-policy',
    name: 'Attendance Policy.pdf',
    type: 'pdf',
    content:
      header('Attendance Policy') +
      `Section 1: Minimum Attendance\n` +
      `Every student must maintain a minimum of 75% attendance in each course to be eligible to appear for the end-semester examination. Attendance is calculated from the total number of classes conducted.\n\n` +
      `Section 2: Condonation\n` +
      `Students with attendance between 60% and 74% may apply for condonation on medical grounds with a valid medical certificate. A condonation fee of Rs. 1,000 per subject is charged. Students below 60% attendance are not eligible for condonation.\n\n` +
      `Section 3: Medical Leave\n` +
      `Medical leave is granted for a maximum of 10 days per semester on submission of a certificate from a registered medical practitioner. Medical leave does not count against attendance.\n\n` +
      `Section 4: Attendance Shortage\n` +
      `Students falling short of 75% attendance without valid condonation will not be permitted to write the end-semester examination and must repeat the course in the next available semester.`,
  },
  {
    id: 'sample-placements',
    name: 'Placement Cell Guidelines.pdf',
    type: 'pdf',
    content:
      header('Placement Cell Guidelines') +
      `Section 1: Registration\n` +
      `All final-year students who wish to participate in campus placements must register with the placement cell by August 31st. Registration is free and requires submission of an updated resume and academic transcripts.\n\n` +
      `Section 2: Eligibility\n` +
      `To be eligible for campus placements, students must maintain a CGPA of 6.5 or above, have no active backlogs, and have attendance of 75% or above. Some companies may set higher CGPA requirements.\n\n` +
      `Section 3: Placement Process\n` +
      `The placement season runs from September to March. Companies conduct pre-placement talks followed by aptitude tests, technical interviews, and HR interviews. Selected students receive offer letters within 15 days.\n\n` +
      `Section 4: Offer Acceptance\n` +
      `A student who accepts a placement offer is not eligible to sit for further companies in the same season unless permitted by the placement cell. Accepting multiple offers is not allowed.`,
  },
  {
    id: 'sample-conduct',
    name: 'Code of Conduct.pdf',
    type: 'pdf',
    content:
      header('Code of Conduct') +
      `Section 1: General Behaviour\n` +
      `Students are expected to maintain discipline and decorum on campus. Ragging in any form is strictly prohibited and is a punishable offence under the Anti-Ragging Act. Violations may result in suspension or expulsion.\n\n` +
      `Section 2: Dress Code\n` +
      `Students must wear decent and appropriate clothing. Casual wear such as shorts and sleeveless tops is not permitted in academic buildings. Lab courses require closed shoes.\n\n` +
      `Section 3: Anti-Ragging Committee\n` +
      `An anti-ragging committee is constituted every academic year. Complaints can be filed with the committee within 7 days of any incident. The committee must resolve complaints within 30 days.\n\n` +
      `Section 4: Disciplinary Action\n` +
      `Depending on severity, disciplinary action ranges from a written warning, to fine, to suspension, to expulsion. All disciplinary actions are recorded in the student's file.`,
  },
  {
    id: 'sample-timetable',
    name: 'Class Timetable 2024-25.pdf',
    type: 'pdf',
    content:
      header('Class Timetable 2024-25') +
      `Section 1: Class Hours\n` +
      `Classes are conducted in six periods per day. Period 1 is from 9:00 AM to 9:50 AM, Period 2 from 9:50 AM to 10:40 AM, Period 3 from 11:00 AM to 11:50 AM, Period 4 from 11:50 AM to 12:40 PM, Period 5 from 2:00 PM to 2:50 PM, and Period 6 from 2:50 PM to 3:40 PM.\n\n` +
      `Section 2: Breaks\n` +
      `There is a 20-minute tea break from 10:40 AM to 11:00 AM and a lunch break from 12:40 PM to 2:00 PM. No classes are scheduled during breaks.\n\n` +
      `Section 3: Friday Schedule\n` +
      `Friday afternoons from 2:00 PM to 4:00 PM are reserved for club activities, seminars, and guest lectures. Attendance at these sessions is mandatory and counts toward the 75% attendance requirement.`,
  },
  {
    id: 'sample-grievance',
    name: 'Grievance Redressal Policy.pdf',
    type: 'pdf',
    content:
      header('Grievance Redressal Policy') +
      `Section 1: Filing a Grievance\n` +
      `Students may file a grievance through the online grievance portal or by submitting a written complaint to the grievance redressal officer. The grievance officer for the academic year 2024-25 is Professor R. Sharma, located in Room 104 of the Administrative Block.\n\n` +
      `Section 2: Response Time\n` +
      `Grievances are acknowledged within 3 working days and resolved within 15 working days. If a grievance is not resolved within this period, the student may escalate it to the Principal.\n\n` +
      `Section 3: Grievance Categories\n` +
      `Grievances may relate to academics, examinations, hostel, library, fees, or harassment. Each category is handled by a designated sub-committee that reports to the grievance redressal officer.\n\n` +
      `Section 4: Confidentiality\n` +
      `All grievances are treated with strict confidentiality. The identity of the complainant is protected and retaliation against complainants is treated as a serious disciplinary offence.`,
  },
  {
    id: 'sample-internship-policy',
    name: 'Internship Policy.pdf',
    type: 'docx',
    content:
      header('Internship Policy') +
      `Section 1: Duration and Timing\n` +
      `Every undergraduate student must complete a mandatory internship of at least 6 weeks duration. The internship is typically undertaken at the end of the sixth semester during the summer break.\n\n` +
      `Section 2: Approval Process\n` +
      `Students must get their internship offer and project plan approved by the faculty internship coordinator at least 30 days before the start date. Internships at unapproved organisations are not credited.\n\n` +
      `Section 3: Evaluation\n` +
      `Internships are evaluated based on a supervisor's report, a student submission report, and a presentation. The internship carries 2 credits and the grade appears on the transcript as Internship (IN).\n\n` +
      `Section 4: Stipend\n` +
      `The college does not guarantee a stipend for internships. However, students receiving a stipend of more than Rs. 10,000 per month must inform the placement cell for record-keeping.`,
  },
];
