import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbAll, dbRun } from '../database/db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { createNotification, logActivity, publishCampusPulse } from '../services/notification.service';
import { emitToCollege } from '../services/socket.service';

const router = Router();

router.use(authMiddleware);

// GET /api/classroom/posts - List posts by department or subject
router.get('/posts', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const collegeId = user.college_id;
  const { subjectId, departmentId, type } = req.query;

  let query = `
    SELECT p.*, s.name as subject_name, s.code as subject_code,
           d.name as department_name, u.full_name as faculty_name, u.avatar_url as faculty_avatar,
           (SELECT COUNT(*) FROM classroom_comments WHERE post_id = p.id) as comment_count
    FROM classroom_posts p
    JOIN subjects s ON p.subject_id = s.id
    JOIN departments d ON p.department_id = d.id
    JOIN users u ON p.faculty_id = u.id
    WHERE p.college_id = ?
  `;

  const params: any[] = [collegeId];

  if (subjectId) {
    query += ` AND p.subject_id = ?`;
    params.push(subjectId);
  }

  if (departmentId) {
    query += ` AND p.department_id = ?`;
    params.push(departmentId);
  } else if (user.role === 'STUDENT') {
    // Automatically restrict to student's department
    const studentProfile = dbGet(`SELECT department_id FROM student_profiles WHERE user_id = ?`, [user.id]);
    if (studentProfile) {
      query += ` AND p.department_id = ?`;
      params.push(studentProfile.department_id);
    }
  }

  if (type) {
    query += ` AND p.post_type = ?`;
    params.push(type);
  }

  query += ` ORDER BY p.created_at DESC`;

  const posts = dbAll(query, params);
  res.json({ posts });
});

// GET /api/classroom/posts/:postId - Detailed post with comments
router.get('/posts/:postId', (req: AuthenticatedRequest, res: Response) => {
  const { postId } = req.params;
  const user = req.user!;

  const post = dbGet(
    `SELECT p.*, s.name as subject_name, s.code as subject_code,
            d.name as department_name, u.full_name as faculty_name, u.avatar_url as faculty_avatar
     FROM classroom_posts p
     JOIN subjects s ON p.subject_id = s.id
     JOIN departments d ON p.department_id = d.id
     JOIN users u ON p.faculty_id = u.id
     WHERE p.id = ? AND p.college_id = ?`,
    [postId, user.college_id]
  );

  if (!post) {
    res.status(404).json({ error: 'Classroom post not found' });
    return;
  }

  const comments = dbAll(
    `SELECT c.*, u.full_name as user_name, u.role as user_role, u.avatar_url
     FROM classroom_comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.post_id = ?
     ORDER BY c.created_at ASC`,
    [postId]
  );

  res.json({ post, comments });
});

// POST /api/classroom/posts - Faculty creates classroom post
router.post('/posts', upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'FACULTY' && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Only faculty members or administrators can post content' });
    return;
  }

  const { subjectId, departmentId, title, description, postType, externalUrl, dueDate } = req.body;

  if (!subjectId || !title || !postType) {
    res.status(400).json({ error: 'Subject, Title, and Post Type are required' });
    return;
  }

  const subject = dbGet(`SELECT id, department_id, name, code FROM subjects WHERE id = ?`, [subjectId]);
  if (!subject) {
    res.status(404).json({ error: 'Subject not found' });
    return;
  }

  const deptId = departmentId || subject.department_id;
  const postId = uuidv4();
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const fileName = req.file ? req.file.originalname : null;
  const fileSize = req.file ? req.file.size : null;

  dbRun(
    `INSERT INTO classroom_posts (id, college_id, department_id, subject_id, faculty_id, title, description, post_type, file_url, file_name, file_size, external_url, due_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [postId, user.college_id, deptId, subjectId, user.id, title, description || '', postType, fileUrl, fileName, fileSize, externalUrl || null, dueDate || null]
  );

  // Notify all students in this department
  const students = dbAll(`SELECT user_id FROM student_profiles WHERE department_id = ?`, [deptId]);
  students.forEach((s) => {
    createNotification({
      college_id: user.college_id,
      user_id: s.user_id,
      type: 'NEW_STUDY_MATERIAL',
      title: `New ${postType} in ${subject.name}`,
      message: `${user.full_name} posted: "${title}"`,
      link_url: `/classroom?subjectId=${subjectId}`,
    });
  });

  logActivity(
    user.college_id,
    user.id,
    user.full_name,
    user.role,
    'CLASSROOM_POST_CREATED',
    `Published ${postType} "${title}" for subject ${subject.name}`
  );

  publishCampusPulse(
    user.college_id,
    `New Study Material: ${title}`,
    `${user.full_name} shared new ${postType} materials for ${subject.name}.`,
    'Classroom',
    'BookOpen',
    user.full_name
  );

  res.status(201).json({ message: 'Content published successfully to Smart Classroom', postId });
});

// POST /api/classroom/posts/:postId/comments - Post comment
router.post('/posts/:postId/comments', (req: AuthenticatedRequest, res: Response) => {
  const { postId } = req.params;
  const { commentText } = req.body;
  const user = req.user!;

  if (!commentText || !commentText.trim()) {
    res.status(400).json({ error: 'Comment text cannot be empty' });
    return;
  }

  const commentId = uuidv4();
  dbRun(
    `INSERT INTO classroom_comments (id, post_id, user_id, comment_text, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [commentId, postId, user.id, commentText.trim()]
  );

  res.status(201).json({
    message: 'Comment added',
    comment: {
      id: commentId,
      post_id: postId,
      user_id: user.id,
      user_name: user.full_name,
      user_role: user.role,
      comment_text: commentText.trim(),
      created_at: new Date().toISOString(),
    },
  });
});

// DELETE /api/classroom/posts/:postId - Remove post
router.delete('/posts/:postId', (req: AuthenticatedRequest, res: Response) => {
  const { postId } = req.params;
  const user = req.user!;

  const post = dbGet(`SELECT id, faculty_id, title FROM classroom_posts WHERE id = ? AND college_id = ?`, [postId, user.college_id]);
  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }

  if (user.role !== 'ADMIN' && post.faculty_id !== user.id) {
    res.status(403).json({ error: 'You do not have permission to delete this post' });
    return;
  }

  dbRun(`DELETE FROM classroom_posts WHERE id = ?`, [postId]);
  res.json({ message: 'Classroom post deleted' });
});

export default router;
