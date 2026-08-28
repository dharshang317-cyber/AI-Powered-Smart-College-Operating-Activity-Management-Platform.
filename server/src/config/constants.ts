import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'campusnexus-super-secret-key-2026';
export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

export const ROLES = {
  ADMIN: 'ADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT',
} as const;

export const USER_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  ON_DUTY: 'ON_DUTY',
} as const;
