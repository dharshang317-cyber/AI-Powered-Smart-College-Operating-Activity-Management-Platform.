import { v4 as uuidv4 } from 'uuid';
import { dbRun } from '../database/db';
import { emitToUser, emitToRole, emitToCollege } from './socket.service';

export interface CreateNotificationParams {
  college_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_url?: string;
}

export function createNotification(params: CreateNotificationParams): string {
  const id = uuidv4();
  dbRun(
    `INSERT INTO notifications (id, college_id, user_id, type, title, message, link_url, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
    [id, params.college_id, params.user_id, params.type, params.title, params.message, params.link_url || null]
  );

  // Emit real-time notification to the specific user
  emitToUser(params.user_id, 'new_notification', {
    id,
    college_id: params.college_id,
    user_id: params.user_id,
    type: params.type,
    title: params.title,
    message: params.message,
    link_url: params.link_url,
    is_read: 0,
    created_at: new Date().toISOString(),
  });

  return id;
}

export function notifyCollegeAdmins(college_id: string, title: string, message: string, link_url?: string): void {
  // Emit to all admins in the college room
  emitToRole(college_id, 'ADMIN', 'admin_alert', { title, message, link_url, timestamp: new Date().toISOString() });
}

export function logActivity(college_id: string, user_id: string | null, user_name: string | null, role: string | null, action_type: string, description: string): void {
  const id = uuidv4();
  dbRun(
    `INSERT INTO activity_logs (id, college_id, user_id, user_name, role, action_type, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [id, college_id, user_id, user_name, role, action_type, description]
  );
}

export function publishCampusPulse(college_id: string, title: string, content: string, category: string, icon: string, author_name: string): void {
  const id = uuidv4();
  dbRun(
    `INSERT INTO campus_pulse (id, college_id, title, content, category, icon, author_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [id, college_id, title, content, category, icon, author_name]
  );

  // Broadcast to whole college
  emitToCollege(college_id, 'new_pulse_item', {
    id,
    college_id,
    title,
    content,
    category,
    icon,
    author_name,
    created_at: new Date().toISOString(),
  });
}
