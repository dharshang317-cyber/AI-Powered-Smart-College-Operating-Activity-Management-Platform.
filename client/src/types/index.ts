export type Role = 'ADMIN' | 'FACULTY' | 'STUDENT' | 'CARE_CLUB';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface User {
  id: string;
  college_id: string;
  college_name?: string;
  college_code?: string;
  role: Role;
  full_name: string;
  email: string;
  phone: string;
  status: UserStatus;
  avatar_url?: string;
  is_primary_admin?: number;
  profile?: FacultyProfile | StudentProfile | CareClubProfile;
}

export interface FacultyProfile {
  user_id: string;
  department_id: string;
  department_name?: string;
  department_code?: string;
  designation: string;
  qualification?: string;
  specialization?: string;
  is_guidance_counselor?: number;
}

export interface CareClubProfile {
  user_id: string;
  designation: string;
  qualification?: string;
  specialization?: string;
  bio?: string;
  available_hours?: string;
  anonymous_allowed?: number;
}

export interface CareClubMember {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: Role;
  designation: string;
  qualification?: string;
  specialization?: string;
  bio?: string;
  available_hours?: string;
  department_name?: string;
  is_care_club?: number;
}

export interface StudentProfile {
  user_id: string;
  department_id: string;
  department_name?: string;
  department_code?: string;
  course: string;
  year: string;
  section: string;
  roll_number: string;
  academic_identifier?: string;
}

export interface College {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  college_type?: string;
  logo_url?: string;
}

export interface CollegeSettings {
  college_id: string;
  attendance_threshold_good: number;
  attendance_threshold_warning: number;
  academic_year: string;
  current_semester: string;
  allow_student_messaging: number;
  ai_enabled: number;
}

export interface Department {
  id: string;
  college_id: string;
  name: string;
  code: string;
  hod_name?: string;
  description?: string;
  is_active: number;
  student_count?: number;
  faculty_count?: number;
  subject_count?: number;
}

export interface Subject {
  id: string;
  college_id: string;
  department_id: string;
  department_name?: string;
  name: string;
  code: string;
  semester: string;
  faculty_id?: string;
  faculty_name?: string;
  enrolled_students?: number;
  materials_count?: number;
  tests_count?: number;
}

export interface TimetableSlot {
  id: string;
  college_id: string;
  department_id: string;
  year: string;
  section: string;
  day_of_week: number; // 1-6
  period_number: number; // 1-6
  start_time: string;
  end_time: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  faculty_id?: string;
  faculty_name?: string;
  room_number?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  period_number: number;
  status: 'PRESENT' | 'ABSENT' | 'ON_DUTY';
  notes?: string;
  subject_name?: string;
  subject_code?: string;
}

export interface SubjectAttendanceStat {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  faculty_name?: string;
  total_conducted: number;
  attended: number;
  absent_count: number;
  od_count: number;
  percentage: number;
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
}

export type PostType = 'PPT' | 'PDF' | 'NOTES' | 'ASSIGNMENT' | 'VIDEO_LINK' | 'ANNOUNCEMENT' | 'STUDY_MATERIAL' | 'REFERENCE_LINK';

export interface ClassroomPost {
  id: string;
  college_id: string;
  department_id: string;
  department_name?: string;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  faculty_id: string;
  faculty_name?: string;
  faculty_avatar?: string;
  title: string;
  description?: string;
  post_type: PostType;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  external_url?: string;
  due_date?: string;
  created_at: string;
  comment_count?: number;
}

export interface ClassroomComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_role: Role;
  avatar_url?: string;
  comment_text: string;
  created_at: string;
}

export interface AssessmentQuestion {
  id?: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option?: 'A' | 'B' | 'C' | 'D';
  marks: number;
  explanation?: string;
}

export interface Assessment {
  id: string;
  college_id: string;
  department_id: string;
  department_name?: string;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  faculty_id: string;
  faculty_name?: string;
  title: string;
  instructions?: string;
  duration_minutes: number;
  start_date: string;
  end_date: string;
  total_marks: number;
  is_published: number;
  question_count?: number;
  total_submissions?: number;
  isSubmitted?: boolean;
  submission?: {
    id: string;
    score: number;
    total_marks: number;
    percentage: number;
    submitted_at: string;
  } | null;
}

export interface AssessmentSubmission {
  id: string;
  assessment_id: string;
  student_id: string;
  student_name?: string;
  roll_number?: string;
  score: number;
  total_marks: number;
  percentage: number;
  answers_json?: string;
  time_taken_seconds?: number;
  submitted_at: string;
}

export type EventCategory = 'Workshop' | 'Seminar' | 'Symposium' | 'Cultural Event' | 'Sports' | 'Hackathon' | 'Coding Contest' | 'Club Activity' | 'Guest Lecture' | 'Placement Event' | 'Department Event';

export interface CampusEvent {
  id: string;
  college_id: string;
  title: string;
  description: string;
  category: EventCategory;
  venue: string;
  event_date: string;
  event_time: string;
  organizer: string;
  department_id?: string;
  department_name?: string;
  poster_url?: string;
  max_participants: number;
  registration_deadline: string;
  created_by: string;
  creator_name?: string;
  registration_count?: number;
  is_registered?: number;
}

export interface GuidanceRequest {
  id: string;
  college_id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  roll_number?: string;
  course?: string;
  year?: string;
  section?: string;
  department_name?: string;
  counselor_id?: string;
  counselor_name?: string;
  category: string;
  subject: string;
  description: string;
  preferred_time?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  college_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_url?: string;
  is_read: number;
  created_at: string;
}

export interface CampusPulseItem {
  id: string;
  college_id: string;
  title: string;
  content: string;
  category: string;
  icon?: string;
  author_name: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  college_id: string;
  user_id?: string;
  user_name?: string;
  role?: string;
  action_type: string;
  description: string;
  created_at: string;
}
