import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, XCircle, Clock, Save, UserCheck, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';

export const AttendanceMarkerPage: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodNumber, setPeriodNumber] = useState(1);
  const [roster, setRoster] = useState<any[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    api.get('/faculty/my-subjects')
      .then((res) => {
        const list = res.data.subjects || [];
        setSubjects(list);
        if (list.length > 0) {
          setSelectedSubjectId(list[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const fetchRoster = async () => {
    if (!selectedSubjectId) return;
    setIsLoadingRoster(true);
    setFeedback(null);
    try {
      const res = await api.get(`/attendance/class-roster?subjectId=${selectedSubjectId}&date=${date}&periodNumber=${periodNumber}`);
      setRoster(res.data.roster || []);
    } catch (err) {
      console.error('Error fetching roster:', err);
    } finally {
      setIsLoadingRoster(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [selectedSubjectId, date, periodNumber]);

  const handleStatusChange = (studentId: string, newStatus: 'PRESENT' | 'ABSENT' | 'ON_DUTY') => {
    setRoster((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT' | 'ON_DUTY') => {
    setRoster((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSubmit = async () => {
    if (!selectedSubjectId || roster.length === 0) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const records = roster.map((s) => ({
        studentId: s.student_id,
        status: s.status,
        notes: s.notes || '',
      }));

      const res = await api.post('/attendance/mark', {
        subjectId: selectedSubjectId,
        date,
        periodNumber,
        records,
      });

      setFeedback({ msg: res.data.message || 'Attendance recorded successfully!', type: 'success' });
      fetchRoster();
    } catch (err: any) {
      setFeedback({ msg: err.response?.data?.error || 'Failed to submit attendance', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const presentCount = roster.filter((s) => s.status === 'PRESENT').length;
  const absentCount = roster.filter((s) => s.status === 'ABSENT').length;
  const odCount = roster.filter((s) => s.status === 'ON_DUTY').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <CalendarCheck className="w-6 h-6 text-emerald-600" />
          <span>Class Attendance Taker</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Select subject, date, and period slot to record student attendance with real-time policy threshold tracking.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Control Toolbar */}
      <div className="glass-card p-5 rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Subject Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code}) - {s.department_name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Lecture Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Period Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Period Slot</label>
          <select
            value={periodNumber}
            onChange={(e) => setPeriodNumber(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value={1}>Period 1 (09:00 AM - 09:55 AM)</option>
            <option value={2}>Period 2 (09:55 AM - 10:50 AM)</option>
            <option value={3}>Period 3 (11:10 AM - 12:05 PM)</option>
            <option value={4}>Period 4 (01:00 PM - 01:55 PM)</option>
            <option value={5}>Period 5 (01:55 PM - 02:50 PM)</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xs">
        {/* Quick Batch Actions & Counter Header */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="text-slate-500">Enrolled: {roster.length}</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Present: {presentCount}
            </span>
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Absent: {absentCount}
            </span>
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              On-Duty (OD): {odCount}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleMarkAll('PRESENT')}
              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold transition-colors"
            >
              All Present
            </button>
            <button
              onClick={() => handleMarkAll('ABSENT')}
              className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[11px] font-bold transition-colors"
            >
              All Absent
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Roll Number</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Class / Section</th>
                <th className="px-6 py-4 text-center">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoadingRoster ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">Loading student roster...</td>
                </tr>
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">No students enrolled in this department.</td>
                </tr>
              ) : (
                roster.map((st) => (
                  <tr key={st.student_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-indigo-600">
                      {st.roll_number}
                    </td>

                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-900">{st.full_name}</p>
                      <p className="text-[11px] text-slate-400">{st.email}</p>
                    </td>

                    <td className="px-6 py-3.5 text-slate-600">
                      {st.course} • {st.year} ({st.section})
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.student_id, 'PRESENT')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            st.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.student_id, 'ABSENT')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            st.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.student_id, 'ON_DUTY')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            st.status === 'ON_DUTY'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          On-Duty (OD)
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || roster.length === 0}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? 'Recording Session...' : 'Submit Attendance Sheet'}</span>
        </button>
      </div>
    </div>
  );
};
