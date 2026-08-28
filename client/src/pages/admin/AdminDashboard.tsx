import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Building,
  UserCheck,
  CalendarCheck,
  Calendar,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import api from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/admin/overview');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching admin overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleQuickApprove = async (userId: string) => {
    try {
      await api.post('/admin/approve-user', { userId });
      fetchOverview();
    } catch (err) {
      console.error('Error approving user:', err);
    }
  };

  const handleQuickReject = async (userId: string) => {
    try {
      await api.post('/admin/reject-user', { userId, reason: 'Rejected from overview widget' });
      fetchOverview();
    } catch (err) {
      console.error('Error rejecting user:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Loading College Intelligence Dashboard...</p>
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Top Banner with AI trigger */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-800">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Campus Control Center Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">College Operating Overview</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Real-time multi-tenant command center for student admissions, faculty workflows, attendance thresholds, and campus events.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/ai')}
          className="relative z-10 flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl text-xs shadow-lg transition-all transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>Ask CampusNexus AI</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active Students"
          value={m.totalStudents}
          subtitle="Enrolled & verified"
          icon={GraduationCap}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          onClick={() => onNavigate('/admin/students')}
        />

        <StatCard
          title="Faculty Members"
          value={m.totalFaculty}
          subtitle="Teaching professors"
          icon={Users}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          onClick={() => onNavigate('/admin/faculty')}
        />

        <StatCard
          title="Pending Approvals"
          value={m.pendingFacultyApprovals + m.pendingStudentApprovals}
          subtitle={`${m.pendingFacultyApprovals} Faculty, ${m.pendingStudentApprovals} Students`}
          icon={UserCheck}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          onClick={() => onNavigate('/admin/approvals')}
        />

        <StatCard
          title="Today's Attendance"
          value={`${m.todayAttendanceRate}%`}
          subtitle="Campus-wide average"
          icon={CalendarCheck}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          onClick={() => onNavigate('/admin/attendance')}
        />
      </div>

      {/* Second Row: Department Distribution Chart & Pending Approvals Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Department Enrollment & Faculty Strength</h3>
              <p className="text-xs text-slate-500 mt-0.5">Distribution across active Arts & Science programs</p>
            </div>
            <button
              onClick={() => onNavigate('/admin/departments')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.departmentStats || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="department_code" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="student_count" name="Students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="faculty_count" name="Faculty" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Verification Requests Box */}
        <div className="glass-card p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Verification Hub</h3>
                {(m.pendingFacultyApprovals + m.pendingStudentApprovals) > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {m.pendingFacultyApprovals + m.pendingStudentApprovals} Pending
                  </span>
                )}
              </div>
              <button
                onClick={() => onNavigate('/admin/approvals')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {data?.pendingList?.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <p>All registration requests have been reviewed!</p>
                </div>
              ) : (
                data?.pendingList?.map((req: any) => (
                  <div
                    key={req.id}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-800">{req.full_name}</span>
                        <Badge variant={req.role === 'FACULTY' ? 'primary' : 'success'} size="sm">
                          {req.role}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {req.department_name} • {req.role === 'FACULTY' ? req.designation : `Roll: ${req.roll_number}`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleQuickApprove(req.id)}
                        className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleQuickReject(req.id)}
                        className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('/admin/approvals')}
            className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors text-center"
          >
            Open Approvals Manager
          </button>
        </div>
      </div>

      {/* Third Row: System Activity Audit Stream & Quick Jump Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Activity Stream */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Campus Activity Logs</h3>
              <p className="text-xs text-slate-500 mt-0.5">Immutable audit trail of administrative and academic events</p>
            </div>
            <button
              onClick={() => onNavigate('/admin/activity-logs')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
            >
              Full Audit Trail
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recentActivities?.slice(0, 5).map((log: any) => (
              <div key={log.id} className="py-3 flex items-start justify-between text-xs">
                <div className="flex items-start space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">{log.description}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      By {log.user_name || 'System'} ({log.role || 'ADMIN'}) • {log.action_type}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap ml-4">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Config Links */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-slate-900">Policy & System Settings</h3>

          <div
            onClick={() => onNavigate('/admin/settings')}
            className="p-3.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 rounded-2xl cursor-pointer transition-colors"
          >
            <p className="text-xs font-bold text-slate-900">Attendance Policy Thresholds</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Configure 75% good standing & 70% warning rules</p>
          </div>

          <div
            onClick={() => onNavigate('/admin/reports')}
            className="p-3.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 rounded-2xl cursor-pointer transition-colors"
          >
            <p className="text-xs font-bold text-slate-900">Export Academic Reports</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Download CSV & print student rosters and scores</p>
          </div>

          <div
            onClick={() => onNavigate('/events')}
            className="p-3.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 rounded-2xl cursor-pointer transition-colors"
          >
            <p className="text-xs font-bold text-slate-900">Create Campus Event</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Publish hackathons, seminars, and symposiums</p>
          </div>
        </div>
      </div>
    </div>
  );
};
