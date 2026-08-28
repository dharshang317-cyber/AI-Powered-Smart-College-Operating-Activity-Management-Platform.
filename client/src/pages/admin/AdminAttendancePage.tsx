import React, { useState, useEffect } from 'react';
import { CalendarCheck, AlertTriangle, ShieldAlert, CheckCircle2, Building, Mail, Phone } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';
import { StatCard } from '../../components/StatCard';

export const AdminAttendancePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance/summary')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <CalendarCheck className="w-6 h-6 text-rose-600" />
          <span>College Attendance Intelligence Hub</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Monitor campus-wide attendance compliance, department averages, and identify students requiring academic advisory.
        </p>
      </div>

      {/* Department Attendance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.departmentsAttendance?.map((dept: any) => {
          const pct = dept.department_avg_percentage || 85.0;
          const isGood = pct >= 75.0;
          const isWarning = pct >= 70.0 && pct < 75.0;

          return (
            <div key={dept.department_id} className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{dept.department_name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{dept.enrolled_students} Enrolled Students</p>
                </div>
                <Badge variant={isGood ? 'success' : isWarning ? 'warning' : 'danger'} size="sm" dot>
                  {pct}% Avg
                </Badge>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Total lecture entries recorded: <span className="font-bold text-slate-700">{dept.total_attendance_entries}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Critical Students Alert Section */}
      <div className="glass-card rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-900">Attendance Advisory & Warning List</h3>
          </div>
          <span className="text-xs text-slate-400">
            Students with attendance below 75% college policy guidelines
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Student Details</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Attended / Total</th>
                <th className="px-6 py-3.5">Attendance %</th>
                <th className="px-6 py-3.5">Advisory Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading student attendance data...</td>
                </tr>
              ) : data?.criticalStudents?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-emerald-600 font-bold">
                    ✨ Excellent! All students are currently maintaining attendance above the warning threshold.
                  </td>
                </tr>
              ) : (
                data?.criticalStudents?.map((st: any) => (
                  <tr key={st.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-900">{st.full_name}</p>
                      <p className="text-[11px] text-slate-400">{st.email} • Roll: {st.roll_number}</p>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">
                      {st.department_name} ({st.year})
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {st.attended_classes} of {st.total_classes} sessions
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-extrabold text-rose-600 text-sm">{st.percentage}%</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant="danger" dot size="sm">
                        Critical Warning (&lt;70%)
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
