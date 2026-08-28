import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbAll, dbRun } from '../database/db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { createNotification, logActivity, publishCampusPulse } from '../services/notification.service';

const router = Router();

router.use(authMiddleware);

// GET /api/assessments - List assessments
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const collegeId = user.college_id;
  const { subjectId, departmentId } = req.query;

  let query = `
    SELECT a.*, s.name as subject_name, s.code as subject_code,
           d.name as department_name, u.full_name as faculty_name,
           (SELECT COUNT(*) FROM assessment_questions WHERE assessment_id = a.id) as question_count,
           (SELECT COUNT(*) FROM assessment_submissions WHERE assessment_id = a.id) as total_submissions
    FROM assessments a
    JOIN subjects s ON a.subject_id = s.id
    JOIN departments d ON a.department_id = d.id
    JOIN users u ON a.faculty_id = u.id
    WHERE a.college_id = ?
  `;

  const params: any[] = [collegeId];

  if (subjectId) {
    query += ` AND a.subject_id = ?`;
    params.push(subjectId);
  }

  if (departmentId) {
    query += ` AND a.department_id = ?`;
    params.push(departmentId);
  } else if (user.role === 'STUDENT') {
    const studentProfile = dbGet(`SELECT department_id FROM student_profiles WHERE user_id = ?`, [user.id]);
    if (studentProfile) {
      query += ` AND a.department_id = ?`;
      params.push(studentProfile.department_id);
    }
  }

  query += ` ORDER BY a.created_at DESC`;

  const rawAssessments = dbAll(query, params);

  // If student, attach submission status
  const assessments = rawAssessments.map((a: any) => {
    if (user.role === 'STUDENT') {
      const submission = dbGet(
        `SELECT id, score, total_marks, percentage, submitted_at FROM assessment_submissions WHERE assessment_id = ? AND student_id = ?`,
        [a.id, user.id]
      );
      return {
        ...a,
        isSubmitted: !!submission,
        submission: submission || null,
      };
    }
    return a;
  });

  res.json({ assessments });
});

// POST /api/assessments - Faculty creates assessment
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'FACULTY' && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Only faculty or admin can create assessments' });
    return;
  }

  const {
    subjectId,
    departmentId,
    title,
    instructions,
    durationMinutes,
    startDate,
    endDate,
    questions,
  } = req.body;

  if (!subjectId || !title || !questions || !Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({ error: 'Subject, Title, and at least 1 Question are required' });
    return;
  }

  const subject = dbGet(`SELECT id, department_id, name FROM subjects WHERE id = ?`, [subjectId]);
  if (!subject) {
    res.status(404).json({ error: 'Subject not found' });
    return;
  }

  const deptId = departmentId || subject.department_id;
  const assessmentId = uuidv4();
  const totalMarks = questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 1), 0);

  dbRun(
    `INSERT INTO assessments (id, college_id, department_id, subject_id, faculty_id, title, instructions, duration_minutes, start_date, end_date, total_marks, is_published, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
    [
      assessmentId,
      user.college_id,
      deptId,
      subjectId,
      user.id,
      title,
      instructions || 'Complete the test within the allocated time limit.',
      Number(durationMinutes) || 15,
      startDate || new Date().toISOString(),
      endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalMarks,
    ]
  );

  // Insert questions
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const qId = uuidv4();
    dbRun(
      `INSERT INTO assessment_questions (id, assessment_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, marks, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        qId,
        assessmentId,
        i + 1,
        q.question_text || q.question,
        q.option_a || q.optionA,
        q.option_b || q.optionB,
        q.option_c || q.optionC,
        q.option_d || q.optionD,
        (q.correct_option || q.correctOption || 'A').toUpperCase(),
        Number(q.marks) || 1,
        q.explanation || 'Refer to classroom study materials for details.',
      ]
    );
  }

  // Notify students
  const students = dbAll(`SELECT user_id FROM student_profiles WHERE department_id = ?`, [deptId]);
  students.forEach((s) => {
    createNotification({
      college_id: user.college_id,
      user_id: s.user_id,
      type: 'NEW_ASSESSMENT',
      title: `New Assessment: ${title}`,
      message: `${questions.length} questions in ${subject.name}. Due on ${new Date(endDate || Date.now() + 7 * 86400000).toLocaleDateString()}`,
      link_url: `/assessments`,
    });
  });

  logActivity(
    user.college_id,
    user.id,
    user.full_name,
    user.role,
    'ASSESSMENT_PUBLISHED',
    `Published ${questions.length}-question assessment: "${title}" for ${subject.name}`
  );

  publishCampusPulse(
    user.college_id,
    `New Assessment: ${title}`,
    `An online quiz with ${questions.length} questions is now open for ${subject.name}.`,
    'Assessment',
    'CheckCircle',
    user.full_name
  );

  res.status(201).json({ message: 'Assessment created successfully', assessmentId });
});

