import { Router, Response } from 'express';
import { dbGet, dbAll } from '../database/db';
import { authMiddleware, requireStudent, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, requireStudent);

// GET /api/student/overview - "My Campus Snapshot"
router.get('/overview', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const collegeId = req.user!.college_id;

  const profile = dbGet(
    `SELECT sp.*, d.name as department_name, d.code as department_code, c.name as college_name
     FROM student_profiles sp
     JOIN departments d ON sp.department_id = d.id
     JOIN colleges c ON d.college_id = c.id
     WHERE sp.user_id = ?`,
    [userId]
  );

  const settings = dbGet(`SELECT * FROM college_settings WHERE college_id = ?`, [collegeId]);
  const goodThreshold = settings?.attendance_threshold_good || 75.0;
  const warningThreshold = settings?.attendance_threshold_warning || 70.0;

  // Overall attendance calculation
  const attTotal = dbGet(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN status = 'PRESENT' OR status = 'ON_DUTY' THEN 1 ELSE 0 END) as attended
     FROM attendance_records WHERE student_id = ?`,
    [userId]
  );

  const totalClasses = attTotal?.total || 0;
  const attendedClasses = attTotal?.attended || 0;
  const overallPercentage = totalClasses > 0 ? Number(((attendedClasses / totalClasses) * 100).toFixed(1)) : 100.0;

  let attendanceStatus = 'GOOD';
  let attendanceLabel = 'Good Attendance';
  if (overallPercentage < warningThreshold) {
    attendanceStatus = 'CRITICAL';
    attendanceLabel = 'Critical Attendance (Potentially Not Eligible based on College Policy)';
  } else if (overallPercentage < goodThreshold) {
    attendanceStatus = 'WARNING';
    attendanceLabel = 'Attendance Warning';
  }

  // Today's classes
  const todayDay = new Date().getDay() || 1;
  const todayClasses = dbAll(
    `SELECT t.period_number, t.start_time, t.end_time, t.room_number,
            s.name as subject_name, s.code as subject_code, u.full_name as faculty_name
     FROM timetables t
     JOIN subjects s ON t.subject_id = s.id
     LEFT JOIN users u ON t.faculty_id = u.id
     WHERE t.department_id = ? AND t.year = ? AND t.section = ? AND t.day_of_week = ?
     ORDER BY t.period_number ASC`,
    [profile?.department_id, profile?.year, profile?.section, todayDay]
  );

  // Pending assessments
  const pendingAssessments = dbAll(
    `SELECT a.id, a.title, a.duration_minutes, a.total_marks, a.end_date, s.name as subject_name
     FROM assessments a
     JOIN subjects s ON a.subject_id = s.id
     WHERE a.college_id = ? AND a.department_id = ? AND a.is_published = 1
       AND a.id NOT IN (SELECT assessment_id FROM assessment_submissions WHERE student_id = ?)
       AND a.end_date >= datetime('now')
     ORDER BY a.end_date ASC LIMIT 5`,
    [collegeId, profile?.department_id, userId]
  );

  // Recent study materials
  const recentMaterials = dbAll(
    `SELECT p.*, s.name as subject_name, u.full_name as faculty_name
     FROM classroom_posts p
     JOIN subjects s ON p.subject_id = s.id
     JOIN users u ON p.faculty_id = u.id
     WHERE p.department_id = ?
     ORDER BY p.created_at DESC LIMIT 5`,
    [profile?.department_id]
  );

  // Upcoming events
  const upcomingEvents = dbAll(
    `SELECT e.*, 
            (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as current_registrations,
            (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id AND student_id = ?) as is_registered
     FROM events e
     WHERE e.college_id = ? AND e.event_date >= date('now')
     ORDER BY e.event_date ASC LIMIT 4`,
    [userId, collegeId]
  );

  res.json({
    profile,
    attendanceSnapshot: {
      totalClasses,
      attendedClasses,
      percentage: overallPercentage,
      status: attendanceStatus,
      label: attendanceLabel,
      goodThreshold,
      warningThreshold,
    },
    todayClasses,
    pendingAssessments,
    recentMaterials,
    upcomingEvents,
  });
});

// GET /api/student/timetable - Full weekly schedule
router.get('/timetable', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const profile = dbGet(`SELECT department_id, year, section FROM student_profiles WHERE user_id = ?`, [userId]);

  const schedule = dbAll(
    `SELECT t.*, s.name as subject_name, s.code as subject_code, u.full_name as faculty_name
     FROM timetables t
     JOIN subjects s ON t.subject_id = s.id
     LEFT JOIN users u ON t.faculty_id = u.id
     WHERE t.department_id = ? AND t.year = ? AND t.section = ?
     ORDER BY t.day_of_week, t.period_number ASC`,
    [profile?.department_id, profile?.year, profile?.section]
  );

  res.json({ schedule });
});

// GET /api/student/attendance - Detailed Subject-wise and daily attendance logs
router.get('/attendance', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const collegeId = req.user!.college_id;

  const settings = dbGet(`SELECT * FROM college_settings WHERE college_id = ?`, [collegeId]);
  const goodThreshold = settings?.attendance_threshold_good || 75.0;
  const warningThreshold = settings?.attendance_threshold_warning || 70.0;

  // Subject-wise percentage
  const subjectStats = dbAll(
    `SELECT s.id as subject_id, s.name as subject_name, s.code as subject_code, u.full_name as faculty_name,
            COUNT(a.id) as total_conducted,
            SUM(CASE WHEN a.status = 'PRESENT' OR a.status = 'ON_DUTY' THEN 1 ELSE 0 END) as attended,
            SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
            SUM(CASE WHEN a.status = 'ON_DUTY' THEN 1 ELSE 0 END) as od_count
     FROM subjects s
     LEFT JOIN users u ON s.faculty_id = u.id
     LEFT JOIN attendance_records a ON a.subject_id = s.id AND a.student_id = ?
     WHERE s.department_id IN (SELECT department_id FROM student_profiles WHERE user_id = ?)
     GROUP BY s.id
     ORDER BY s.name ASC`,
    [userId, userId]
  );

  const formattedStats = subjectStats.map((s: any) => {
    const total = s.total_conducted || 0;
    const attended = s.attended || 0;
    const pct = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 100.0;

    let status = 'GOOD';
    if (pct < warningThreshold) status = 'CRITICAL';
    else if (pct < goodThreshold) status = 'WARNING';

    return {
      ...s,
      percentage: pct,
      status,
    };
  });

  // Recent attendance history
  const history = dbAll(
    `SELECT a.id, a.date, a.period_number, a.status, a.notes,
            s.name as subject_name, s.code as subject_code
     FROM attendance_records a
     JOIN subjects s ON a.subject_id = s.id
     WHERE a.student_id = ?
     ORDER BY a.date DESC, a.period_number DESC LIMIT 30`,
    [userId]
  );

  res.json({
    subjectStats: formattedStats,
    history,
    thresholds: { good: goodThreshold, warning: warningThreshold },
  });
});

export default router;
