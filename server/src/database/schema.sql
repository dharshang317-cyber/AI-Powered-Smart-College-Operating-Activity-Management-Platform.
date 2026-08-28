-- CampusNexus AI Relational Database Schema

-- Colleges
CREATE TABLE IF NOT EXISTS colleges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    website TEXT,
    address TEXT NOT NULL,
    college_type TEXT DEFAULT 'Arts & Science',
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- College Settings
CREATE TABLE IF NOT EXISTS college_settings (
    college_id TEXT PRIMARY KEY,
    attendance_threshold_good REAL DEFAULT 75.0,
    attendance_threshold_warning REAL DEFAULT 70.0,
    academic_year TEXT DEFAULT '2026-2027',
    current_semester TEXT DEFAULT 'Odd',
    allow_student_messaging INTEGER DEFAULT 1,
    ai_enabled INTEGER DEFAULT 1,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- Users (Admin, Faculty, Student, Campus Care Club)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    college_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'FACULTY', 'STUDENT', 'CARE_CLUB')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    avatar_url TEXT,
    is_primary_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    UNIQUE(college_id, email)
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    college_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    hod_name TEXT,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    UNIQUE(college_id, code)
);

-- Faculty Profiles
CREATE TABLE IF NOT EXISTS faculty_profiles (
    user_id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL,
    designation TEXT NOT NULL,
    qualification TEXT,
    specialization TEXT,
    is_guidance_counselor INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- Campus Care Club Profiles (Mentors, Counselors & Guides)
CREATE TABLE IF NOT EXISTS care_club_profiles (
    user_id TEXT PRIMARY KEY,
    designation TEXT NOT NULL, -- e.g. Senior Student Counselor, Mental Wellness Mentor, Career Advisor, Peer Guide
    qualification TEXT,
    specialization TEXT, -- e.g. Exam Stress, Mental Wellness, Career Guidance, Academic Tutoring, Personal Advice
    bio TEXT,
    available_hours TEXT DEFAULT 'Mon - Fri: 10:00 AM - 5:00 PM',
    anonymous_allowed INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Student Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
    user_id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL,
    course TEXT NOT NULL,
    year TEXT NOT NULL,
    section TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    academic_identifier TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE CASCADE,
    UNIQUE(department_id, roll_number)
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    college_id TEXT NOT NULL,
    department_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    semester TEXT NOT NULL,
    faculty_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY(faculty_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(college_id, code)
);

-- Timetable
CREATE TABLE IF NOT EXISTS timetables (
    id TEXT PRIMARY KEY,
    college_id TEXT NOT NULL,
    department_id TEXT NOT NULL,
    year TEXT NOT NULL,
    section TEXT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 6), -- 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    period_number INTEGER NOT NULL CHECK(period_number BETWEEN 1 AND 6),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    faculty_id TEXT,
    room_number TEXT,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY(faculty_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    college_id TEXT NOT NULL,
    department_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    faculty_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    period_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT', 'ON_DUTY')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY(faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(subject_id, student_id, date, period_number)
);

-- Smart Classroom Posts (PPT, PDF, Notes, Assignments, etc.)
CREATE TABLE IF NOT EXISTS classroom_posts (
    id TEXT PRIMARY KEY,
    college_id TEXT NOT NULL,
    department_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    faculty_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    post_type TEXT NOT NULL CHECK(post_type IN ('PPT', 'PDF', 'NOTES', 'ASSIGNMENT', 'VIDEO_LINK', 'ANNOUNCEMENT', 'STUDY_MATERIAL', 'REFERENCE_LINK')),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    external_url TEXT,
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY(faculty_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Classroom Comments
CREATE TABLE IF NOT EXISTS classroom_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES classroom_posts(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Assessments (Online Quizzes / Tests)
CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    college_id TEXT NOT NULL,
    department_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    faculty_id TEXT NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 15,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    total_marks INTEGER NOT NULL DEFAULT 10,
    is_published INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY(faculty_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Assessment Questions
CREATE TABLE IF NOT EXISTS assessment_questions (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL CHECK(correct_option IN ('A', 'B', 'C', 'D')),
    marks INTEGER NOT NULL DEFAULT 1,
    explanation TEXT,
    FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

-- Assessment Submissions
CREATE TABLE IF NOT EXISTS assessment_submissions (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    score REAL NOT NULL,
    total_marks INTEGER NOT NULL,
    percentage REAL NOT NULL,
    answers_json TEXT NOT NULL,
    time_taken_seconds INTEGER,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(assessment_id, student_id)
);

-- Campus Events
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    college_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('Workshop', 'Seminar', 'Symposium', 'Cultural Event', 'Sports', 'Hackathon', 'Coding Contest', 'Club Activity', 'Guest Lecture', 'Placement Event', 'Department Event')),
    venue TEXT NOT NULL,
    event_date TEXT NOT NULL, -- YYYY-MM-DD
    event_time TEXT NOT NULL,
    organizer TEXT NOT NULL,
    department_id TEXT,
    poster_url TEXT,
    max_participants INTEGER DEFAULT 100,
    registration_deadline DATETIME NOT NULL,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Event Registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'REGISTERED' CHECK(status IN ('REGISTERED', 'ATTENDED', 'CANCELLED')),
    FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(event_id, student_id)
);

-- Messages (Student <-> Faculty)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    college_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    message_text TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Campus Care (Student Wellbeing & Guidance Hub)
CREATE TABLE IF NOT EXISTS guidance_requests (
    id TEXT PRIMARY KEY,
    college_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    counselor_id TEXT,
    category TEXT NOT NULL CHECK(category IN ('Academic difficulty', 'Exam stress', 'Study planning', 'Career guidance', 'Personal concerns', 'College-related concerns')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    preferred_time TEXT,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(counselor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Campus Care Notes / Messages
CREATE TABLE IF NOT EXISTS guidance_messages (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    message_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(request_id) REFERENCES guidance_requests(id) ON DELETE CASCADE,
    FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    college_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    college_id TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT,
    role TEXT,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- Campus Pulse (Public College Feed)
CREATE TABLE IF NOT EXISTS campus_pulse (
    id TEXT PRIMARY KEY,
    college_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT,
    author_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- Email OTP Verification Table
CREATE TABLE IF NOT EXISTS email_otps (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast queries & multi-tenant isolation
CREATE INDEX IF NOT EXISTS idx_users_college ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_dept_college ON departments(college_id);
CREATE INDEX IF NOT EXISTS idx_subj_dept ON subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_attend_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attend_subject ON attendance_records(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subj ON classroom_posts(subject_id);
CREATE INDEX IF NOT EXISTS idx_assess_subj ON assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_events_college ON events(college_id);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_otp_email ON email_otps(email, purpose, is_used);

