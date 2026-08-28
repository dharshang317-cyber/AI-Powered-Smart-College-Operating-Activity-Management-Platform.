import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CalendarCheck,
  Award,
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { AttendanceGauge } from '../../components/AttendanceGauge';

interface StudentDashboardProps {
  onNavigate: (path: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/student/overview')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Loading Student Campus Snapshot...</p>
      </div>
    );
  }

  const att = data?.attendanceSnapshot || {};
  const profile = data?.profile || {};

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <span>{profile.course || 'B.Sc IT'} • Roll: {profile.roll_number}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Hi, {user?.full_name?.split(' ')[0]} 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Department of {profile.department_name} • {profile.year} ({profile.section})
          </p>
        </div>

        <button
          onClick={() => onNavigate('/ai')}
          className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl text-xs shadow-lg transition-all transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>Ask Student AI Copilot</span>
        </button>
      </div>

      {/* Snapshot Top Grid: Attendance Health Card & Today's Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Health Gauge */}
        <div className="lg:col-span-1">
          <AttendanceGauge
            percentage={att.percentage || 0}
            goodThreshold={att.goodThreshold || 75.0}
            warningThreshold={att.warningThreshold || 70.0}
            totalSessions={att.totalClasses}
            attendedSessions={att.attendedClasses}
          />
        </div>

        {/* Today's Classes */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Class Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">Your timetable for today</p>
            </div>
            <button
              onClick={() => onNavigate('/student/timetable')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
            >
              Full Schedule →
            </button>
          </div>

          {data?.todayClasses?.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No classes scheduled for today. Enjoy your day!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data?.todayClasses?.map((cls: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      P{cls.period_number}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">{cls.subject_name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Room: {cls.room_number || 'Main Lab'} • {cls.faculty_name || 'Prof'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                    {cls.start_time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Second Row: Pending Assessments & New Study Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Assessments */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Pending Online Tests</h3>
                <p className="text-xs text-slate-500">Quizzes and internal tests due</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/assessments')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
            >
              All Tests
            </button>
          </div>

          {data?.pendingAssessments?.length === 0 ? (
            <div className="py-10 text-center text-xs text-emerald-600 font-bold flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>You're all caught up! No pending tests.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.pendingAssessments?.map((test: any) => (
                <div
                  key={test.id}
                  className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">{test.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {test.subject_name} • {test.duration_minutes} Mins • {test.total_marks} Marks
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate(`/assessments/take/${test.id}`)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Start Test →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Study Materials */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">New Learning Materials</h3>
                <p className="text-xs text-slate-500">Slide decks, handouts, and notes</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/classroom')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
            >
              Classroom
            </button>
          </div>

          <div className="space-y-3">
            {data?.recentMaterials?.slice(0, 3).map((mat: any) => (
              <div
                key={mat.id}
                onClick={() => onNavigate('/classroom')}
                className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs cursor-pointer hover:border-indigo-300 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                    {mat.post_type}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{mat.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {mat.subject_name} • By {mat.faculty_name}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Third Row: Upcoming Events */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Upcoming Campus Events & Hackathons</h3>
              <p className="text-xs text-slate-500">Workshops, symposia, and cultural events open for registration</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/events')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
          >
            All Events →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.upcomingEvents?.map((ev: any) => (
            <div
              key={ev.id}
              className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start justify-between space-x-3 text-xs"
            >
              <div className="space-y-1">
                <Badge variant="warning" size="sm">
                  {ev.category}
                </Badge>
                <h4 className="font-bold text-slate-900 text-sm">{ev.title}</h4>
                <p className="text-[11px] text-slate-500">
                  {ev.event_date} at {ev.event_time} • {ev.venue}
                </p>
              </div>

              {ev.is_registered ? (
                <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                  ✓ Registered
                </span>
              ) : (
                <button
                  onClick={() => onNavigate('/events')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
                >
                  Register
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
