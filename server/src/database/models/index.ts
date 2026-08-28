import mongoose, { Schema, Document } from 'mongoose';

// -------------------------------------------------------------
// 1. College Schema
// -------------------------------------------------------------
export interface ICollege extends Document {
  college_id: string;
  name: string;
  code: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  college_type?: string;
  logo_url?: string;
  created_at: Date;
}

const CollegeSchema = new Schema<ICollege>({
  college_id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  phone: String,
  website: String,
  address: String,
  college_type: String,
  logo_url: String,
  created_at: { type: Date, default: Date.now },
});

export const CollegeModel = mongoose.model<ICollege>('College', CollegeSchema);

// -------------------------------------------------------------
// 2. User Schema (ADMIN, FACULTY, STUDENT, CARE_CLUB)
// -------------------------------------------------------------
export interface IUser extends Document {
  user_id: string;
  college_id: string;
  role: 'ADMIN' | 'FACULTY' | 'STUDENT' | 'CARE_CLUB';
  full_name: string;
  email: string;
  phone?: string;
  password_hash: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  is_primary_admin: number;
  avatar_url?: string;
  created_at: Date;
}

const UserSchema = new Schema<IUser>({
  user_id: { type: String, required: true, unique: true, index: true },
  college_id: { type: String, required: true, index: true },
  role: { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT', 'CARE_CLUB'], required: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  phone: String,
  password_hash: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'], default: 'PENDING' },
  is_primary_admin: { type: Number, default: 0 },
  avatar_url: String,
  created_at: { type: Date, default: Date.now },
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);

// -------------------------------------------------------------
// 3. Department Schema
// -------------------------------------------------------------
export interface IDepartment extends Document {
  department_id: string;
  college_id: string;
  name: string;
  code: string;
  hod_name?: string;
  description?: string;
  is_active: number;
  created_at: Date;
}

const DepartmentSchema = new Schema<IDepartment>({
  department_id: { type: String, required: true, unique: true, index: true },
  college_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  hod_name: String,
  description: String,
  is_active: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now },
});

export const DepartmentModel = mongoose.model<IDepartment>('Department', DepartmentSchema);

// -------------------------------------------------------------
// 4. Subject Schema
// -------------------------------------------------------------
export interface ISubject extends Document {
  subject_id: string;
  college_id: string;
  department_id: string;
  name: string;
  code: string;
  semester?: string;
  faculty_id?: string;
  created_at: Date;
}

const SubjectSchema = new Schema<ISubject>({
  subject_id: { type: String, required: true, unique: true, index: true },
  college_id: { type: String, required: true, index: true },
  department_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  semester: String,
  faculty_id: String,
  created_at: { type: Date, default: Date.now },
});

export const SubjectModel = mongoose.model<ISubject>('Subject', SubjectSchema);

// -------------------------------------------------------------
// 5. Profiles: Student, Faculty, Care Club
// -------------------------------------------------------------
export const StudentProfileModel = mongoose.model('StudentProfile', new Schema({
  user_id: { type: String, required: true, unique: true, index: true },
  department_id: { type: String, required: true, index: true },
  course: String,
  year: String,
  section: String,
  roll_number: String,
  academic_identifier: String,
}));

export const FacultyProfileModel = mongoose.model('FacultyProfile', new Schema({
  user_id: { type: String, required: true, unique: true, index: true },
  department_id: { type: String, required: true, index: true },
  designation: String,
  qualification: String,
  specialization: String,
  is_guidance_counselor: { type: Number, default: 0 },
}));

export const CareClubProfileModel = mongoose.model('CareClubProfile', new Schema({
  user_id: { type: String, required: true, unique: true, index: true },
  designation: String,
  qualification: String,
  specialization: String,
  bio: String,
  available_hours: String,
  anonymous_allowed: { type: Number, default: 1 },
}));

// -------------------------------------------------------------
// 6. Timetable Schema
// -------------------------------------------------------------
export const TimetableModel = mongoose.model('Timetable', new Schema({
  timetable_id: { type: String, required: true, unique: true, index: true },
  college_id: { type: String, required: true, index: true },
  department_id: { type: String, required: true, index: true },
  year: String,
  section: String,
  day_of_week: Number,
  period_number: Number,
  start_time: String,
  end_time: String,
  subject_id: String,
  faculty_id: String,
  room_number: String,
}));

// -------------------------------------------------------------
// 7. Attendance & Assessments
// -------------------------------------------------------------
export const AttendanceModel = mongoose.model('AttendanceRecord', new Schema({
  attendance_id: { type: String, required: true, unique: true, index: true },
  college_id: { type: String, required: true, index: true },
  subject_id: { type: String, required: true, index: true },
  student_id: { type: String, required: true, index: true },
  faculty_id: String,
  date: String,
  period_number: Number,
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'ON_DUTY'], default: 'PRESENT' },
  remarks: String,
  created_at: { type: Date, default: Date.now },
}));

export const AssessmentModel = mongoose.model('Assessment', new Schema({
  assessment_id: { type: String, required: true, unique: true, index: true },
  college_id: { type: String, required: true, index: true },
  department_id: { type: String, required: true, index: true },
  subject_id: { type: String, required: true, index: true },
  faculty_id: { type: String, required: true },
  title: { type: String, required: true },
  instructions: String,
  duration_minutes: { type: Number, default: 30 },
  total_marks: { type: Number, default: 100 },
  start_date: String,
  end_date: String,
  is_published: { type: Number, default: 0 },
  questions: Array,
  created_at: { type: Date, default: Date.now },
}));

export const AssessmentSubmissionModel = mongoose.model('AssessmentSubmission', new Schema({
  submission_id: { type: String, required: true, unique: true, index: true },
  assessment_id: { type: String, required: true, index: true },
  student_id: { type: String, required: true, index: true },
  score: Number,
  total_marks: Number,
  answers: Array,
  submitted_at: { type: Date, default: Date.now },
}));

// -------------------------------------------------------------
// 8. Communication & Guidance Requests
// -------------------------------------------------------------
export const MessageModel = mongoose.model('Message', new Schema({
  message_id: { type: String, required: true, unique: true, index: true },
  college_id: { type: String, required: true, index: true },
  sender_id: { type: String, required: true, index: true },
  receiver_id: { type: String, index: true },
  department_id: String,
  message_type: { type: String, enum: ['DIRECT', 'DEPARTMENT', 'CARE_CLUB'], default: 'DIRECT' },
  message_text: { type: String, required: true },
  is_anonymous: { type: Number, default: 0 },
  is_read: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
}));

export const GuidanceRequestModel = mongoose.model('GuidanceRequest', new Schema({
  request_id: { type: String, required: true, unique: true, index: true },
  college_id: { type: String, required: true, index: true },
  student_id: { type: String, required: true, index: true },
  counselor_id: String,
  category: String,
  subject: String,
  description: String,
  preferred_time: String,
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED'], default: 'PENDING' },
  resolution_notes: String,
  created_at: { type: Date, default: Date.now },
}));