// GET /api/assessments/:assessmentId - Test taking view (hides correct answers for students before submission)
router.get('/:assessmentId', (req: AuthenticatedRequest, res: Response) => {
  const { assessmentId } = req.params;
  const user = req.user!;

  const assessment = dbGet(
    `SELECT a.*, s.name as subject_name, s.code as subject_code, u.full_name as faculty_name
     FROM assessments a
     JOIN subjects s ON a.subject_id = s.id
     JOIN users u ON a.faculty_id = u.id
     WHERE a.id = ? AND a.college_id = ?`,
    [assessmentId, user.college_id]
  );

  if (!assessment) {
    res.status(404).json({ error: 'Assessment not found' });
    return;
  }

  const isFacultyOrAdmin = user.role === 'FACULTY' || user.role === 'ADMIN';

  // Check if student already submitted
  const existingSubmission = dbGet(
    `SELECT * FROM assessment_submissions WHERE assessment_id = ? AND student_id = ?`,
    [assessmentId, user.id]
  );

  let questions = [];
  if (isFacultyOrAdmin || existingSubmission) {
    // Return questions with correct answers & explanations
    questions = dbAll(
      `SELECT * FROM assessment_questions WHERE assessment_id = ? ORDER BY question_number ASC`,
      [assessmentId]
    );
  } else {
    // Return sanitized questions for live testing
    questions = dbAll(
      `SELECT id, assessment_id, question_number, question_text, option_a, option_b, option_c, option_d, marks 
       FROM assessment_questions WHERE assessment_id = ? ORDER BY question_number ASC`,
      [assessmentId]
    );
  }

  res.json({
    assessment,
    questions,
    submission: existingSubmission ? {
      ...existingSubmission,
      answers: JSON.parse(existingSubmission.answers_json || '{}'),
    } : null,
  });
});

