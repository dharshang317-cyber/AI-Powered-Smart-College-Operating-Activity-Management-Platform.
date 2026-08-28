import React, { useState, useEffect } from 'react';
import { CalendarCheck, AlertTriangle, ShieldAlert, CheckCircle2, History, Info } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';
import { AttendanceGauge } from '../../components/AttendanceGauge';

export const StudentAttendancePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/student/attendance')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400 text-xs">Loading attendance statistics...</div>;
  }

  const subjectStats = data?.subjectStats || [];
  const history = data?.history || [];
  const thresholds = data?.thresholds || { good: 75.0, warning: 70.0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <CalendarCheck className="w-6 h-6 text-indigo-600" />
          <span>My Academic Attendance Hub</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Real-time subject-wise percentage calculations, policy threshold status, and past lecture log history.
        </p>
      </div>

      {/* Policy Notice Box */}
      <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 text-xs text-indigo-950 flex items-start space-x-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-bold">College Attendance Policy Guidelines</p>
          <p className="text-[11px] text-indigo-800 mt-0.5">
            Students are required to maintain a minimum of <strong>{thresholds.good}%</strong> attendance in every subject.
            Attendance between <strong>{thresholds.warning}% - {thresholds.good - 0.01}%</strong> triggers an administrative warning.
            Attendance below <strong>{thresholds.warning}%</strong> is marked as <em>"Potentially Not Eligible — Based on College Attendance Policy"</em>.
          </p>
        </div>
      </div>

      {/* Subject Wise Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjectStats.map((s: any) => {
          const isGood = s.percentage >= thresholds.good;
          const isWarning = s.percentage >= thresholds.warning && s.percentage < thresholds.good;
          const badgeVariant = isGood ? 'success' : isWarning ? 'warning' : 'danger';
          const barColor = isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500';

          return (
            <div
              key={s.subject_id}
              className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                      {s.subject_code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2 leading-tight">
                      {s.subject_name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{s.faculty_name || 'Assigned Faculty'}</p>
                  </div>
                  <Badge variant={badgeVariant} dot size="sm">
                    {s.percentage}%
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(s.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                    <span>{s.attended}/{s.total_conducted} attended</span>
                    <span>{s.absent_count} absent</span>
                    {s.od_count > 0 && <span>{s.od_count} OD</span>}
                  </div>
                </div>
              </div>

              {/* Status footer banner */}
              <div
                className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 ${
                  isGood
                    ? 'bg-emerald-50 text-emerald-800'
                    : isWarning
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-rose-50 text-rose-800'
                }`}
              >
                {isGood ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
                <span>
                  {isGood
                    ? 'Good Attendance'
                    : isWarning
                    ? 'Attendance Warning'
                    : 'Potentially Not Eligible (Policy Warning)'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance History Timeline Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xs space-y-3">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Lecture Attendance Logs</h3>
          </div>
          <span className="text-xs text-slate-400">Past 30 recorded sessions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Period</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No attendance history records found.</td>
                </tr>
              ) : (
                history.map((h: any) => (
                  <tr key={h.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-semibold text-slate-900">{h.date}</td>
                    <td className="px-6 py-3">Period {h.period_number}</td>
                    <td className="px-6 py-3">{h.subject_name} ({h.subject_code})</td>
                    <td className="px-6 py-3">
                      <Badge
                        variant={
                          h.status === 'PRESENT'
                            ? 'success'
                            : h.status === 'ON_DUTY'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                        dot
                      >
                        {h.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-slate-400 text-[11px]">{h.notes || 'Regular lecture'}</td>
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
