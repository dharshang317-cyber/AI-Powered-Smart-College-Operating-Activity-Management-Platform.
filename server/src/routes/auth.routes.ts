import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbAll, dbRun } from '../database/db';
import { generateToken, authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { createNotification, notifyCollegeAdmins, logActivity } from '../services/notification.service';
import { sendOTPEmail, verifyOTP } from '../services/email.service';
import { verifyGoogleToken } from '../services/google-auth.service';

const router = Router();

// Helper to fetch role-specific profile details
function getUserProfileData(userId: string, role: string) {
  if (role === 'FACULTY') {
    return dbGet(
      `SELECT fp.*, d.name as department_name, d.code as department_code 
       FROM faculty_profiles fp 
       JOIN departments d ON fp.department_id = d.id 
       WHERE fp.user_id = ?`,
      [userId]
    ) || {};
  } else if (role === 'STUDENT') {
    return dbGet(
      `SELECT sp.*, d.name as department_name, d.code as department_code 
       FROM student_profiles sp 
       JOIN departments d ON sp.department_id = d.id 
       WHERE sp.user_id = ?`,
      [userId]
    ) || {};
  } else if (role === 'CARE_CLUB') {
    return dbGet(
      `SELECT * FROM care_club_profiles WHERE user_id = ?`,
      [userId]
    ) || {};
  }
  return {};
}

// GET /api/auth/colleges - Public list of registered colleges
router.get('/colleges', (_req: Request, res: Response) => {
  const colleges = dbAll(`SELECT id, name, code, college_type, website, logo_url FROM colleges ORDER BY name ASC`);
  res.json({ colleges });
});

// GET /api/auth/departments/:collegeId - Public list of departments
router.get('/departments/:collegeId', (req: Request, res: Response) => {
  const { collegeId } = req.params;
  const departments = dbAll(
    `SELECT id, name, code, hod_name FROM departments WHERE college_id = ? AND is_active = 1 ORDER BY name ASC`,
    [collegeId]
  );
  res.json({ departments });
});

// POST /api/auth/send-otp - Dispatch 6-digit OTP to user email
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email, purpose = 'REGISTRATION', collegeName, userName } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email address is required' });
      return;
    }

    const result = await sendOTPEmail({
      email: email.trim().toLowerCase(),
      purpose,
      collegeName,
      userName,
    });

    res.json({
      success: true,
      message: `A 6-digit verification OTP has been dispatched to ${email}`,
      devPreviewOtp: result.otpCode,
    });
  } catch (err: any) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Failed to dispatch email verification code' });
  }
});

// POST /api/auth/verify-otp - Check 6-digit OTP validity
router.post('/verify-otp', (req: Request, res: Response) => {
  try {
    const { email, otpCode, purpose = 'REGISTRATION' } = req.body;
    if (!email || !otpCode) {
      res.status(400).json({ error: 'Email and 6-digit OTP code are required' });
      return;
    }

    const isValid = verifyOTP(email.trim().toLowerCase(), otpCode, purpose, false);
    if (!isValid) {
      res.status(400).json({ error: 'Invalid or expired 6-digit verification code. Please check your inbox or request a new code.' });
      return;
    }

    res.json({ success: true, message: 'Email verification confirmed successfully!' });
  } catch (err: any) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/auth/google-login - Verify Google OAuth Token
router.post('/google-login', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ error: 'Google credential token is required' });
      return;
    }

    const profile = await verifyGoogleToken(credential);
    if (!profile || !profile.email) {
      res.status(401).json({ error: 'Google authentication verification failed' });
      return;
    }

    const normalizedEmail = profile.email.toLowerCase().trim();

    // Check if user exists in database
    const user = dbGet(
      `SELECT u.*, c.name as college_name, c.code as college_code, c.logo_url as college_logo
       FROM users u
       JOIN colleges c ON u.college_id = c.id
       WHERE LOWER(u.email) = ?`,
      [normalizedEmail]
    );

    if (!user) {
      // User is not yet registered in a college workspace -> Return profile so frontend can prefill registration
      res.json({
        isNewUser: true,
        message: 'Google identity verified. Please complete your college and department registration details.',
        profile: {
          email: normalizedEmail,
          name: profile.name,
          picture: profile.picture,
          googleId: profile.googleId,
        },
      });
      return;
    }

    if (user.status === 'PENDING') {
      res.status(403).json({
        error: 'Account Pending Approval',
        status: 'PENDING',
        message: 'Your Google-linked account is waiting for College Administrator approval.',
      });
      return;
    }

    if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
      res.status(403).json({
        error: `Account ${user.status}`,
        status: user.status,
        message: 'Your account has been restricted. Please contact your college administrator.',
      });
      return;
    }

    const token = generateToken({ id: user.id, college_id: user.college_id, role: user.role, email: user.email });
    const profileData = getUserProfileData(user.id, user.role);

    logActivity(user.college_id, user.id, user.full_name, user.role, 'USER_LOGIN', `User logged in via Google OAuth`);

    res.json({
      token,
      user: {
        id: user.id,
        college_id: user.college_id,
        college_name: user.college_name,
        college_code: user.college_code,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        avatar_url: user.avatar_url || profile.picture,
        is_primary_admin: user.is_primary_admin,
        profile: profileData,
      },
    });
  } catch (err: any) {
    console.error('Error in Google login:', err);
    res.status(500).json({ error: err.message || 'Google authentication error' });
  }
});

