import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbAll, dbRun } from '../database/db';
import { authMiddleware, requireFaculty, AuthenticatedRequest } from '../middleware/auth';
import { createNotification, logActivity } from '../services/notification.service';

const router = Router();

router.use(authMiddleware);

// GET /api/attendance/class-roster - Get roster for attendance marking
router.get('/class-roster', requireFaculty, (req: AuthenticatedRequest, res: Response) => {
  const { subjectId, date, periodNumber } = req.query;
  const user = req.user!;

  if (!subjectId) {
    res.status(400).json({ error: 'Subject ID is required' });
    return;
  }

  const subject = dbGet(`SELECT s.*, d.name as department_name FROM subjects s JOIN departments d ON s.department_id = d.id WHERE s.id = ?`, [subjectId]);
  if (!subject) {
    res.status(404).json({ error: 'Subject not found' });
    return;
  }

  // Get all approved students in this department
  const students = dbAll(
    `SELECT u.id as student_id, u.full_name, u.email, u.avatar_url,
            sp.roll_number, sp.course, sp.year, sp.section
     FROM users u
     JOIN student_profiles sp ON u.id = sp.user_id
     WHERE sp.department_id = ? AND u.status = 'APPROVED'
     ORDER BY sp.roll_number ASC`,
    [subject.department_id]
  );

  // If date & period provided, fetch existing records if already marked
  const targetDate = (date as string) || new Date().toISOString().split('T')[0];
  const targetPeriod = Number(periodNumber) || 1;

  const existingRecords = dbAll(
    `SELECT student_id, status, notes FROM attendance_records
     WHERE subject_id = ? AND date = ? AND period_number = ?`,
    [subjectId, targetDate, targetPeriod]
  );

  const statusMap = new Map<string, { status: string; notes?: string }>();
  existingRecords.forEach((r) => statusMap.set(r.student_id, { status: r.status, notes: r.notes }));

  const roster = students.map((st) => ({
    ...st,
    status: statusMap.get(st.student_id)?.status || 'PRESENT',
    notes: statusMap.get(st.student_id)?.notes || '',
    isAlreadyMarked: statusMap.has(st.student_id),
  }));

  res.json({
    subject,
    date: targetDate,
    periodNumber: targetPeriod,
    roster,
  });
});

// POST /api/attendance/mark - Batch submit attendance for a period
router.post('/mark', requireFaculty, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { subjectId, date, periodNumber, records } = req.body; // records: [{ studentId, status: 'PRESENT'|'ABSENT'|'ON_DUTY', notes }]

  if (!subjectId || !date || !periodNumber || !records || !Array.isArray(records)) {
    res.status(400).json({ error: 'Subject, Date, Period, and Records array are required' });
    return;
  }

  const subject = dbGet(`SELECT id, department_id, name, code FROM subjects WHERE id = ?`, [subjectId]);
  if (!subject) {
    res.status(404).json({ error: 'Subject not found' });
    return;
  }

  const collegeSettings = dbGet(`SELECT * FROM college_settings WHERE college_id = ?`, [user.college_id]);
  const warningThreshold = collegeSettings?.attendance_threshold_warning || 70.0;

  for (const r of records) {
    // Check if record exists
    const existing = dbGet(
      `SELECT id FROM attendance_records WHERE subject_id = ? AND student_id = ? AND date = ? AND period_number = ?`,
      [subjectId, r.studentId, date, Number(periodNumber)]
    );

    if (existing) {
      dbRun(
        `UPDATE attendance_records SET status = ?, notes = ? WHERE id = ?`,
        [r.status, r.notes || null, existing.id]
      );
    } else {
      dbRun(
        `INSERT INTO attendance_records (id, college_id, department_id, subject_id, faculty_id, student_id, date, period_number, status, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [uuidv4(), user.college_id, subject.department_id, subjectId, user.id, r.studentId, date, Number(periodNumber), r.status, r.notes || null]
      );
    }

    // Check student's new attendance percentage in this subject
    const stats = dbGet(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'PRESENT' OR status = 'ON_DUTY' THEN 1 ELSE 0 END) as attended
       FROM attendance_records
       WHERE subject_id = ? AND student_id = ?`,
      [subjectId, r.studentId]
    );

    if (stats?.total >= 5) {
      const pct = (stats.attended / stats.total) * 100;
      if (pct < warningThreshold && r.status === 'ABSENT') {
        createNotification({
          college_id: user.college_id,
          user_id: r.studentId,
          type: 'ATTENDANCE_WARNING',
          title: `Attendance Alert: ${subject.name}`,
          message: `Your current attendance in ${subject.name} is ${pct.toFixed(1)}% (below the ${warningThreshold}% policy threshold).`,
          link_url: '/attendance',
        });
      }
    }
  }

  logActivity(
    user.college_id,
    user.id,
    user.full_name,
    user.role,
    'ATTENDANCE_MARKED',
    `Marked Period ${periodNumber} attendance for ${records.length} students in ${subject.name} on ${date}`
  );

  res.json({ message: `Successfully recorded attendance for ${records.length} students` });
});

// GET /api/attendance/summary - College & Department Level Attendance Analytics
router.get('/summary', (req: AuthenticatedRequest, res: Response) => {
  const collegeId = req.user!.college_id;
  const { departmentId } = req.query;

  let query = `
    SELECT d.id as department_id, d.name as department_name,
           COUNT(DISTINCT a.id) as total_attendance_entries,
           COUNT(DISTINCT sp.user_id) as enrolled_students,
           ROUND(CAST(SUM(CASE WHEN a.status = 'PRESENT' OR a.status = 'ON_DUTY' THEN 1 ELSE 0 END) AS REAL) * 100.0 / NULLIF(COUNT(a.id), 0), 1) as department_avg_percentage
    FROM departments d
    LEFT JOIN student_profiles sp ON d.id = sp.department_id
    LEFT JOIN attendance_records a ON d.id = a.department_id
    WHERE d.college_id = ?
  `;

  const params: any[] = [collegeId];

  if (departmentId) {
    query += ` AND d.id = ?`;
    params.push(departmentId);
  }

  query += ` GROUP BY d.id ORDER BY d.name ASC`;

  const departmentsAttendance = dbAll(query, params);

  // List of students with critical attendance across college
  const criticalStudents = dbAll(
    `SELECT u.id, u.full_name, u.email,
            sp.roll_number, sp.course, sp.year, sp.section,
            d.name as department_name,
            COUNT(a.id) as total_classes,
            SUM(CASE WHEN a.status = 'PRESENT' OR a.status = 'ON_DUTY' THEN 1 ELSE 0 END) as attended_classes,
            ROUND(CAST(SUM(CASE WHEN a.status = 'PRESENT' OR a.status = 'ON_DUTY' THEN 1 ELSE 0 END) AS REAL) * 100.0 / COUNT(a.id), 1) as percentage
     FROM users u
     JOIN student_profiles sp ON u.id = sp.user_id
     JOIN departments d ON sp.department_id = d.id
     JOIN attendance_records a ON a.student_id = u.id
     WHERE u.college_id = ?
     GROUP BY u.id
     HAVING COUNT(a.id) >= 5 AND percentage < 75.0
     ORDER BY percentage ASC`,
    [collegeId]
  );

  res.json({
    departmentsAttendance,
    criticalStudents,
  });
});

export default router;
