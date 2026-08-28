import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, dbRun, dbGet, dbAll } from './db';

export async function seedDatabase() {
  await initDatabase();

  // Create table care_club_profiles if not existing
  dbRun(`
    CREATE TABLE IF NOT EXISTS care_club_profiles (
      user_id TEXT PRIMARY KEY,
      designation TEXT NOT NULL,
      qualification TEXT,
      specialization TEXT,
      bio TEXT,
      available_hours TEXT,
      anonymous_allowed INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const existingCollege = dbGet(`SELECT id FROM colleges WHERE code = ?`, ['ASC-001']);
  if (existingCollege) {
    console.log('Database already initialized with official college structure.');
    return;
  }

  console.log('Seeding CampusNexus Arts & Science College data...');

  const collegeId = uuidv4();
  const passwordHash = bcrypt.hashSync('Student@1234', 10);
  const facultyPasswordHash = bcrypt.hashSync('Faculty@123', 10);
  const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);

  // 1. Create College
  dbRun(
    `INSERT INTO colleges (id, name, code, email, phone, website, address, college_type, logo_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      collegeId,
      'CampusNexus Arts & Science College',
      'ASC-001',
      'principal@campusnexus.edu',
      '+91 98765 43210',
      'https://campusnexus.edu',
      '42 University Avenue, Knowledge City, Chennai, Tamil Nadu, India',
      'Autonomous Arts & Science College',
      'https://images.unsplash.com/photo-1562774053-701939374585?w=200&h=200&fit=crop',
    ]
  );

  // 2. Create College Settings
  dbRun(
    `INSERT INTO college_settings (college_id, attendance_threshold_good, attendance_threshold_warning, academic_year, current_semester, allow_student_messaging, ai_enabled)
     VALUES (?, 75.0, 70.0, '2026-2027', 'Odd (Sem V/III/I)', 1, 1)`,
    [collegeId]
  );

  // 3. Create ONE Primary Administrator
  const adminId = uuidv4();
  dbRun(
    `INSERT INTO users (id, college_id, role, full_name, email, phone, password_hash, status, is_primary_admin, avatar_url, created_at)
     VALUES (?, ?, 'ADMIN', 'Dr. S. K. Ramanathan', 'admin@campusnexus.edu', '+91 98765 00001', ?, 'APPROVED', 1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop', datetime('now'))`,
    [adminId, collegeId, adminPasswordHash]
  );

  // 4. Create 6 Departments
  const departmentsData = [
    { name: 'Information Technology', code: 'IT', hod: 'Dr. Meena Sundaram' },
    { name: 'Computer Science', code: 'CS', hod: 'Dr. K. Vijayakumar' },
    { name: 'Commerce & Computer Applications', code: 'COMM', hod: 'Dr. R. Balaji' },
    { name: 'Mathematics', code: 'MATH', hod: 'Dr. P. Ananthi' },
    { name: 'English Literature', code: 'ENG', hod: 'Dr. Sarah Joseph' },
    { name: 'Physics & Electronics', code: 'PHY', hod: 'Dr. G. Ramesh' },
  ];

  const deptMap = new Map<string, string>();

  for (const dept of departmentsData) {
    const deptId = uuidv4();
    deptMap.set(dept.code, deptId);
    dbRun(
      `INSERT INTO departments (id, college_id, name, code, hod_name, description, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
      [deptId, collegeId, dept.name, dept.code, dept.hod, `Department of ${dept.name} - Academic Center of Excellence`]
    );
  }

  // 5. Seed Faculty and Subjects for each Department
  const facultyData = [
    {
      deptCode: 'IT',
      name: 'Prof. Rajesh Kumar',
      email: 'faculty.it@campusnexus.edu',
      designation: 'Associate Professor & HOD I/C',
      subjectName: 'Web Technology & Cloud Computing',
      subjectCode: 'IT301',
      isCounselor: 1,
    },
    {
      deptCode: 'CS',
      name: 'Dr. Priya Anbarasan',
      email: 'faculty.cs@campusnexus.edu',
      designation: 'Assistant Professor',
      subjectName: 'Data Structures & Algorithms in Java',
      subjectCode: 'CS302',
      isCounselor: 1,
    },
    {
      deptCode: 'COMM',
      name: 'Prof. Suresh Krishnan',
      email: 'faculty.comm@campusnexus.edu',
      designation: 'Head of Department',
      subjectName: 'Corporate Accounting & FinTech',
      subjectCode: 'CO303',
      isCounselor: 0,
    },
    {
      deptCode: 'MATH',
      name: 'Dr. Nandini Sharma',
      email: 'faculty.math@campusnexus.edu',
      designation: 'Associate Professor',
      subjectName: 'Discrete Mathematics & Optimization',
      subjectCode: 'MA304',
      isCounselor: 1,
    },
    {
      deptCode: 'ENG',
      name: 'Prof. David Livingstone',
      email: 'faculty.eng@campusnexus.edu',
      designation: 'Assistant Professor',
      subjectName: 'Technical & Business Communication',
      subjectCode: 'EN305',
      isCounselor: 0,
    },
    {
      deptCode: 'PHY',
      name: 'Dr. Aruna Chandrasekhar',
      email: 'faculty.phy@campusnexus.edu',
      designation: 'Professor',
      subjectName: 'Quantum Mechanics & Microprocessors',
      subjectCode: 'PH306',
      isCounselor: 0,
    },
  ];

  const facultyMap = new Map<string, { userId: string; subjectId: string }>();

  for (const f of facultyData) {
    const facultyUserId = uuidv4();
    const deptId = deptMap.get(f.deptCode)!;

    dbRun(
      `INSERT INTO users (id, college_id, role, full_name, email, phone, password_hash, status, avatar_url, created_at)
       VALUES (?, ?, 'FACULTY', ?, ?, '+91 98400 11223', ?, 'APPROVED', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop', datetime('now'))`,
      [facultyUserId, collegeId, f.name, f.email, facultyPasswordHash]
    );

    dbRun(
      `INSERT INTO faculty_profiles (user_id, department_id, designation, qualification, specialization, is_guidance_counselor)
       VALUES (?, ?, ?, 'Ph.D., M.Phil.', 'Advanced Systems', ?)`,
      [facultyUserId, deptId, f.designation, f.isCounselor]
    );

    const subjectId = uuidv4();
    dbRun(
      `INSERT INTO subjects (id, college_id, department_id, name, code, semester, faculty_id, created_at)
       VALUES (?, ?, ?, ?, ?, 'V Semester', ?, datetime('now'))`,
      [subjectId, collegeId, deptId, f.subjectName, f.subjectCode, facultyUserId]
    );

    facultyMap.set(f.deptCode, { userId: facultyUserId, subjectId });
  }

  // 6. Seed 3 Students per Department (Total 18 Students)
  const studentNames = [
    { first: 'Dharshan', last: 'G', roll: '23IT001', dept: 'IT', email: 'dharshan.it@campusnexus.edu' },
    { first: 'Ananya', last: 'Ramesh', roll: '23IT002', dept: 'IT', email: 'ananya.it@campusnexus.edu' },
    { first: 'Karthik', last: 'Subramanian', roll: '23IT003', dept: 'IT', email: 'karthik.it@campusnexus.edu' },

    { first: 'Rohit', last: 'Menon', roll: '23CS001', dept: 'CS', email: 'rohit.cs@campusnexus.edu' },
    { first: 'Sneha', last: 'Iyer', roll: '23CS002', dept: 'CS', email: 'sneha.cs@campusnexus.edu' },
    { first: 'Vignesh', last: 'Pandian', roll: '23CS003', dept: 'CS', email: 'vignesh.cs@campusnexus.edu' },

    { first: 'Harish', last: 'Kumar', roll: '23CO001', dept: 'COMM', email: 'harish.comm@campusnexus.edu' },
    { first: 'Divya', last: 'Lakshmi', roll: '23CO002', dept: 'COMM', email: 'divya.comm@campusnexus.edu' },
    { first: 'Pooja', last: 'Shree', roll: '23CO003', dept: 'COMM', email: 'pooja.comm@campusnexus.edu' },

    { first: 'Arun', last: 'Prasad', roll: '23MA001', dept: 'MATH', email: 'arun.math@campusnexus.edu' },
    { first: 'Bhavani', last: 'Devi', roll: '23MA002', dept: 'MATH', email: 'bhavani.math@campusnexus.edu' },
    { first: 'Gowtham', last: 'S', roll: '23MA003', dept: 'MATH', email: 'gowtham.math@campusnexus.edu' },

    { first: 'Deepak', last: 'Raj', roll: '23EN001', dept: 'ENG', email: 'deepak.eng@campusnexus.edu' },
    { first: 'Kavitha', last: 'M', roll: '23EN002', dept: 'ENG', email: 'kavitha.eng@campusnexus.edu' },
    { first: 'Naveen', last: 'Kumar', roll: '23EN003', dept: 'ENG', email: 'naveen.eng@campusnexus.edu' },

    { first: 'Praveen', last: 'Kumar', roll: '23PH001', dept: 'PHY', email: 'praveen.phy@campusnexus.edu' },
    { first: 'Sangeetha', last: 'K', roll: '23PH002', dept: 'PHY', email: 'sangeetha.phy@campusnexus.edu' },
    { first: 'Varun', last: 'Tej', roll: '23PH003', dept: 'PHY', email: 'varun.phy@campusnexus.edu' },
  ];

  const itStudentIds: string[] = [];

  for (const s of studentNames) {
    const studentUserId = uuidv4();
    const deptId = deptMap.get(s.dept)!;
    if (s.dept === 'IT') itStudentIds.push(studentUserId);

    dbRun(
      `INSERT INTO users (id, college_id, role, full_name, email, phone, password_hash, status, avatar_url, created_at)
       VALUES (?, ?, 'STUDENT', ?, ?, '+91 99887 66554', ?, 'APPROVED', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop', datetime('now'))`,
      [studentUserId, collegeId, `${s.first} ${s.last}`, s.email, passwordHash]
    );

    dbRun(
      `INSERT INTO student_profiles (user_id, department_id, course, year, section, roll_number, academic_identifier)
       VALUES (?, ?, 'B.Sc ${s.dept}', 'III Year', 'Section A', ?, ?)`,
      [studentUserId, deptId, s.roll, `CN-2023-${s.roll}`]
    );
  }

  // 6b. Seed Campus Care Club Mentors
  const careClubMentor1Id = uuidv4();
  dbRun(
    `INSERT INTO users (id, college_id, role, full_name, email, phone, password_hash, status, avatar_url, created_at)
     VALUES (?, ?, 'CARE_CLUB', 'Dr. Maya Venkatesh', 'care.club@campusnexus.edu', '+91 98888 11223', ?, 'APPROVED', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop', datetime('now'))`,
    [careClubMentor1Id, collegeId, facultyPasswordHash]
  );
  dbRun(
    `INSERT INTO care_club_profiles (user_id, designation, qualification, specialization, bio, available_hours, anonymous_allowed, created_at)
     VALUES (?, 'Senior Student Counselor & Wellness Lead', 'Ph.D. Counseling Psychology', 'Exam Stress & Mental Wellness', 'Dedicated to supporting students across all departments with complete confidentiality, empathetic advice, and personalized study planning.', 'Mon - Fri: 10:00 AM - 5:00 PM', 1, datetime('now'))`,
    [careClubMentor1Id]
  );

  const careClubMentor2Id = uuidv4();
  dbRun(
    `INSERT INTO users (id, college_id, role, full_name, email, phone, password_hash, status, avatar_url, created_at)
     VALUES (?, ?, 'CARE_CLUB', 'Prof. Anand Srinivasan', 'anand.care@campusnexus.edu', '+91 98888 22334', ?, 'APPROVED', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop', datetime('now'))`,
    [careClubMentor2Id, collegeId, facultyPasswordHash]
  );
  dbRun(
    `INSERT INTO care_club_profiles (user_id, designation, qualification, specialization, bio, available_hours, anonymous_allowed, created_at)
     VALUES (?, 'Career & Higher Studies Advisor', 'M.S. & MBA (IIM)', 'Career Planning & Placement Advisory', 'Empowering students with industry guidance, resume coaching, technical placement strategies, and international higher education advice.', 'Mon - Thu: 02:00 PM - 06:00 PM', 1, datetime('now'))`,
    [careClubMentor2Id]
  );

  // Pending Applicants for Admin Approval Workflow
  const pendingCareId = uuidv4();
  dbRun(
    `INSERT INTO users (id, college_id, role, full_name, email, phone, password_hash, status, avatar_url, created_at)
     VALUES (?, ?, 'CARE_CLUB', 'Ms. Sneha Varma', 'sneha.care.pending@campusnexus.edu', '+91 91234 33445', ?, 'PENDING', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop', datetime('now'))`,
    [pendingCareId, collegeId, passwordHash]
  );
  dbRun(
    `INSERT INTO care_club_profiles (user_id, designation, qualification, specialization, bio, available_hours, anonymous_allowed, created_at)
     VALUES (?, 'Peer Support & Student Wellness Guide', 'M.Sc. Applied Psychology', 'Freshman Transition & Personal Guidance', 'Specialized in helping students overcome academic anxiety and transition smoothly into college life.', 'Tue - Sat: 11:00 AM - 04:00 PM', 1, datetime('now'))`,
    [pendingCareId]
  );

  const pendingFacultyId = uuidv4();
  dbRun(
    `INSERT INTO users (id, college_id, role, full_name, email, phone, password_hash, status, avatar_url, created_at)
     VALUES (?, ?, 'FACULTY', 'Dr. Arvind Swaminathan', 'arvind.pending@campusnexus.edu', '+91 91234 56789', ?, 'PENDING', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', datetime('now'))`,
    [pendingFacultyId, collegeId, facultyPasswordHash]
  );
  dbRun(
    `INSERT INTO faculty_profiles (user_id, department_id, designation, qualification, specialization, is_guidance_counselor)
     VALUES (?, ?, 'Assistant Professor', 'Ph.D. in AI', 'Neural Networks', 0)`,
    [pendingFacultyId, deptMap.get('IT')!]
  );

  const pendingStudentId = uuidv4();
  dbRun(
    `INSERT INTO users (id, college_id, role, full_name, email, phone, password_hash, status, avatar_url, created_at)
     VALUES (?, ?, 'STUDENT', 'Manoj Kumar V', 'manoj.pending@campusnexus.edu', '+91 91234 98765', ?, 'PENDING', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', datetime('now'))`,
    [pendingStudentId, collegeId, passwordHash]
  );
  dbRun(
    `INSERT INTO student_profiles (user_id, department_id, course, year, section, roll_number, academic_identifier)
     VALUES (?, ?, 'B.Sc Information Technology', 'I Year', 'Section B', '26IT042', 'CN-2026-26IT042')`,
    [pendingStudentId, deptMap.get('IT')!]
  );

  // 7. Seed Weekly Timetable for B.Sc IT (Mon - Fri, Periods 1 to 5)
  const itDeptId = deptMap.get('IT')!;
  const itFaculty = facultyMap.get('IT')!;
  const csFaculty = facultyMap.get('CS')!;
  const mathFaculty = facultyMap.get('MATH')!;
  const engFaculty = facultyMap.get('ENG')!;

  const periods = [
    { num: 1, start: '09:00 AM', end: '09:55 AM' },
    { num: 2, start: '09:55 AM', end: '10:50 AM' },
    { num: 3, start: '11:10 AM', end: '12:05 PM' },
    { num: 4, start: '01:00 PM', end: '01:55 PM' },
    { num: 5, start: '01:55 PM', end: '02:50 PM' },
  ];

  for (let day = 1; day <= 5; day++) {
    for (const p of periods) {
      const timetableId = uuidv4();
      const subj = p.num === 1 || p.num === 4 ? itFaculty : p.num === 2 ? csFaculty : p.num === 3 ? mathFaculty : engFaculty;
      dbRun(
        `INSERT INTO timetables (id, college_id, department_id, year, section, day_of_week, period_number, start_time, end_time, subject_id, faculty_id, room_number)
         VALUES (?, ?, ?, 'III Year', 'Section A', ?, ?, ?, ?, ?, ?, ?)`,
        [timetableId, collegeId, itDeptId, day, p.num, p.start, p.end, subj.subjectId, subj.userId, `IT-Lab ${p.num + 101}`]
      );
    }
  }

  // 8. Seed Realistic Attendance Records (Past 14 days)
  const sampleDates = [
    '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
    '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21',
    '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27',
  ];

  for (const date of sampleDates) {
    // IT Subject attendance
    // Dharshan has ~88% attendance (Good)
    // Ananya has ~71% attendance (Warning)
    // Karthik has ~57% attendance (Critical)
    const statuses = [
      { studentId: itStudentIds[0], status: Math.random() > 0.12 ? 'PRESENT' : 'ABSENT' },
      { studentId: itStudentIds[1], status: Math.random() > 0.28 ? 'PRESENT' : 'ABSENT' },
      { studentId: itStudentIds[2], status: Math.random() > 0.45 ? 'PRESENT' : 'ABSENT' },
    ];

    for (const st of statuses) {
      dbRun(
        `INSERT INTO attendance_records (id, college_id, department_id, subject_id, faculty_id, student_id, date, period_number, status, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 'Regular lecture session', datetime('now'))`,
        [uuidv4(), collegeId, itDeptId, itFaculty.subjectId, itFaculty.userId, st.studentId, date, st.status]
      );
    }
  }

  // 9. Seed Smart Classroom Posts (PPT, PDF, Notes, Assignments)
  const classroomPosts = [
    {
      title: 'Module 1: Modern Full-Stack Architectures & React 19 State Management',
      type: 'PPT',
      desc: 'Complete slide deck covering React hooks, Concurrent Rendering, Server Actions, and client-side optimization patterns for Web Technology.',
      fileUrl: '/uploads/demo-react-architecture.pdf',
      fileName: 'React19_FullStack_Architecture.pdf',
    },
    {
      title: 'Assignment #2: Distributed Database Normalization & Sharding Schema',
      type: 'ASSIGNMENT',
      desc: 'Design a 3NF relational schema with BCNF verification for an e-commerce high-throughput transactional subsystem. Submit by Friday 5:00 PM.',
      fileUrl: '/uploads/assignment-2-database-spec.pdf',
      fileName: 'Assignment2_Database_Design.pdf',
      due: '2026-09-05 17:00:00',
    },
    {
      title: 'Lecture Notes: RESTful API Security, JWT Authentication & CORS Policies',
      type: 'NOTES',
      desc: 'Comprehensive lecture handouts with code snippets on securing Node.js endpoints with Bearer token authentication and role-based guards.',
      fileUrl: '/uploads/lecture-notes-jwt-security.pdf',
      fileName: 'Handout_WebSec_JWT_CORS.pdf',
    },
    {
      title: 'Video Lecture: Asynchronous Event Loops and Microtask Queues in JavaScript',
      type: 'VIDEO_LINK',
      desc: 'In-depth visual walkthrough of the V8 JavaScript execution model, call stack, libuv event loop, and macro/microtask prioritization.',
      fileUrl: null,
      fileName: null,
      extUrl: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ',
    },
    {
      title: 'Department Notice: Internal Assessment-1 Schedule & Syllabi Blueprint',
      type: 'ANNOUNCEMENT',
      desc: 'IA-1 tests commence from next Monday across all B.Sc IT & CS classrooms. Syllabi covers Units 1 & 2.',
      fileUrl: null,
      fileName: null,
    },
  ];

  for (const post of classroomPosts) {
    const postId = uuidv4();
    dbRun(
      `INSERT INTO classroom_posts (id, college_id, department_id, subject_id, faculty_id, title, description, post_type, file_url, file_name, external_url, due_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [postId, collegeId, itDeptId, itFaculty.subjectId, itFaculty.userId, post.title, post.desc, post.type, post.fileUrl || null, post.fileName || null, (post as any).extUrl || null, post.due || null]
    );

    // Seed a demo comment
    dbRun(
      `INSERT INTO classroom_comments (id, post_id, user_id, comment_text, created_at)
       VALUES (?, ?, ?, 'Thank you Professor, the slide deck explains the concurrent rendering patterns very clearly!', datetime('now'))`,
      [uuidv4(), postId, itStudentIds[0]]
    );
  }

  // 10. Seed Online Assessments (1 Active Test + 1 Completed Test)
  const assessment1Id = uuidv4();
  dbRun(
    `INSERT INTO assessments (id, college_id, department_id, subject_id, faculty_id, title, instructions, duration_minutes, start_date, end_date, total_marks, is_published, created_at)
     VALUES (?, ?, ?, ?, ?, 'Web Technology & API Design - Mid-Term Quiz', 'Answer all 10 multiple choice questions within 15 minutes. Each correct answer carries 1 mark. Negative marking is not applicable.', 15, datetime('now', '-1 day'), datetime('now', '+7 days'), 10, 1, datetime('now'))`,
    [assessment1Id, collegeId, itDeptId, itFaculty.subjectId, itFaculty.userId]
  );

  const quizQuestions = [
    { q: 'Which HTTP method is idempotent and designed to replace a target resource entirely?', a: 'POST', b: 'PUT', c: 'PATCH', d: 'DELETE', correct: 'B', exp: 'PUT replaces the entire target resource with the uploaded payload idempotently.' },
    { q: 'In React, what hook is used to persist mutable values across renders without triggering a re-render?', a: 'useState', b: 'useMemo', c: 'useRef', d: 'useCallback', correct: 'C', exp: 'useRef returns a mutable object whose .current property persists without triggering re-render.' },
    { q: 'What does the CORS header Access-Control-Allow-Origin control?', a: 'Allowed database users', b: 'Which origins are permitted to access resources via browser XHR/fetch', c: 'The maximum payload size', d: 'The encryption cipher suite', correct: 'B', exp: 'It dictates which origin domains are authorized to read cross-origin response payloads.' },
    { q: 'Which SQL normal form eliminates multi-valued dependencies?', a: '1NF', b: '2NF', b2: '3NF', c: '4NF', d: '5NF', correct: 'C', exp: 'Fourth Normal Form (4NF) specifically eliminates multi-valued dependencies.' },
    { q: 'What is the default port used by HTTP protocol?', a: '21', b: '80', c: '443', d: '8080', correct: 'B', exp: 'Port 80 is the standard port for unencrypted HTTP traffic.' },
    { q: 'Which status code indicates a successful resource creation in REST APIs?', a: '200 OK', b: '201 Created', c: '204 No Content', d: '304 Not Modified', correct: 'B', exp: '201 Created signifies that the request succeeded and resulted in a new resource.' },
    { q: 'What is the primary benefit of Database Indexing?', a: 'Compresses image storage', b: 'Dramatically speeds up SELECT query lookup times', c: 'Prevents SQL syntax errors', d: 'Enforces SSL connection', correct: 'B', exp: 'Indexes provide quick logarithmic access paths to data rows.' },
    { q: 'In JavaScript event loops, which queue holds Promise.then() callbacks?', a: 'Macrotask Queue', b: 'Microtask Queue', c: 'Render Queue', d: 'I/O Polling Pool', correct: 'B', exp: 'Promise callbacks and process.nextTick execute in the high-priority Microtask Queue.' },
    { q: 'Which CSS property enables flexbox container behavior?', a: 'display: flex', b: 'flex: 1', c: 'position: relative', d: 'align-items: center', correct: 'A', exp: 'display: flex establishes a block flex formatting context.' },
    { q: 'What ensures that a database transaction is completed entirely or rolled back on failure?', a: 'Isolation', b: 'Durability', c: 'Atomicity', d: 'Consistency', correct: 'C', exp: 'Atomicity enforces all-or-nothing execution.' },
  ];

  for (let i = 0; i < quizQuestions.length; i++) {
    const qq = quizQuestions[i];
    dbRun(
      `INSERT INTO assessment_questions (id, assessment_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, marks, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [uuidv4(), assessment1Id, i + 1, qq.q, qq.a, qq.b, qq.c, qq.d, qq.correct, qq.exp]
    );
  }

  // Pre-submit assessment for 1 student (Ananya) so results & analytics show live data
  const sampleAnswers = JSON.stringify({ 1: 'B', 2: 'C', 3: 'B', 4: 'C', 5: 'B', 6: 'B', 7: 'B', 8: 'B', 9: 'A', 10: 'C' });
  dbRun(
    `INSERT INTO assessment_submissions (id, assessment_id, student_id, score, total_marks, percentage, answers_json, time_taken_seconds, submitted_at)
     VALUES (?, ?, ?, 10, 10, 100.0, ?, 480, datetime('now', '-2 hours'))`,
    [uuidv4(), assessment1Id, itStudentIds[1], sampleAnswers]
  );

  // 11. Seed Campus Events
  const eventsData = [
    {
      title: 'HackCampus 2026: 24-Hour AI & Web3 Hackathon',
      desc: 'Build groundbreaking generative AI and decentralized apps. Cash prizes worth ₹1,50,000 + Internship fast-tracks for top 3 teams. Food and mentorship provided.',
      category: 'Hackathon',
      venue: 'Main Auditorium & Computer Science Center',
      date: '2026-09-12',
      time: '09:00 AM onwards',
      organizer: 'Department of Information Technology & ACM Student Chapter',
      deptId: itDeptId,
      max: 120,
      deadline: '2026-09-10 23:59:59',
      poster: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=300&fit=crop',
    },
    {
      title: 'National Seminar on Quantum Computing & Quantum Cryptography',
      desc: 'Distinguished keynotes by scientists from ISRO and IIT Madras on Quantum Key Distribution, Shor algorithm, and future cryptographic standards.',
      category: 'Seminar',
      venue: 'Dr. APJ Abdul Kalam Mini Hall',
      date: '2026-09-18',
      time: '10:00 AM - 04:00 PM',
      organizer: 'Department of Physics & Electronics',
      deptId: deptMap.get('PHY'),
      max: 200,
      deadline: '2026-09-16 18:00:00',
      poster: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=300&fit=crop',
    },
    {
      title: 'FinTech 2026: Corporate Accounting, Blockchain & Algorithmic Trading',
      desc: 'Interactive workshop on algorithmic trading, modern financial modeling in Python, and GST automation tools for commerce students.',
      category: 'Workshop',
      venue: 'Commerce Seminar Hall',
      date: '2026-09-22',
      time: '02:00 PM - 05:00 PM',
      organizer: 'Department of Commerce',
      deptId: deptMap.get('COMM'),
      max: 150,
      deadline: '2026-09-20 18:00:00',
      poster: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=300&fit=crop',
    },
    {
      title: 'Vibrance 2026 — Annual Inter-Collegiate Cultural Extravaganza',
      desc: 'Music bands, Classical & Western Dance, Theatrics, Street Plays, Photography contests, and Celebrity Guest performance.',
      category: 'Cultural Event',
      venue: 'Open Air Stadium',
      date: '2026-10-02',
      time: '04:00 PM - 10:00 PM',
      organizer: 'College Fine Arts Association',
      deptId: null,
      max: 1000,
      deadline: '2026-09-28 23:59:59',
      poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=300&fit=crop',
    },
  ];

  for (const ev of eventsData) {
    const eventId = uuidv4();
    dbRun(
      `INSERT INTO events (id, college_id, title, description, category, venue, event_date, event_time, organizer, department_id, poster_url, max_participants, registration_deadline, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [eventId, collegeId, ev.title, ev.desc, ev.category, ev.venue, ev.date, ev.time, ev.organizer, ev.deptId || null, ev.poster, ev.max, ev.deadline, adminId]
    );

    // Register 1 student for HackCampus
    if (ev.category === 'Hackathon') {
      dbRun(
        `INSERT INTO event_registrations (id, event_id, student_id, status, registered_at)
         VALUES (?, ?, ?, 'REGISTERED', datetime('now', '-1 day'))`,
        [uuidv4(), eventId, itStudentIds[0]]
      );
    }
  }

  // 12. Seed Campus Care Guidance Tickets
  const guidanceId = uuidv4();
  dbRun(
    `INSERT INTO guidance_requests (id, college_id, student_id, counselor_id, category, subject, description, preferred_time, status, resolution_notes, created_at)
     VALUES (?, ?, ?, ?, 'Study planning', 'Guidance on balancing Placement Preparation with Semester Project', 'I would appreciate advice on time management strategies to prepare for Technical DSA rounds while completing our full-stack project.', 'Friday 3:00 PM', 'IN_PROGRESS', 'Assigned session scheduled on Friday at 3:00 PM in IT Department Cabin 4.', datetime('now', '-1 day'))`,
    [guidanceId, collegeId, itStudentIds[0], itFaculty.userId]
  );

  // 13. Seed Direct Messages
  dbRun(
    `INSERT INTO messages (id, college_id, sender_id, receiver_id, message_text, is_read, created_at)
     VALUES (?, ?, ?, ?, 'Hello Dharshan, please review the Module 1 PPT uploaded to Smart Classroom for your upcoming quiz.', 1, datetime('now', '-3 hours'))`,
    [uuidv4(), collegeId, itFaculty.userId, itStudentIds[0]]
  );

  dbRun(
    `INSERT INTO messages (id, college_id, sender_id, receiver_id, message_text, is_read, created_at)
     VALUES (?, ?, ?, ?, 'Thank you sir, I have reviewed the slides and will complete the quiz today!', 1, datetime('now', '-2 hours'))`,
    [uuidv4(), collegeId, itStudentIds[0], itFaculty.userId]
  );

  // 14. Seed Campus Pulse public updates
  const pulseItems = [
    { title: 'HackCampus 2026 Registration Open', content: 'Registrations are now live for the 24-Hour AI Hackathon. Top prize ₹1,50,000.', cat: 'Events', icon: 'Trophy', author: 'IT Dept' },
    { title: 'New Learning Material Published', content: 'Module 1 slides on React 19 & Full-Stack Architecture uploaded for III B.Sc IT.', cat: 'Classroom', icon: 'BookOpen', author: 'Prof. Rajesh Kumar' },
    { title: 'Mid-Term Online Assessment Active', content: 'Web Technology Mid-Term Quiz (10 MCQs) is now active on the portal.', cat: 'Assessment', icon: 'CheckCircle', author: 'Prof. Rajesh Kumar' },
    { title: 'College Campus Care Center Activated', content: 'Students can now book confidential academic & career guidance sessions online.', cat: 'Campus Care', icon: 'HeartHandshake', author: 'Principal Office' },
  ];

  for (const pi of pulseItems) {
    dbRun(
      `INSERT INTO campus_pulse (id, college_id, title, content, category, icon, author_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [uuidv4(), collegeId, pi.title, pi.content, pi.cat, pi.icon, pi.author]
    );
  }

  // 15. Activity Log
  dbRun(
    `INSERT INTO activity_logs (id, college_id, user_id, user_name, role, action_type, description, created_at)
     VALUES (?, ?, ?, 'Dr. S. K. Ramanathan', 'ADMIN', 'SYSTEM_INITIALIZATION', 'CampusNexus AI college operating system initialized with 6 academic departments.', datetime('now'))`,
    [uuidv4(), collegeId, adminId]
  );

  console.log('✅ Database seeded successfully with demo college, departments, faculty, students, timetable, quizzes, and events!');
}

if (require.main === module) {
  seedDatabase().catch(console.error);
}
