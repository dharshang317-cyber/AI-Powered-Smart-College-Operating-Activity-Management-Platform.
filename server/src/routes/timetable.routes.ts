import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbAll, dbRun } from '../database/db';
import { authMiddleware, requireFaculty, AuthenticatedRequest } from '../middleware/auth';
import { logActivity } from '../services/notification.service';

const router = Router();

router.use(authMiddleware);

// GET /api/timetable - Fetch timetable slots (filtered by dept, year, section, day)
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const collegeId = req.user!.college_id;
  const { departmentId, year, section, dayOfWeek } = req.query;

  let query = `
    SELECT t.*, 
           s.name as subject_name, s.code as subject_code,
           u.full_name as faculty_name,
           d.name as department_name, d.code as department_code
    FROM timetables t
    JOIN subjects s ON t.subject_id = s.id
    JOIN departments d ON t.department_id = d.id
    LEFT JOIN users u ON t.faculty_id = u.id
    WHERE t.college_id = ?
  `;

  const params: any[] = [collegeId];

  if (departmentId) {
    query += ` AND t.department_id = ?`;
    params.push(departmentId);
  }

  if (year) {
    query += ` AND t.year = ?`;
    params.push(year);
  }

  if (section) {
    query += ` AND t.section = ?`;
    params.push(section);
  }

  if (dayOfWeek) {
    query += ` AND t.day_of_week = ?`;
    params.push(Number(dayOfWeek));
  }

  query += ` ORDER BY t.day_of_week, t.period_number ASC`;

  const schedule = dbAll(query, params);
  res.json({ schedule });
});

// GET /api/timetable/dropdown-data - Helper for timetable builder modal
router.get('/dropdown-data', requireFaculty, (req: AuthenticatedRequest, res: Response) => {
  const collegeId = req.user!.college_id;

  const departments = dbAll(
    `SELECT id, name, code FROM departments WHERE college_id = ? AND is_active = 1 ORDER BY name ASC`,
    [collegeId]
  );

  const subjects = dbAll(
    `SELECT s.id, s.name, s.code, s.department_id, s.faculty_id, u.full_name as faculty_name
     FROM subjects s
     LEFT JOIN users u ON s.faculty_id = u.id
     WHERE s.college_id = ?
     ORDER BY s.name ASC`,
    [collegeId]
  );

  const faculty = dbAll(
    `SELECT u.id, u.full_name, u.email, fp.designation, fp.department_id
     FROM users u
     JOIN faculty_profiles fp ON u.id = fp.user_id
     WHERE u.college_id = ? AND u.status = 'APPROVED'
     ORDER BY u.full_name ASC`,
    [collegeId]
  );

  res.json({ departments, subjects, faculty });
});

// POST /api/timetable - Faculty or Admin creates a new class slot
router.post('/', requireFaculty, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const collegeId = user.college_id;
  const {
    departmentId,
    year,
    section,
    dayOfWeek,
    periodNumber,
    startTime,
    endTime,
    subjectId,
    facultyId,
    roomNumber,
  } = req.body;

  if (!departmentId || !subjectId || !dayOfWeek || !periodNumber) {
    res.status(400).json({ error: 'Department, Subject, Day, and Period are required' });
    return;
  }

  // Check if slot already occupied for this dept/year/section/day/period
  const existing = dbGet(
    `SELECT id FROM timetables 
     WHERE college_id = ? AND department_id = ? AND year = ? AND section = ? AND day_of_week = ? AND period_number = ?`,
    [collegeId, departmentId, year || 'I Year', section || 'Section A', Number(dayOfWeek), Number(periodNumber)]
  );

  const defaultTimes: Record<number, { start: string; end: string }> = {
    1: { start: '09:00 AM', end: '09:55 AM' },
    2: { start: '09:55 AM', end: '10:50 AM' },
    3: { start: '11:10 AM', end: '12:05 PM' },
    4: { start: '01:00 PM', end: '01:55 PM' },
    5: { start: '01:55 PM', end: '02:50 PM' },
    6: { start: '02:50 PM', end: '03:45 PM' },
  };

  const periodNum = Number(periodNumber);
  const finalStart = startTime || defaultTimes[periodNum]?.start || '09:00 AM';
  const finalEnd = endTime || defaultTimes[periodNum]?.end || '09:55 AM';

  if (existing) {
    // Update existing slot
    dbRun(
      `UPDATE timetables 
       SET subject_id = ?, faculty_id = ?, start_time = ?, end_time = ?, room_number = ?
       WHERE id = ?`,
      [subjectId, facultyId || null, finalStart, finalEnd, roomNumber || 'Lecture Hall 1', existing.id]
    );

    logActivity(collegeId, user.id, user.full_name, user.role, 'TIMETABLE_UPDATED', `Updated timetable slot for Period ${periodNum}`);
    res.json({ message: 'Timetable slot updated successfully', id: existing.id });
    return;
  }

  const slotId = uuidv4();
  dbRun(
    `INSERT INTO timetables (id, college_id, department_id, year, section, day_of_week, period_number, start_time, end_time, subject_id, faculty_id, room_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      slotId,
      collegeId,
      departmentId,
      year || 'I Year',
      section || 'Section A',
      Number(dayOfWeek),
      periodNum,
      finalStart,
      finalEnd,
      subjectId,
      facultyId || null,
      roomNumber || 'Lecture Hall 1',
    ]
  );

  logActivity(collegeId, user.id, user.full_name, user.role, 'TIMETABLE_CREATED', `Created new timetable slot for Day ${dayOfWeek}, Period ${periodNum}`);

  res.status(201).json({ message: 'Class slot assigned to timetable successfully', slotId });
});

// PUT /api/timetable/:id - Update specific slot
router.put('/:id', requireFaculty, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const collegeId = user.college_id;
  const { id } = req.params;
  const { subjectId, facultyId, startTime, endTime, roomNumber } = req.body;

  dbRun(
    `UPDATE timetables 
     SET subject_id = COALESCE(?, subject_id),
         faculty_id = COALESCE(?, faculty_id),
         start_time = COALESCE(?, start_time),
         end_time = COALESCE(?, end_time),
         room_number = COALESCE(?, room_number)
     WHERE id = ? AND college_id = ?`,
    [subjectId, facultyId, startTime, endTime, roomNumber, id, collegeId]
  );

  logActivity(collegeId, user.id, user.full_name, user.role, 'TIMETABLE_UPDATED', `Updated timetable slot ${id}`);

  res.json({ message: 'Timetable slot updated' });
});

// DELETE /api/timetable/:id - Remove a slot
router.delete('/:id', requireFaculty, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const collegeId = user.college_id;
  const { id } = req.params;

  dbRun(`DELETE FROM timetables WHERE id = ? AND college_id = ?`, [id, collegeId]);

  logActivity(collegeId, user.id, user.full_name, user.role, 'TIMETABLE_DELETED', `Deleted timetable slot ${id}`);

  res.json({ message: 'Timetable slot removed' });
});

export default router;