// POST /api/assessments/:assessmentId/submit - Student submits answers for instant auto-grading
router.post('/:assessmentId/submit', (req: AuthenticatedRequest, res: Response) => {
  const { assessmentId } = req.params;
  const user = req.user!;
  const { answers, timeTakenSeconds } = req.body; // answers: { [question_number]: 'A' | 'B' | 'C' | 'D' }

  if (user.role !== 'STUDENT') {
    res.status(403).json({ error: 'Only students can submit assessments' });
    return;
  }

  const assessment = dbGet(`SELECT * FROM assessments WHERE id = ? AND college_id = ?`, [assessmentId, user.college_id]);
  if (!assessment) {
    res.status(404).json({ error: 'Assessment not found' });
    return;
  }

  // Check if already submitted
  const already = dbGet(`SELECT id FROM assessment_submissions WHERE assessment_id = ? AND student_id = ?`, [assessmentId, user.id]);
  if (already) {
    res.status(400).json({ error: 'You have already submitted this assessment.' });
    return;
  }

  // Fetch all official questions and correct options
  const questions = dbAll(
    `SELECT id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, marks, explanation
     FROM assessment_questions WHERE assessment_id = ? ORDER BY question_number ASC`,
    [assessmentId]
  );

  let totalScore = 0;
  let maxMarks = 0;
  const questionResults = [];

  for (const q of questions) {
    maxMarks += q.marks;
    const selected = answers ? answers[q.question_number] || answers[q.id] : null;
    const isCorrect = selected && selected.toUpperCase() === q.correct_option.toUpperCase();
    if (isCorrect) {
      totalScore += q.marks;
    }

    questionResults.push({
      questionNumber: q.question_number,
      questionText: q.question_text,
      options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
      selectedOption: selected ? selected.toUpperCase() : 'Not Answered',
      correctOption: q.correct_option,
      isCorrect,
      marksAwarded: isCorrect ? q.marks : 0,
      marksPossible: q.marks,
      explanation: q.explanation,
    });
  }

  const percentage = maxMarks > 0 ? Number(((totalScore / maxMarks) * 100).toFixed(1)) : 0.0;
  const submissionId = uuidv4();

  dbRun(
    `INSERT INTO assessment_submissions (id, assessment_id, student_id, score, total_marks, percentage, answers_json, time_taken_seconds, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [submissionId, assessmentId, user.id, totalScore, maxMarks, percentage, JSON.stringify(answers || {}), timeTakenSeconds || 0]
  );

  // Notify faculty
  createNotification({
    college_id: user.college_id,
    user_id: assessment.faculty_id,
    type: 'ASSESSMENT_SUBMISSION',
    title: `Assessment Submitted: ${assessment.title}`,
    message: `${user.full_name} completed the test with score ${totalScore}/${maxMarks} (${percentage}%).`,
    link_url: `/assessments/${assessmentId}/analytics`,
  });

  logActivity(
    user.college_id,
    user.id,
    user.full_name,
    user.role,
    'TEST_SUBMITTED',
    `Submitted test "${assessment.title}" — Score: ${totalScore}/${maxMarks} (${percentage}%)`
  );

  res.status(201).json({
    message: 'Assessment evaluated and submitted successfully!',
    result: {
      submissionId,
      score: totalScore,
      totalMarks: maxMarks,
      percentage,
      timeTakenSeconds,
      questionResults,
    },
  });
});

// GET /api/assessments/:assessmentId/analytics - Faculty & Admin assessment performance analytics
router.get('/:assessmentId/analytics', (req: AuthenticatedRequest, res: Response) => {
  const { assessmentId } = req.params;
  const user = req.user!;

  const assessment = dbGet(
    `SELECT a.*, s.name as subject_name, d.name as department_name, u.full_name as faculty_name
     FROM assessments a
     JOIN subjects s ON a.subject_id = s.id
     JOIN departments d ON a.department_id = d.id
     JOIN users u ON a.faculty_id = u.id
     WHERE a.id = ? AND a.college_id = ?`,
    [assessmentId, user.college_id]
  );

  if (!assessment) {
    res.status(404).json({ error: 'Assessment not found' });
    return;
  }

  // Submissions with student info
  const submissions = dbAll(
    `SELECT sub.*, u.full_name as student_name, u.email as student_email,
            sp.roll_number, sp.section, sp.year
     FROM assessment_submissions sub
     JOIN users u ON sub.student_id = u.id
     JOIN student_profiles sp ON u.id = sp.user_id
     WHERE sub.assessment_id = ?
     ORDER BY sub.score DESC`,
    [assessmentId]
  );

  const totalSubmissions = submissions.length;
  let avgScore = 0;
  let highScore = 0;
  let lowScore = assessment.total_marks;

  if (totalSubmissions > 0) {
    const sum = submissions.reduce((acc, curr) => acc + curr.score, 0);
    avgScore = Number((sum / totalSubmissions).toFixed(1));
    highScore = Math.max(...submissions.map((s) => s.score));
    lowScore = Math.min(...submissions.map((s) => s.score));
  } else {
    lowScore = 0;
  }

  res.json({
    assessment,
    analytics: {
      totalSubmissions,
      averageScore: avgScore,
      highestScore: highScore,
      lowestScore: lowScore,
      passRate: totalSubmissions > 0
        ? Number(((submissions.filter((s) => s.percentage >= 50).length / totalSubmissions) * 100).toFixed(1))
        : 0,
    },
    submissions,
  });
});

export default router;
