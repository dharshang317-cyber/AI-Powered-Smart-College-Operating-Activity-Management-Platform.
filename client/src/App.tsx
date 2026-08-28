import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PendingApprovalsPage } from './pages/admin/PendingApprovalsPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { DepartmentsPage } from './pages/admin/DepartmentsPage';
import { SubjectsPage } from './pages/admin/SubjectsPage';
import { AdminAttendancePage } from './pages/admin/AdminAttendancePage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminActivityLogsPage } from './pages/admin/AdminActivityLogsPage';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { MyStudentsPage } from './pages/faculty/MyStudentsPage';
import { MySubjectsPage } from './pages/faculty/MySubjectsPage';
import { AttendanceMarkerPage } from './pages/faculty/AttendanceMarkerPage';
import { FacultyTimetablePage } from './pages/faculty/FacultyTimetablePage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentTimetablePage } from './pages/student/StudentTimetablePage';
import { StudentAttendancePage } from './pages/student/StudentAttendancePage';

// Shared Academic Pages
import { SmartClassroomPage } from './pages/classroom/SmartClassroomPage';
import { AssessmentsPage } from './pages/assessments/AssessmentsPage';
import { AssessmentTestRoom } from './pages/assessments/AssessmentTestRoom';
import { AssessmentAnalyticsPage } from './pages/assessments/AssessmentAnalyticsPage';
import { CampusEventsPage } from './pages/events/CampusEventsPage';
import { MessagingHub } from './pages/communication/MessagingHub';
import { CampusCareClub } from './pages/communication/CampusCareClub';
import { CareClubDashboard } from './pages/careclub/CareClubDashboard';
import { CampusPulsePage } from './pages/pulse/CampusPulsePage';
import { CampusNexusAIPage } from './pages/ai/CampusNexusAIPage';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('/');

  // Synchronize route based on user role when logging in
  useEffect(() => {
    if (user) {
      if (currentPath === '/' || currentPath === '/login') {
        if (user.role === 'ADMIN') setCurrentPath('/admin');
        else if (user.role === 'FACULTY') setCurrentPath('/faculty');
        else if (user.role === 'CARE_CLUB') setCurrentPath('/care-club');
        else setCurrentPath('/student');
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30 animate-pulse">
          CN
        </div>
        <p className="text-sm font-semibold text-slate-400">Loading CampusNexus AI...</p>
      </div>
    );
  }

  // Not logged in -> Show professional Landing & Role Auth screen
  if (!user) {
    return <LandingPage />;
  }

  // Router dispatcher
  const renderPage = () => {
    // Dynamic Assessment Test Route: /assessments/take/:id
    if (currentPath.startsWith('/assessments/take/')) {
      const id = currentPath.replace('/assessments/take/', '');
      return <AssessmentTestRoom assessmentId={id} onBack={() => setCurrentPath('/assessments')} />;
    }

    // Dynamic Assessment Analytics Route: /assessments/analytics/:id
    if (currentPath.startsWith('/assessments/analytics/')) {
      const id = currentPath.replace('/assessments/analytics/', '');
      return <AssessmentAnalyticsPage assessmentId={id} onBack={() => setCurrentPath('/assessments')} />;
    }

    switch (currentPath) {
      // Admin Routes
      case '/admin':
        return <AdminDashboard onNavigate={setCurrentPath} />;
      case '/admin/approvals':
        return <PendingApprovalsPage />;
      case '/admin/students':
        return <UserManagementPage initialRole="STUDENT" />;
      case '/admin/faculty':
        return <UserManagementPage initialRole="FACULTY" />;
      case '/admin/departments':
        return <DepartmentsPage />;
      case '/admin/subjects':
        return <SubjectsPage />;
      case '/admin/attendance':
        return <AdminAttendancePage />;
      case '/admin/assessments':
        return <AssessmentsPage onNavigate={setCurrentPath} />;
      case '/admin/reports':
        return <AdminReportsPage />;
      case '/admin/settings':
        return <AdminSettingsPage />;
      case '/admin/activity-logs':
        return <AdminActivityLogsPage />;

      // Faculty Routes
      case '/faculty':
        return <FacultyDashboard onNavigate={setCurrentPath} />;
      case '/faculty/students':
        return <MyStudentsPage onNavigate={setCurrentPath} />;
      case '/faculty/subjects':
        return <MySubjectsPage onNavigate={setCurrentPath} />;
      case '/faculty/attendance':
        return <AttendanceMarkerPage />;
      case '/faculty/timetable':
        return <FacultyTimetablePage />;

      // Care Club Routes
      case '/care-club':
        return <CareClubDashboard onNavigate={setCurrentPath} />;

      // Student Routes
      case '/student':
        return <StudentDashboard onNavigate={setCurrentPath} />;
      case '/student/timetable':
        return <StudentTimetablePage />;
      case '/student/attendance':
        return <StudentAttendancePage />;

      // Shared Academic Modules
      case '/classroom':
        return <SmartClassroomPage />;
      case '/assessments':
        return <AssessmentsPage onNavigate={setCurrentPath} />;
      case '/events':
        return <CampusEventsPage />;
      case '/messages':
        return <MessagingHub />;
      case '/campus-care':
        return <CampusCareClub />;
      case '/pulse':
        return <CampusPulsePage />;
      case '/ai':
        return <CampusNexusAIPage />;

      default:
        return user.role === 'ADMIN' ? (
          <AdminDashboard onNavigate={setCurrentPath} />
        ) : user.role === 'FACULTY' ? (
          <FacultyDashboard onNavigate={setCurrentPath} />
        ) : user.role === 'CARE_CLUB' ? (
          <CareClubDashboard onNavigate={setCurrentPath} />
        ) : (
          <StudentDashboard onNavigate={setCurrentPath} />
        );
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={setCurrentPath}>
      {renderPage()}
    </Layout>
  );
};