// POST /api/auth/login-otp - Passwordless Login via Email OTP
router.post('/login-otp', async (req: Request, res: Response) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      res.status(400).json({ error: 'Email and 6-digit OTP code are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isValid = verifyOTP(normalizedEmail, otpCode, 'LOGIN');
    if (!isValid) {
      res.status(401).json({ error: 'Invalid or expired 6-digit OTP code. Please request a new code.' });
      return;
    }

    const user = dbGet(
      `SELECT u.*, c.name as college_name, c.code as college_code, c.logo_url as college_logo
       FROM users u
       JOIN colleges c ON u.college_id = c.id
       WHERE LOWER(u.email) = ?`,
      [normalizedEmail]
    );

    if (!user) {
      res.status(404).json({ error: 'No college account found with this email. Please register first.' });
      return;
    }

    if (user.status === 'PENDING') {
      res.status(403).json({
        error: 'Account Pending Approval',
        status: 'PENDING',
        message: 'Your account is waiting for College Administrator approval.',
      });
      return;
    }

    if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
      res.status(403).json({
        error: `Account ${user.status}`,
        status: user.status,
        message: 'Your account has been restricted. Please contact your college administrator.',
      });
      return;
    }

    const token = generateToken({ id: user.id, college_id: user.college_id, role: user.role, email: user.email });
    const profileData = getUserProfileData(user.id, user.role);

    logActivity(user.college_id, user.id, user.full_name, user.role, 'USER_LOGIN', `User logged in via Email OTP`);

    res.json({
      token,
      user: {
        id: user.id,
        college_id: user.college_id,
        college_name: user.college_name,
        college_code: user.college_code,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        avatar_url: user.avatar_url,
        is_primary_admin: user.is_primary_admin,
        profile: profileData,
      },
    });
  } catch (err: any) {
    console.error('Error during OTP login:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/auth/register-admin - First-time Administrator & College Workspace Creation
router.post('/register-admin', async (req: Request, res: Response) => {
  try {
    const {
      adminName,
      collegeName,
      collegeEmail,
      collegePhone,
      collegeAddress,
      collegeType,
      collegeWebsite,
      email,
      phone,
      password,
      otpCode,
    } = req.body;

    if (!adminName || !collegeName || !email || !password) {
      res.status(400).json({ error: 'All mandatory administrator and college fields are required' });
      return;
    }

    // If OTP was provided, verify it
    if (otpCode) {
      const isValid = verifyOTP(email.trim().toLowerCase(), otpCode, 'REGISTRATION');
      if (!isValid) {
        res.status(400).json({ error: 'Invalid or expired email OTP verification code' });
        return;
      }
    }

    // Check if college email or college name already registered
    const existingCollege = dbGet(
      `SELECT id, name FROM colleges WHERE LOWER(email) = ? OR LOWER(name) = ?`,
      [(collegeEmail || email).toLowerCase(), collegeName.toLowerCase()]
    );

    if (existingCollege) {
      res.status(400).json({
        error: 'A college workspace already exists with this name or official email. Only ONE primary administrator is permitted per college.'
      });
      return;
    }

    const collegeId = uuidv4();
    const adminUserId = uuidv4();
    const collegeCode = collegeName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
    const passwordHash = bcrypt.hashSync(password, 10);

    // 1. Create College
    dbRun(
      `INSERT INTO colleges (id, name, code, email, phone, website, address, college_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [collegeId, collegeName, collegeCode, collegeEmail || email, collegePhone || phone, collegeWebsite || '', collegeAddress || 'Main Campus', collegeType || 'Arts & Science']
    );

    // 2. Create College Settings with defaults
    dbRun(
      `INSERT INTO college_settings (college_id, attendance_threshold_good, attendance_threshold_warning, academic_year, current_semester, allow_student_messaging, ai_enabled)
       VALUES (?, 75.0, 70.0, '2026-2027', 'Odd', 1, 1)`,
      [collegeId]
    );

    // 3. Create ONE Primary Administrator (automatically APPROVED)
    dbRun(
      `INSERT INTO users (id, college_id, role, full_name, email, phone, password_hash, status, is_primary_admin, created_at)
       VALUES (?, ?, 'ADMIN', ?, ?, ?, ?, 'APPROVED', 1, datetime('now'))`,
      [adminUserId, collegeId, adminName, email.trim().toLowerCase(), phone || collegePhone, passwordHash]
    );

    // 4. Create standard default Arts & Science departments
    const defaultDepts = [
      { name: 'Computer Science', code: 'CS' },
      { name: 'Information Technology', code: 'IT' },
      { name: 'Commerce', code: 'COMM' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'English Literature', code: 'ENG' },
    ];

    for (const d of defaultDepts) {
      dbRun(
        `INSERT INTO departments (id, college_id, name, code, description, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`,
        [uuidv4(), collegeId, d.name, d.code, `Department of ${d.name}`]
      );
    }

    logActivity(collegeId, adminUserId, adminName, 'ADMIN', 'COLLEGE_REGISTERED', `Registered new college workspace: ${collegeName}`);

    const token = generateToken({ id: adminUserId, college_id: collegeId, role: 'ADMIN', email });
    const user = dbGet(`SELECT id, college_id, role, full_name, email, phone, status, is_primary_admin FROM users WHERE id = ?`, [adminUserId]);

    res.status(201).json({
      message: 'College workspace created successfully as Primary Administrator',
      token,
      user,
      college: { id: collegeId, name: collegeName, code: collegeCode }
    });
  } catch (err: any) {
    console.error('Error registering admin:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/auth/register-faculty - Faculty registration
router.post('/register-faculty', async (req: Request, res: Response) => {
  try {
    const {
      collegeId,
      departmentId,
      fullName,
      email,
      phone,
      password,
      designation,
      qualification,
      specialization,
      subjectsHandled,
      otpCode,
    } = req.body;

    if (!collegeId || !departmentId || !fullName || !email || !password) {
      res.status(400).json({ error: 'Missing mandatory registration fields' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify OTP if provided
    if (otpCode) {
      const isValid = verifyOTP(normalizedEmail, otpCode, 'REGISTRATION');
      if (!isValid) {
        res.status(400).json({ error: 'Invalid or expired email OTP verification code' });
        return;
      }
    }

    // Check if user email already exists in college
    const existingUser = dbGet(`SELECT id FROM users WHERE college_id = ? AND LOWER(email) = ?`, [collegeId, normalizedEmail]);
    if (existingUser) {
      res.status(400).json({ error: 'A user account with this email already exists in this college' });
      return;
    }

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    // Create user in PENDING state
    dbRun(
      `INSERT INTO users (id, college_id, role, full_name, email, phone, password_hash, status, created_at)
       VALUES (?, ?, 'FACULTY', ?, ?, ?, ?, 'PENDING', datetime('now'))`,
      [userId, collegeId, fullName, normalizedEmail, phone, passwordHash]
    );

    // Create Faculty Profile
    dbRun(
      `INSERT INTO faculty_profiles (user_id, department_id, designation, qualification, specialization, is_guidance_counselor)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [userId, departmentId, designation || 'Assistant Professor', qualification || 'M.Sc., M.Phil.', specialization || subjectsHandled || 'Academic Faculty']
    );

    const dept = dbGet(`SELECT name FROM departments WHERE id = ?`, [departmentId]);

    notifyCollegeAdmins(
      collegeId,
      'New Faculty Registration Request',
      `Faculty applicant ${fullName} (${designation || 'Faculty'}) registered for Department of ${dept?.name || 'Department'}. Pending your approval.`
    );

    logActivity(collegeId, userId, fullName, 'FACULTY', 'FACULTY_REGISTRATION_SUBMITTED', `Submitted registration request for approval in ${dept?.name || 'Department'}`);

    res.status(201).json({
      message: 'Faculty registration request submitted successfully. Your account is waiting for Administrator approval.',
      status: 'PENDING',
      userId,
    });
  } catch (err: any) {
    console.error('Error registering faculty:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/auth/register-student - Student registration
router.post('/register-student', async (req: Request, res: Response) => {
  try {
    const {
      collegeId,
      departmentId,
      fullName,
      email,
      phone,
      password,
      course,
      year,
      section,
      rollNumber,
      otpCode,
    } = req.body;

    if (!collegeId || !departmentId || !fullName || !email || !password || !rollNumber) {
      res.status(400).json({ error: 'Missing mandatory student registration details' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify OTP if provided
    if (otpCode) {
      const isValid = verifyOTP(normalizedEmail, otpCode, 'REGISTRATION');
      if (!isValid) {
        res.status(400).json({ error: 'Invalid or expired email OTP verification code' });
        return;
      }
    }

    // Check existing email
    const existingUser = dbGet(`SELECT id FROM users WHERE college_id = ? AND LOWER(email) = ?`, [collegeId, normalizedEmail]);
    if (existingUser) {
      res.status(400).json({ error: 'A user account with this email already exists in this college' });
      return;
    }

    // Check duplicate roll number in department
    const existingRoll = dbGet(`SELECT user_id FROM student_profiles WHERE department_id = ? AND roll_number = ?`, [departmentId, rollNumber]);
    if (existingRoll) {
      res.status(400).json({ error: `Roll Number "${rollNumber}" is already registered in this department` });
      return;
    }

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    // Create user in PENDING state
    dbRun(
      `INSERT INTO users (id, college_id, role, full_name, email, phone, password_hash, status, created_at)
       VALUES (?, ?, 'STUDENT', ?, ?, ?, ?, 'PENDING', datetime('now'))`,
      [userId, collegeId, fullName, normalizedEmail, phone, passwordHash]
    );

    // Create Student Profile
    dbRun(
      `INSERT INTO student_profiles (user_id, department_id, course, year, section, roll_number, academic_identifier)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, departmentId, course || 'Undergraduate', year || 'I Year', section || 'Section A', rollNumber, `CN-${rollNumber}`]
    );

    const dept = dbGet(`SELECT name FROM departments WHERE id = ?`, [departmentId]);

    notifyCollegeAdmins(
      collegeId,
      'New Student Registration Request',
      `Student ${fullName} (Roll: ${rollNumber}, ${year || 'I Year'} ${dept?.name || ''}) registered. Pending your approval.`
    );

    logActivity(collegeId, userId, fullName, 'STUDENT', 'STUDENT_REGISTRATION_SUBMITTED', `Submitted student registration for ${dept?.name || 'Department'}`);

    res.status(201).json({
      message: 'Student registration submitted successfully. Your account is waiting for Administrator approval.',
      status: 'PENDING',
      userId,
    });
  } catch (err: any) {
    console.error('Error registering student:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/auth/register-care-club - Campus Care Club mentor / counselor registration
router.post('/register-care-club', async (req: Request, res: Response) => {
  try {
    const {
      collegeId,
      fullName,
      email,
      phone,
      password,
      designation,
      qualification,
      specialization,
      bio,
      availableHours,
      otpCode,
    } = req.body;

    if (!collegeId || !fullName || !email || !password) {
      res.status(400).json({ error: 'Missing mandatory Care Club registration details' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify OTP if provided
    if (otpCode) {
      const isValid = verifyOTP(normalizedEmail, otpCode, 'REGISTRATION');
      if (!isValid) {
        res.status(400).json({ error: 'Invalid or expired email OTP verification code' });
        return;
      }
    }

    // Check existing email
    const existingUser = dbGet(`SELECT id FROM users WHERE college_id = ? AND LOWER(email) = ?`, [collegeId, normalizedEmail]);
    if (existingUser) {
      res.status(400).json({ error: 'A user account with this email already exists in this college' });
      return;
    }

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    // Create user in PENDING state
    dbRun(
      `INSERT INTO users (id, college_id, role, full_name, email, phone, password_hash, status, created_at)
       VALUES (?, ?, 'CARE_CLUB', ?, ?, ?, ?, 'PENDING', datetime('now'))`,
      [userId, collegeId, fullName, normalizedEmail, phone, passwordHash]
    );

    // Create Care Club Profile
    dbRun(
      `INSERT INTO care_club_profiles (user_id, designation, qualification, specialization, bio, available_hours, anonymous_allowed, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
      [
        userId,
        designation || 'Student Wellness Mentor',
        qualification || 'M.Sc. Psychology / Certified Counselor',
        specialization || 'Student Guidance & Wellness',
        bio || 'Dedicated to supporting students with academic guidance, mental wellness, and personal growth.',
        availableHours || 'Mon - Fri: 10:00 AM - 5:00 PM',
      ]
    );

    notifyCollegeAdmins(
      collegeId,
      'New Campus Care Club Registration Request',
      `Campus Care Club applicant ${fullName} (${designation || 'Counselor'}) has registered. Pending your approval.`
    );

    logActivity(collegeId, userId, fullName, 'CARE_CLUB', 'CARE_CLUB_REGISTRATION_SUBMITTED', `Submitted Campus Care Club registration for approval`);

    res.status(201).json({
      message: 'Campus Care Club registration submitted successfully! Your account is pending Administrator approval before activation.',
      status: 'PENDING',
      userId,
    });
  } catch (err: any) {
    console.error('Error registering care club member:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/auth/login - Email OR Phone Number + Password Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, phone, password, role } = req.body;
    const identifier = (email || phone || '').trim();

    if (!identifier || !password) {
      res.status(400).json({ error: 'Email/Phone and password are required' });
      return;
    }

    const cleanPhone = identifier.replace(/[^0-9+]/g, '');
    const user = dbGet(
      `SELECT u.*, c.name as college_name, c.code as college_code, c.logo_url as college_logo
       FROM users u
       JOIN colleges c ON u.college_id = c.id
       WHERE LOWER(u.email) = ? OR u.phone = ? OR REPLACE(u.phone, ' ', '') = ?`,
      [identifier.toLowerCase(), identifier, cleanPhone]
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials. No registered college account matches this email or phone.' });
      return;
    }

    if (role && user.role !== role) {
      res.status(401).json({
        error: `This account is registered as a ${user.role}. Please use the ${user.role.toLowerCase()} login tab.`
      });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
      return;
    }

    if (user.status === 'PENDING') {
      res.status(403).json({
        error: 'Account Pending Approval',
        status: 'PENDING',
        message: 'Your account is waiting for College Administrator approval. You will be able to access the dashboard once approved.',
      });
      return;
    }

    if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
      res.status(403).json({
        error: `Account ${user.status}`,
        status: user.status,
        message: 'Your account has been restricted or requires correction. Please contact your college administrator.',
      });
      return;
    }

    const token = generateToken({ id: user.id, college_id: user.college_id, role: user.role, email: user.email });
    const profileData = getUserProfileData(user.id, user.role);

    logActivity(user.college_id, user.id, user.full_name, user.role, 'USER_LOGIN', `User logged into ${user.role.toLowerCase()} portal`);

    res.json({
      token,
      user: {
        id: user.id,
        college_id: user.college_id,
        college_name: user.college_name,
        college_code: user.college_code,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        avatar_url: user.avatar_url,
        is_primary_admin: user.is_primary_admin,
        profile: profileData,
      },
    });
  } catch (err: any) {
    console.error('Error during login:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/auth/me - Authenticated Current User Profile
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const college = dbGet(`SELECT * FROM colleges WHERE id = ?`, [user.college_id]);
  const settings = dbGet(`SELECT * FROM college_settings WHERE college_id = ?`, [user.college_id]);
  const profileData = getUserProfileData(user.id, user.role);

  const unreadNotifs = dbGet(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
    [user.id]
  )?.count || 0;

  res.json({
    user: {
      ...user,
      profile: profileData,
    },
    college,
    settings,
    unreadNotifications: unreadNotifs,
  });
});

export default router;
