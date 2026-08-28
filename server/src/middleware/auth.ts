import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants';
import { dbGet } from '../database/db';

export interface AuthUser {
  id: string;
  college_id: string;
  role: 'ADMIN' | 'FACULTY' | 'STUDENT' | 'CARE_CLUB';
  full_name: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  is_primary_admin?: number;
  avatar_url?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: { id: string; college_id: string; role: string; email: string }): string {
  return jwt.sign(
    {
      id: user.id,
      college_id: user.college_id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; college_id: string; role: string };
    
    // Fetch fresh user from DB
    const user = dbGet<AuthUser>(
      'SELECT id, college_id, role, full_name, email, phone, status, is_primary_admin, avatar_url FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      res.status(401).json({ error: 'User account no longer exists' });
      return;
    }

    if (user.status !== 'APPROVED') {
      res.status(403).json({ 
        error: `Account is ${user.status.toLowerCase()}`, 
        status: user.status,
        message: user.status === 'PENDING' 
          ? 'Your account is waiting for Administrator approval.' 
          : 'Your account is suspended or rejected. Please contact the College Administrator.'
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole('ADMIN');
export const requireFaculty = requireRole('FACULTY', 'ADMIN');
export const requireStudent = requireRole('STUDENT');
export const requireCareClub = requireRole('CARE_CLUB', 'ADMIN');
export const requireStaff = requireRole('FACULTY', 'ADMIN', 'CARE_CLUB');
