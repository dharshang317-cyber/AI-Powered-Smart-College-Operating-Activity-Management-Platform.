import React, { useState, useEffect } from 'react';
import { Clock, Calendar, BookOpen, User, Building } from 'lucide-react';
import api from '../../services/api';

export const StudentTimetablePage: React.FC = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/student/timetable')
      .then((res) => setSchedule(res.data.schedule || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [
    { num: 1, time: '09:00 - 09:55' },
    { num: 2, time: '09:55 - 10:50' },
    { num: 3, time: '11:10 - 12:05' },
    { num: 4, time: '01:00 - 01:55' },
    { num: 5, time: '01:55 - 02:50' },
  ];

  const todayDay = new Date().getDay() || 1;
  const todayClasses = schedule.filter((s) => s.day_of_week === todayDay);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <Clock className="w-6 h-6 text-indigo-600" />
          <span>My Academic Timetable</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Daily class periods, classroom allocations, and faculty professors for your academic batch.
        </p>
      </div>

      {/* Today's Classes Highlight Card */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Today's Live Lecture Roster ({days[todayDay - 1] || 'Sunday'})</span>
        </h3>

        {todayClasses.length === 0 ? (
          <p className="text-xs text-slate-400">No lectures scheduled for today.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayClasses.map((cls, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center space-x-3 text-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center">
                  P{cls.period_number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{cls.subject_name}</p>
                  <p className="text-[11px] text-slate-500">{cls.start_time} - {cls.end_time}</p>
                  <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                    Room: {cls.room_number || 'Lab'} • {cls.faculty_name || 'Prof'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Matrix */}
      <div className="glass-card rounded-3xl p-6 overflow-x-auto shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Complete Weekly Matrix</h3>
        <div className="min-w-[700px]">
          <div className="grid grid-cols-6 gap-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100">
            <div className="text-left pl-3 text-slate-700">Day / Period</div>
            {periods.map((p) => (
              <div key={p.num} className="bg-slate-50 py-2 rounded-xl border border-slate-100">
                <p className="text-slate-800">Period {p.num}</p>
                <p className="text-[10px] text-slate-400 font-normal">{p.time}</p>
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {days.map((dayName, dayIdx) => {
              const dayNum = dayIdx + 1;
              const isToday = dayNum === todayDay;

              return (
                <div
                  key={dayName}
                  className={`grid grid-cols-6 gap-3 py-3 items-center ${
                    isToday ? 'bg-indigo-50/40 rounded-2xl px-1' : ''
                  }`}
                >
                  <div className="text-left font-black text-slate-800 text-xs pl-3 flex items-center space-x-1.5">
                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                    <span>{dayName}</span>
                  </div>

                  {periods.map((p) => {
                    const slot = schedule.find((s) => s.day_of_week === dayNum && s.period_number === p.num);
                    return (
                      <div
                        key={p.num}
                        className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                          slot
                            ? 'bg-indigo-50/70 border-indigo-200/80 text-indigo-950 shadow-2xs'
                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                        }`}
                      >
                        {slot ? (
                          <>
                            <p className="font-bold text-slate-900 leading-tight truncate">{slot.subject_name}</p>
                            <div className="flex items-center justify-between text-[10px] text-indigo-700 font-semibold mt-1">
                              <span>{slot.subject_code}</span>
                              <span className="text-slate-500">{slot.room_number || 'Lab 1'}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-[11px] italic">Free Period</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
