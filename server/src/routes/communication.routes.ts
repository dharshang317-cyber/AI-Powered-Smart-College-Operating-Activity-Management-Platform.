import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbAll, dbRun } from '../database/db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { createNotification, logActivity } from '../services/notification.service';
import { emitToUser } from '../services/socket.service';

const router = Router();

router.use(authMiddleware);

// --- 1. DIRECT MESSAGING (Student <-> Faculty) ---

// GET /api/communication/contacts - Allowed contacts based on department / role
router.get('/contacts', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const collegeId = user.college_id;

  let contacts: any[] = [];

  if (user.role === 'STUDENT') {
    // Students can message faculty in their department / subjects
    const profile = dbGet(`SELECT department_id FROM student_profiles WHERE user_id = ?`, [user.id]);
    contacts = dbAll(
      `SELECT u.id, u.full_name, u.email, u.role, u.avatar_url,
              fp.designation, d.name as department_name
       FROM users u
       JOIN faculty_profiles fp ON u.id = fp.user_id
       JOIN departments d ON fp.department_id = d.id
       WHERE u.college_id = ? AND u.status = 'APPROVED' AND (fp.department_id = ? OR u.is_primary_admin = 1)
       ORDER BY u.full_name ASC`,
      [collegeId, profile?.department_id]
    );
  } else if (user.role === 'FACULTY') {
    // Faculty can message students in their department
    const profile = dbGet(`SELECT department_id FROM faculty_profiles WHERE user_id = ?`, [user.id]);
    contacts = dbAll(
      `SELECT u.id, u.full_name, u.email, u.role, u.avatar_url,
              sp.roll_number, sp.course, sp.year, sp.section, d.name as department_name
       FROM users u
       JOIN student_profiles sp ON u.id = sp.user_id
       JOIN departments d ON sp.department_id = d.id
       WHERE u.college_id = ? AND u.status = 'APPROVED' AND sp.department_id = ?
       ORDER BY sp.roll_number ASC`,
      [collegeId, profile?.department_id]
    );
  } else if (user.role === 'ADMIN') {
    // Admin can message any faculty or student
    contacts = dbAll(
      `SELECT u.id, u.full_name, u.email, u.role, u.avatar_url
       FROM users u
       WHERE u.college_id = ? AND u.status = 'APPROVED' AND u.id != ?
       ORDER BY u.role, u.full_name ASC LIMIT 50`,
      [collegeId, user.id]
    );
  }

  res.json({ contacts });
});

// GET /api/communication/messages/:contactId - Conversation history
router.get('/messages/:contactId', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { contactId } = req.params;

  const messages = dbAll(
    `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.college_id = ? AND ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
     ORDER BY m.created_at ASC`,
    [user.college_id, user.id, contactId, contactId, user.id]
  );

  // Mark unread messages from this contact as read
  dbRun(
    `UPDATE messages SET is_read = 1 WHERE college_id = ? AND sender_id = ? AND receiver_id = ?`,
    [user.college_id, contactId, user.id]
  );

  res.json({ messages });
});

// POST /api/communication/messages/:contactId - Send message
router.post('/messages/:contactId', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { contactId } = req.params;
  const { messageText } = req.body;

  if (!messageText || !messageText.trim()) {
    res.status(400).json({ error: 'Message cannot be empty' });
    return;
  }

  const msgId = uuidv4();
  dbRun(
    `INSERT INTO messages (id, college_id, sender_id, receiver_id, message_text, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`,
    [msgId, user.college_id, user.id, contactId, messageText.trim()]
  );

  const payload = {
    id: msgId,
    college_id: user.college_id,
    sender_id: user.id,
    receiver_id: contactId,
    sender_name: user.full_name,
    message_text: messageText.trim(),
    created_at: new Date().toISOString(),
  };

  emitToUser(contactId, 'new_direct_message', payload);

  createNotification({
    college_id: user.college_id,
    user_id: contactId,
    type: 'NEW_MESSAGE',
    title: `Message from ${user.full_name}`,
    message: messageText.trim().substring(0, 60) + (messageText.length > 60 ? '...' : ''),
    link_url: `/messages?contactId=${user.id}`,
  });

  res.status(201).json({ message: 'Sent', data: payload });
});

