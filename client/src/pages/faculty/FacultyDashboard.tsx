import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  CalendarCheck,
  FileText,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface FacultyDashboardProps {
  onNavigate: (path: string) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/faculty/overview')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Loading Classroom Snapshot...</p>
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-indigo-800/60">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <span>Department of {data?.profile?.department_name || 'Academic Studies'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.full_name}
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200">
            {data?.profile?.designation || 'Faculty Professor'} • Manage daily classes, student attendance, study materials, and tests.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('/faculty/attendance')}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => onNavigate('/ai')}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-md"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Generate 10 MCQs (AI)</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Handled Subjects"
          value={m.totalSubjects}
          subtitle="Assigned curriculum"
          icon={BookOpen}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          onClick={() => onNavigate('/faculty/subjects')}
        />

        <StatCard
          title="Department Students"
          value={m.totalStudents}
          subtitle="Enrolled under department"
          icon={Users}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          onClick={() => onNavigate('/faculty/students')}
        />

        <StatCard
          title="Active Tests"
          value={m.activeTests}
          subtitle="Ongoing assessments"
          icon={FileText}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          onClick={() => onNavigate('/assessments')}
        />

        <StatCard
          title="Today's Lectures"
          value={m.todayClassesCount}
          subtitle="Scheduled periods"
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          onClick={() => onNavigate('/faculty/timetable')}
        />
      </div>

      {/* Two Column Layout: Today's Schedule & My Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Lectures */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Lecture Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">Assigned periods and classrooms for today</p>
            </div>
            <button
              onClick={() => onNavigate('/faculty/timetable')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
            >
              Full Week
            </button>
          </div>

          {data?.todayClasses?.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No scheduled lectures assigned for today. Enjoy your research & prep time!
            </div>
          ) : (
            <div className="space-y-3">
              {data?.todayClasses?.map((cls: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex flex-col items-center justify-center font-extrabold text-xs">
                      <span>P{cls.period_number}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{cls.subject_name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {cls.year} ({cls.section}) • Room: {cls.room_number || 'Main Lab'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      {cls.start_time} - {cls.end_time}
                    </span>
                    <button
                      onClick={() => onNavigate(`/faculty/attendance?subjectCode=${cls.subject_code}&period=${cls.period_number}`)}
                      className="block text-[11px] text-emerald-600 hover:text-emerald-700 font-bold mt-1.5"
                    >
                      Mark Attendance →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Classroom Hub */}
        <div className="glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Smart Classroom Hub</h3>
            <p className="text-xs text-slate-500 mt-0.5">Upload learning resources & assignments</p>

            <div className="mt-4 space-y-2.5">
              <button
                onClick={() => onNavigate('/classroom')}
                className="w-full p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl text-left text-xs transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800">Publish PPT / Notes</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('/assessments')}
                className="w-full p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl text-left text-xs transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-slate-800">Create Online Test</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Recent Submissions Feed */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-2">Recent Student Submissions</h4>
            <div className="space-y-2">
              {data?.recentSubmissions?.length === 0 ? (
                <p className="text-[11px] text-slate-400">No test submissions yet.</p>
              ) : (
                data?.recentSubmissions?.map((sub: any) => (
                  <div key={sub.id} className="p-2 bg-slate-50 rounded-xl text-[11px] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{sub.student_name}</p>
                      <p className="text-slate-400">{sub.assessment_title}</p>
                    </div>
                    <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {sub.score}/{sub.total_marks} ({sub.percentage}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
