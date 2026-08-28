import { Router, Response } from 'express';
import { dbGet, dbAll } from '../database/db';
import { authMiddleware, requireFaculty, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, requireFaculty);

// GET /api/faculty/overview - "My Classroom Snapshot"
router.get('/overview', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const collegeId = req.user!.college_id;

  const facultyProfile = dbGet(
    `SELECT fp.*, d.name as department_name, d.code as department_code 
     FROM faculty_profiles fp 
     JOIN departments d ON fp.department_id = d.id 
     WHERE fp.user_id = ?`,
    [userId]
  );

  // My handled subjects
  const mySubjects = dbAll(
    `SELECT s.*, 
            (SELECT COUNT(*) FROM student_profiles WHERE department_id = s.department_id) as enrolled_students,
            (SELECT COUNT(*) FROM classroom_posts WHERE subject_id = s.id) as materials_count,
            (SELECT COUNT(*) FROM assessments WHERE subject_id = s.id) as tests_count
     FROM subjects s
     WHERE s.faculty_id = ? AND s.college_id = ?`,
    [userId, collegeId]
  );

  // Today's classes from timetable
  const todayDay = new Date().getDay() || 1;
  const todayClasses = dbAll(
    `SELECT t.period_number, t.start_time, t.end_time, t.room_number, t.year, t.section,
            s.name as subject_name, s.code as subject_code
     FROM timetables t
     JOIN subjects s ON t.subject_id = s.id
     WHERE t.faculty_id = ? AND t.day_of_week = ?
     ORDER BY t.period_number ASC`,
    [userId, todayDay]
  );

  // Recent 5 assessment submissions to review
  const recentSubmissions = dbAll(
    `SELECT sub.id, sub.score, sub.total_marks, sub.percentage, sub.submitted_at,
            u.full_name as student_name, sp.roll_number,
            a.title as assessment_title, s.name as subject_name
     FROM assessment_submissions sub
     JOIN assessments a ON sub.assessment_id = a.id
     JOIN subjects s ON a.subject_id = s.id
     JOIN users u ON sub.student_id = u.id
     JOIN student_profiles sp ON u.id = sp.user_id
     WHERE a.faculty_id = ?
     ORDER BY sub.submitted_at DESC LIMIT 5`,
    [userId]
  );

  // Total students in department
  const totalStudents = dbGet(
    `SELECT COUNT(*) as count FROM student_profiles WHERE department_id = ?`,
    [facultyProfile?.department_id]
  )?.count || 0;

  // Active tests count
  const activeTests = dbGet(
    `SELECT COUNT(*) as count FROM assessments WHERE faculty_id = ? AND is_published = 1 AND end_date >= datetime('now')`,
    [userId]
  )?.count || 0;

  res.json({
    profile: facultyProfile,
    metrics: {
      totalSubjects: mySubjects.length,
      totalStudents,
      activeTests,
      todayClassesCount: todayClasses.length,
    },
    todayClasses,
    mySubjects,
    recentSubmissions,
  });
});

// GET /api/faculty/my-subjects
router.get('/my-subjects', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const collegeId = req.user!.college_id;

  const subjects = dbAll(
    `SELECT s.*, d.name as department_name,
            (SELECT COUNT(*) FROM student_profiles WHERE department_id = s.department_id) as student_count,
            (SELECT COUNT(*) FROM classroom_posts WHERE subject_id = s.id) as posts_count,
            (SELECT COUNT(*) FROM assessments WHERE subject_id = s.id) as assessments_count
     FROM subjects s
     JOIN departments d ON s.department_id = d.id
     WHERE (s.faculty_id = ? OR ? IN (SELECT id FROM users WHERE is_primary_admin = 1)) AND s.college_id = ?
     ORDER BY s.name ASC`,
    [userId, userId, collegeId]
  );

  res.json({ subjects });
});

// GET /api/faculty/my-students - List of students in faculty's department with attendance %
router.get('/my-students', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const collegeId = req.user!.college_id;
  const { departmentId, search } = req.query;

  const facultyProfile = dbGet(`SELECT department_id FROM faculty_profiles WHERE user_id = ?`, [userId]);
  const targetDeptId = departmentId || facultyProfile?.department_id;

  let query = `
    SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url,
           sp.course, sp.year, sp.section, sp.roll_number, sp.academic_identifier,
           d.name as department_name,
           (
             SELECT ROUND(CAST(SUM(CASE WHEN status = 'PRESENT' OR status = 'ON_DUTY' THEN 1 ELSE 0 END) AS REAL) * 100.0 / COUNT(*), 1)
             FROM attendance_records
             WHERE student_id = u.id
           ) as overall_attendance_percentage,
           (
             SELECT COUNT(*) FROM attendance_records WHERE student_id = u.id
           ) as total_attendance_sessions
    FROM users u
    JOIN student_profiles sp ON u.id = sp.user_id
    JOIN departments d ON sp.department_id = d.id
    WHERE u.college_id = ? AND u.status = 'APPROVED'
  `;

  const params: any[] = [collegeId];

  if (targetDeptId) {
    query += ` AND sp.department_id = ?`;
    params.push(targetDeptId);
  }

  if (search) {
    query += ` AND (u.full_name LIKE ? OR sp.roll_number LIKE ? OR u.email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY sp.roll_number ASC`;

  const students = dbAll(query, params);
  res.json({ students });
});

export default router;