// --- 2. CAMPUS CARE CLUB (Confidential Student Wellbeing & Cross-Department Guidance) ---

// GET /api/communication/care-club/members - List all approved Care Club mentors (visible across ALL departments)
router.get('/care-club/members', (req: AuthenticatedRequest, res: Response) => {
  const collegeId = req.user!.college_id;

  // 1. Dedicated Care Club Members
  const careClubMembers = dbAll(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.role,
            ccp.designation, ccp.qualification, ccp.specialization, ccp.bio, ccp.available_hours,
            'Campus Care Club' as department_name, 1 as is_care_club
     FROM users u
     JOIN care_club_profiles ccp ON u.id = ccp.user_id
     WHERE u.college_id = ? AND u.status = 'APPROVED' AND u.role = 'CARE_CLUB'
     ORDER BY u.full_name ASC`,
    [collegeId]
  );

  // 2. Designated Faculty Counselors
  const facultyCounselors = dbAll(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.role,
            fp.designation, fp.qualification, fp.specialization,
            'Faculty Guidance Counselor available for academic and personal advice' as bio,
            'Mon - Fri: 09:30 AM - 04:30 PM' as available_hours,
            d.name as department_name, 0 as is_care_club
     FROM users u
     JOIN faculty_profiles fp ON u.id = fp.user_id
     JOIN departments d ON fp.department_id = d.id
     WHERE u.college_id = ? AND u.status = 'APPROVED' AND fp.is_guidance_counselor = 1`,
    [collegeId]
  );

  const members = [...careClubMembers, ...facultyCounselors];
  res.json({ members, counselors: members });
});

// Legacy route alias
router.get('/campus-care/counselors', (req: AuthenticatedRequest, res: Response) => {
  const collegeId = req.user!.college_id;
  const careClubMembers = dbAll(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.role,
            ccp.designation, ccp.qualification, ccp.specialization, ccp.bio, ccp.available_hours,
            'Campus Care Club' as department_name
     FROM users u
     JOIN care_club_profiles ccp ON u.id = ccp.user_id
     WHERE u.college_id = ? AND u.status = 'APPROVED'
     ORDER BY u.full_name ASC`,
    [collegeId]
  );
  res.json({ counselors: careClubMembers });
});

// GET /api/communication/care-club/my-conversations - For Care Club members or Students to list active chat threads
router.get('/care-club/my-conversations', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const collegeId = user.college_id;

  const conversationUsers = dbAll(
    `SELECT DISTINCT 
            CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id
     FROM messages m
     WHERE m.college_id = ? AND (m.sender_id = ? OR m.receiver_id = ?)`,
    [user.id, collegeId, user.id, user.id]
  );

  const conversations = conversationUsers.map((cu: any) => {
    const otherUser = dbGet(
      `SELECT u.id, u.full_name, u.email, u.role, u.avatar_url,
              sp.course, sp.year, sp.section, sp.roll_number,
              ccp.designation as care_designation, ccp.specialization as care_specialization,
              d.name as department_name
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       LEFT JOIN care_club_profiles ccp ON u.id = ccp.user_id
       LEFT JOIN departments d ON sp.department_id = d.id
       WHERE u.id = ?`,
      [cu.other_user_id]
    );

    const lastMsg = dbGet(
      `SELECT message_text, created_at, sender_id, is_read
       FROM messages
       WHERE college_id = ? AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
       ORDER BY created_at DESC LIMIT 1`,
      [collegeId, user.id, cu.other_user_id, cu.other_user_id, user.id]
    );

    const unreadCount = dbGet(
      `SELECT COUNT(*) as c
       FROM messages
       WHERE college_id = ? AND sender_id = ? AND receiver_id = ? AND is_read = 0`,
      [collegeId, cu.other_user_id, user.id]
    )?.c || 0;

    return {
      otherUser,
      lastMessage: lastMsg,
      unreadCount,
    };
  }).filter((c: any) => c.otherUser);

  res.json({ conversations });
});

// GET /api/communication/care-club/chat/:memberId - Private 1-on-1 confidential chat
router.get('/care-club/chat/:memberId', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { memberId } = req.params;

  const messages = dbAll(
    `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar, u.role as sender_role
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.college_id = ? AND ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
     ORDER BY m.created_at ASC`,
    [user.college_id, user.id, memberId, memberId, user.id]
  );

  // Mark unread messages as read
  dbRun(
    `UPDATE messages SET is_read = 1 WHERE college_id = ? AND sender_id = ? AND receiver_id = ?`,
    [user.college_id, memberId, user.id]
  );

  const targetMember = dbGet(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.role,
            ccp.designation, ccp.specialization, ccp.bio, ccp.available_hours,
            sp.course, sp.year, sp.roll_number,
            d.name as department_name
     FROM users u
     LEFT JOIN care_club_profiles ccp ON u.id = ccp.user_id
     LEFT JOIN student_profiles sp ON u.id = sp.user_id
     LEFT JOIN departments d ON sp.department_id = d.id
     WHERE u.id = ?`,
    [memberId]
  );

  res.json({ messages, member: targetMember });
});

