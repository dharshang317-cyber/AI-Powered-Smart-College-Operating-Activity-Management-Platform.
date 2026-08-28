import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbAll, dbRun } from '../database/db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { createNotification, logActivity, publishCampusPulse } from '../services/notification.service';

const router = Router();

router.use(authMiddleware);

// GET /api/events - List campus events
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const collegeId = user.college_id;
  const { category, search, departmentId } = req.query;

  let query = `
    SELECT e.*, d.name as department_name, u.full_name as creator_name,
           (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id AND status = 'REGISTERED') as registration_count,
           (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id AND student_id = ? AND status = 'REGISTERED') as is_registered
    FROM events e
    LEFT JOIN departments d ON e.department_id = d.id
    JOIN users u ON e.created_by = u.id
    WHERE e.college_id = ?
  `;

  const params: any[] = [user.id, collegeId];

  if (category && category !== 'All') {
    query += ` AND e.category = ?`;
    params.push(category);
  }

  if (departmentId) {
    query += ` AND (e.department_id = ? OR e.department_id IS NULL)`;
    params.push(departmentId);
  }

  if (search) {
    query += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.organizer LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY e.event_date ASC`;

  const events = dbAll(query, params);
  res.json({ events });
});

// POST /api/events - Create new campus event
router.post('/', upload.single('poster'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'FACULTY' && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Only faculty or administrator can create campus events' });
    return;
  }

  const {
    title,
    description,
    category,
    venue,
    eventDate,
    eventTime,
    organizer,
    departmentId,
    maxParticipants,
    registrationDeadline,
    posterUrl: directPosterUrl,
  } = req.body;

  if (!title || !description || !category || !venue || !eventDate || !eventTime) {
    res.status(400).json({ error: 'Missing mandatory event fields' });
    return;
  }

  const eventId = uuidv4();
  const posterUrl = req.file ? `/uploads/${req.file.filename}` : directPosterUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=300&fit=crop';

  dbRun(
    `INSERT INTO events (id, college_id, title, description, category, venue, event_date, event_time, organizer, department_id, poster_url, max_participants, registration_deadline, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      eventId,
      user.college_id,
      title,
      description,
      category,
      venue,
      eventDate,
      eventTime,
      organizer || `${user.role === 'ADMIN' ? 'College Admin' : 'Department Faculty'}`,
      departmentId || null,
      posterUrl,
      Number(maxParticipants) || 100,
      registrationDeadline || `${eventDate} 23:59:59`,
      user.id,
    ]
  );

  // Notify students
  const students = dbAll(`SELECT id FROM users WHERE college_id = ? AND role = 'STUDENT' AND status = 'APPROVED'`, [user.college_id]);
  students.forEach((s) => {
    createNotification({
      college_id: user.college_id,
      user_id: s.id,
      type: 'NEW_EVENT',
      title: `Campus Event: ${title}`,
      message: `${category} organized by ${organizer || 'College'}. Date: ${eventDate}. Register before slots fill up!`,
      link_url: '/events',
    });
  });

  logActivity(
    user.college_id,
    user.id,
    user.full_name,
    user.role,
    'EVENT_CREATED',
    `Created campus event "${title}" (${category}) scheduled for ${eventDate}`
  );

  publishCampusPulse(
    user.college_id,
    `New Event: ${title}`,
    `Registration is now open for ${title} (${category}) on ${eventDate}.`,
    'Events',
    'Trophy',
    user.full_name
  );

  res.status(201).json({ message: 'Event created and published successfully', eventId });
});

// POST /api/events/:eventId/register - 1-Click student registration
router.post('/:eventId/register', (req: AuthenticatedRequest, res: Response) => {
  const { eventId } = req.params;
  const user = req.user!;

  if (user.role !== 'STUDENT') {
    res.status(403).json({ error: 'Only students can register for events' });
    return;
  }

  const event = dbGet(`SELECT * FROM events WHERE id = ? AND college_id = ?`, [eventId, user.college_id]);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  // Check capacity
  const currentCount = dbGet(
    `SELECT COUNT(*) as c FROM event_registrations WHERE event_id = ? AND status = 'REGISTERED'`,
    [eventId]
  )?.c || 0;

  if (currentCount >= event.max_participants) {
    res.status(400).json({ error: 'Event registration is full (Capacity reached).' });
    return;
  }

  // Check deadline
  if (new Date() > new Date(event.registration_deadline)) {
    res.status(400).json({ error: 'Registration deadline has passed for this event.' });
    return;
  }

  // Check existing
  const existing = dbGet(`SELECT id, status FROM event_registrations WHERE event_id = ? AND student_id = ?`, [eventId, user.id]);
  if (existing) {
    if (existing.status === 'REGISTERED') {
      res.status(400).json({ error: 'You are already registered for this event.' });
      return;
    }
    dbRun(`UPDATE event_registrations SET status = 'REGISTERED', registered_at = datetime('now') WHERE id = ?`, [existing.id]);
  } else {
    dbRun(
      `INSERT INTO event_registrations (id, event_id, student_id, registered_at, status)
       VALUES (?, ?, ?, datetime('now'), 'REGISTERED')`,
      [uuidv4(), eventId, user.id]
    );
  }

  createNotification({
    college_id: user.college_id,
    user_id: user.id,
    type: 'EVENT_REGISTRATION_SUCCESS',
    title: 'Registration Confirmed!',
    message: `You are registered for "${event.title}". Venue: ${event.venue} on ${event.event_date} at ${event.event_time}.`,
    link_url: '/events',
  });

  logActivity(
    user.college_id,
    user.id,
    user.full_name,
    user.role,
    'EVENT_REGISTERED',
    `Registered for event "${event.title}"`
  );

  res.json({ message: 'Registered successfully for the event!' });
});

// GET /api/events/:eventId/registrations - Participant roster for Faculty/Admin & CSV Export
router.get('/:eventId/registrations', (req: AuthenticatedRequest, res: Response) => {
  const { eventId } = req.params;
  const user = req.user!;

  const event = dbGet(`SELECT * FROM events WHERE id = ? AND college_id = ?`, [eventId, user.college_id]);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  const participants = dbAll(
    `SELECT er.id, er.registered_at, er.status,
            u.full_name, u.email, u.phone,
            sp.roll_number, sp.course, sp.year, sp.section,
            d.name as department_name
     FROM event_registrations er
     JOIN users u ON er.student_id = u.id
     JOIN student_profiles sp ON u.id = sp.user_id
     JOIN departments d ON sp.department_id = d.id
     WHERE er.event_id = ? AND er.status = 'REGISTERED'
     ORDER BY er.registered_at ASC`,
    [eventId]
  );

  res.json({
    event,
    participants,
    totalRegistered: participants.length,
  });
});

export default router;
