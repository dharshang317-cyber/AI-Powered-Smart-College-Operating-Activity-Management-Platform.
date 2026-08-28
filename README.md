# CampusNexus AI — Smart College Operating & Activity Management Platform

> **One Campus. One Platform. Every Activity Connected.**

CampusNexus AI is a production-grade, real-time web platform tailored for Arts & Science Colleges. It seamlessly integrates College ERP operations, Google Classroom-style learning resource distribution, period-wise academic attendance tracking with configurable threshold alerts, timed MCQ assessments with instant auto-grading, campus event registrations, confidential student wellbeing care, and role-aware conversational AI copilots.

---

## 🏛️ Architecture & Core Hierarchy

The platform strictly enforces the institutional hierarchy:
```
College Workspace
  └── 1 Primary Administrator (Master Workspace Owner)
        ├── Departments (Arts & Science Curriculum)
        │     ├── Faculty Members (Academic Mentors & Instructors)
        │     └── Students (Class & Section Enrolled)
```

- **1 College = 1 Primary Administrator**: Only one verified administrator can register and oversee a college workspace.
- **Admin Approval Gate**: Faculty and Students self-register and are placed in `PENDING` verification status until approved by the Administrator.
- **Multi-Tenant Isolation**: All database records, attendance records, classrooms, tests, and messages are isolated by `college_id`.

---

## 🚀 Key Features

### 1. 🛡️ Administrator Workspace & Command Center
- **Executive Dashboard**: Live enrollment counters, Recharts department distribution charts, pending approval hub, and recent activity logs.
- **Verification Manager**: 1-click Approve / Reject for faculty and student applicants with real-time WebSocket notifications.
- **Student & Faculty Directory**: Searchable, filterable directory by department, roll number, and course.
- **Department & Subject Matrix**: Create departments, add subjects, and link assigned faculty.
- **College Policy Settings**: Configurable attendance thresholds (Default: 75.0% Good Standing, 70.0% Warning), Academic Year/Semester switches, and AI Copilot toggles.
- **Audit Logs & Export**: Full immutable audit trail and 1-click CSV reports for student rosters, faculty directories, and assessment records.

### 2. 👨‍🏫 Faculty Portal ("My Classroom Snapshot")
- **Classroom Snapshot**: Daily lecture schedule, handled subjects, total enrolled students, and recent submissions.
- **Interactive Attendance Marker**: Select subject, date, and period (1-5) to mark students as `PRESENT`, `ABSENT`, or `ON_DUTY` with automatic percentage updates.
- **Smart Classroom**: Upload PPT slide decks, PDF syllabus notes, assignment briefs, and video links with student discussion comments.
- **Assessment Engine & 1-Click AI Quiz Generator**: Create timed MCQ quizzes manually or enter any topic to let the AI auto-generate 10 MCQs with answer keys and rationale!
- **Assessment Analytics**: Average score, highest score, pass percentage, and student marks roster.

### 3. 🎓 Student Portal ("My Campus Snapshot")
- **Campus Snapshot**: Live Attendance Health Gauge with policy threshold comparisons, today's lecture schedule, pending tests, and recent materials.
- **Academic Attendance Hub**: Subject-wise attended/conducted counts, live percentages, and color-coded policy badges (*Good Standing*, *Attendance Warning*, *Critical Attendance — Potentially Not Eligible based on College Attendance Policy*).
- **Weekly Timetable Matrix**: Interactive daily and weekly timetable with room numbers and faculty names.
- **Timed Online Test Room**: Live countdown timer, question navigation matrix, radio choice selection, instant automatic evaluation on submit, question rationale review, and celebration confetti.
- **Campus Events**: Explore hackathons, workshops, and symposia with **1-Click Registration** and capacity tracking.

### 4. 💬 Communication, Campus Care & Pulse
- **Direct Advising Messages**: Department-restricted 1-on-1 real-time messaging between students and approved faculty.
- **Campus Care Hub**: Confidential student wellbeing ticket system for study planning, exam stress, and career guidance.
- **Campus Pulse**: Live broadcast stream for campus-wide milestones, announcements, and achievements.

### 5. 🤖 CampusNexus AI Copilot
- **Student Copilot**: Explains complex concepts, queries your personalized timetable, checks attendance standing, and lists pending tests.
- **Faculty Copilot**: Generates 10-question MCQ tests in 1 click, analyzes student attendance trends, and drafts lesson plans.
- **Administrator Copilot**: Summarizes weekly campus metrics, detects attendance anomalies, and delivers executive summaries.

---

## 🔑 Demo Credentials

A fully populated Arts & Science College demo workspace (**CampusNexus Demo Arts & Science College**, Code: `DEMO-ASC-001`) is pre-seeded with 6 departments, 6 faculty members, and 18 students.

| Role | Email | Password | Details |
|---|---|---|---|
| **Administrator** | `admin@campusnexus.edu` | `Admin@123` | Master College Administrator |
| **Faculty (IT)** | `faculty.it@campusnexus.edu` | `Demo@1234` | Prof. Rajesh Kumar (Dept of IT) |
| **Faculty (CS)** | `faculty.cs@campusnexus.edu` | `Demo@1234` | Dr. Priya Sundaram (Dept of CS) |
| **Student (Good 88%)** | `dharshan.it@campusnexus.edu` | `Demo@1234` | Dharshan G (B.Sc IT - Roll: 26IT101) |
| **Student (Warning 71%)**| `ananya.it@campusnexus.edu` | `Demo@1234` | Ananya S (B.Sc IT - Roll: 26IT102) |
| **Student (Critical 57%)**| `karthik.it@campusnexus.edu` | `Demo@1234` | Karthik R (B.Sc IT - Roll: 26IT103) |

> 💡 **Tip:** The landing page features a **1-Click Demo Login Bar** allowing instant login with any of these pre-configured accounts without manual typing!

---

## 🛠️ Installation & Running Locally

### Prerequisites
- Node.js (v18 or newer)
- npm

### 1. Quick Start (Concurrently)
From the project root:
```bash
# Run both Backend (Port 5000) and Frontend (Port 5173) concurrently
npm start
```

### 2. Manual Start
**Backend:**
```bash
cd server
npm install
npm start
```
*Backend runs on `http://localhost:5000`.*

**Frontend:**
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### 3. Run Acceptance Test Suite
```bash
cd server
npx tsx test-all-flows.ts
```

---

## 📊 Database Engine & WebAssembly SQLite
The database uses `sql.js` (WebAssembly SQLite) which runs natively without any native C++ build toolchain requirements on Windows/macOS/Linux, and automatically persists its database state to `server/data/campusnexus.sqlite`.

---

## 📄 License
Academic & Enterprise College Operating System — CampusNexus AI.