// POST /api/communication/care-club/chat/:memberId - Send private message to Care Club member or student
router.post('/care-club/chat/:memberId', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { memberId } = req.params;
  const { messageText } = req.body;

  if (!messageText || !messageText.trim()) {
    res.status(400).json({ error: 'Message cannot be empty' });
    return;
  }

  const msgId = uuidv4();
  dbRun(
    `INSERT INTO messages (id, college_id, sender_id, receiver_id, message_text, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`,
    [msgId, user.college_id, user.id, memberId, messageText.trim()]
  );

  const payload = {
    id: msgId,
    college_id: user.college_id,
    sender_id: user.id,
    receiver_id: memberId,
    sender_name: user.full_name,
    sender_role: user.role,
    message_text: messageText.trim(),
    created_at: new Date().toISOString(),
  };

  emitToUser(memberId, 'new_direct_message', payload);
  emitToUser(memberId, 'new_care_message', payload);

  createNotification({
    college_id: user.college_id,
    user_id: memberId,
    type: 'NEW_CARE_MESSAGE',
    title: user.role === 'CARE_CLUB' ? `Guidance from ${user.full_name}` : `Private Message from Student`,
    message: messageText.trim().substring(0, 60) + (messageText.length > 60 ? '...' : ''),
    link_url: `/campus-care?chatUserId=${user.id}`,
  });

  res.status(201).json({ message: 'Message delivered privately and safely', data: payload });
});

// GET /api/communication/care-club/requests - Fetch guidance tickets
router.get(['/care-club/requests', '/campus-care/requests'], (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const collegeId = user.college_id;

  let query = `
    SELECT g.*, 
           u_student.full_name as student_name, u_student.email as student_email,
           sp.roll_number, sp.course, sp.year, sp.section,
           d.name as department_name,
           u_counselor.full_name as counselor_name, u_counselor.email as counselor_email
    FROM guidance_requests g
    JOIN users u_student ON g.student_id = u_student.id
    JOIN student_profiles sp ON u_student.id = sp.user_id
    JOIN departments d ON sp.department_id = d.id
    LEFT JOIN users u_counselor ON g.counselor_id = u_counselor.id
    WHERE g.college_id = ?
  `;

  const params: any[] = [collegeId];

  if (user.role === 'STUDENT') {
    // Only student's own private tickets
    query += ` AND g.student_id = ?`;
    params.push(user.id);
  } else if (user.role === 'CARE_CLUB') {
    // Care Club member sees all tickets or tickets assigned to them
    query += ` AND (g.counselor_id = ? OR g.counselor_id IS NULL)`;
    params.push(user.id);
  } else if (user.role === 'FACULTY') {
    // Guidance faculty sees tickets assigned to them or their department
    const prof = dbGet(`SELECT department_id, is_guidance_counselor FROM faculty_profiles WHERE user_id = ?`, [user.id]);
    if (prof?.is_guidance_counselor) {
      query += ` AND (g.counselor_id = ? OR g.counselor_id IS NULL OR sp.department_id = ?)`;
      params.push(user.id, prof.department_id);
    } else {
      query += ` AND g.counselor_id = ?`;
      params.push(user.id);
    }
  }

  query += ` ORDER BY g.created_at DESC`;

  const requests = dbAll(query, params);
  res.json({ requests });
});

