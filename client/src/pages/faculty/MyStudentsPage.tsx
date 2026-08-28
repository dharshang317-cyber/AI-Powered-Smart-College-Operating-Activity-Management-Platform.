import React, { useState, useEffect } from 'react';
import { GraduationCap, Search, MessageSquare, Mail, Phone, CalendarCheck } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';
import { AttendanceGauge } from '../../components/AttendanceGauge';

interface MyStudentsPageProps {
  onNavigate: (path: string) => void;
}

export const MyStudentsPage: React.FC<MyStudentsPageProps> = ({ onNavigate }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get(`/faculty/my-students?search=${encodeURIComponent(search)}`)
      .then((res) => setStudents(res.data.students || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-emerald-600" />
            <span>My Department Students Roster</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enrolled students connected to your department with live attendance tracking and direct messaging.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name or roll number..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Student List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">Loading department students...</div>
        ) : students.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">No matching students found.</div>
        ) : (
          students.map((st) => {
            const att = st.overall_attendance_percentage !== null ? Number(st.overall_attendance_percentage) : 100.0;
            return (
              <div
                key={st.id}
                className="glass-card p-5 rounded-3xl flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={st.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                        alt={st.full_name}
                        className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200 shadow-sm"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">{st.full_name}</h4>
                        <p className="text-[11px] font-extrabold text-indigo-600 mt-0.5">Roll: {st.roll_number}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <p className="text-slate-500">
                      {st.course} • {st.year} ({st.section})
                    </p>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Overall Attendance</span>
                      <AttendanceGauge percentage={att} compact />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onNavigate(`/messages?contactId=${st.id}`)}
                    className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>
                  <a
                    href={`mailto:${st.email}`}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                    title={st.email}
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