// POST /api/communication/care-club/requests - Student submits guidance request
router.post(['/care-club/requests', '/campus-care/requests'], (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'STUDENT') {
    res.status(403).json({ error: 'Only students can submit Campus Care guidance requests' });
    return;
  }

  const { category, subject, description, preferredTime, counselorId } = req.body;

  if (!category || !subject || !description) {
    res.status(400).json({ error: 'Category, subject, and description are required' });
    return;
  }

  const requestId = uuidv4();

  // If no counselor selected, pick a default Care Club member
  let targetCounselor = counselorId;
  if (!targetCounselor) {
    const autoCounselor = dbGet(
      `SELECT u.id FROM users u WHERE u.college_id = ? AND u.role = 'CARE_CLUB' AND u.status = 'APPROVED' LIMIT 1`,
      [user.college_id]
    );
    targetCounselor = autoCounselor?.id || null;
  }

  dbRun(
    `INSERT INTO guidance_requests (id, college_id, student_id, counselor_id, category, subject, description, preferred_time, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'), datetime('now'))`,
    [requestId, user.college_id, user.id, targetCounselor, category, subject, description, preferredTime || null]
  );

  if (targetCounselor) {
    createNotification({
      college_id: user.college_id,
      user_id: targetCounselor,
      type: 'NEW_GUIDANCE_REQUEST',
      title: `Campus Care Request: ${category}`,
      message: `Student ${user.full_name} submitted a private guidance request regarding "${subject}".`,
      link_url: `/campus-care`,
    });
  }

  logActivity(
    user.college_id,
    user.id,
    user.full_name,
    user.role,
    'GUIDANCE_REQUESTED',
    `Submitted Campus Care Club request under category "${category}"`
  );

  res.status(201).json({ message: 'Guidance request submitted safely and confidentially to Campus Care Club', requestId });
});

// PUT /api/communication/care-club/requests/:requestId/status - Update ticket status & resolution notes
router.put(['/care-club/requests/:requestId/status', '/campus-care/requests/:requestId/status'], (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { requestId } = req.params;
  const { status, resolutionNotes, counselorId } = req.body;

  if (user.role === 'STUDENT') {
    res.status(403).json({ error: 'Only Care Club mentors or administrators can update guidance tickets' });
    return;
  }

  const request = dbGet(`SELECT * FROM guidance_requests WHERE id = ? AND college_id = ?`, [requestId, user.college_id]);
  if (!request) {
    res.status(404).json({ error: 'Guidance ticket not found' });
    return;
  }

  dbRun(
    `UPDATE guidance_requests
     SET status = COALESCE(?, status),
         resolution_notes = COALESCE(?, resolution_notes),
         counselor_id = COALESCE(?, counselor_id),
         updated_at = datetime('now')
     WHERE id = ?`,
    [status, resolutionNotes, counselorId, requestId]
  );

  // Notify student of progress
  createNotification({
    college_id: user.college_id,
    user_id: request.student_id,
    type: 'GUIDANCE_STATUS_UPDATED',
    title: `Campus Care Club Update: ${request.subject}`,
    message: `Your guidance request status has been updated to "${status}". Counselor notes: "${resolutionNotes || 'In review'}"`,
    link_url: `/campus-care`,
  });

  res.json({ message: 'Guidance ticket updated successfully' });
});

// --- 3. NOTIFICATIONS ---

// GET /api/communication/notifications - List user's notifications
router.get('/notifications', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifications = dbAll(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
    [user.id]
  );
  res.json({ notifications });
});

// PUT /api/communication/notifications/read-all - Mark all read
router.put('/notifications/read-all', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  dbRun(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [user.id]);
  res.json({ message: 'All notifications marked as read' });
});

// PUT /api/communication/notifications/:notifId/read - Mark single read
router.put('/notifications/:notifId/read', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { notifId } = req.params;
  dbRun(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [notifId, user.id]);
  res.json({ message: 'Notification marked as read' });
});

// --- 4. CAMPUS PULSE ---

// GET /api/communication/pulse - Public college activity feed
router.get('/pulse', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const pulse = dbAll(
    `SELECT * FROM campus_pulse WHERE college_id = ? ORDER BY created_at DESC LIMIT 25`,
    [user.college_id]
  );
  res.json({ pulse });
});

export default router;
