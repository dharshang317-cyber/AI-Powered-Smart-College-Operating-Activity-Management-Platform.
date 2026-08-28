import React, { useState, useEffect } from 'react';
import { BookOpen, Layers, Award, CalendarCheck, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';

interface MySubjectsPageProps {
  onNavigate: (path: string) => void;
}

export const MySubjectsPage: React.FC<MySubjectsPageProps> = ({ onNavigate }) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/faculty/my-subjects')
      .then((res) => setSubjects(res.data.subjects || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <span>My Assigned Subjects & Curriculum</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          View your assigned academic subjects, enrolled students, uploaded study materials, and tests.
        </p>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">Loading assigned subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">No subjects currently assigned.</div>
        ) : (
          subjects.map((subj) => (
            <div
              key={subj.id}
              className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                    {subj.code}
                  </span>
                  <Badge variant="primary" size="sm">
                    {subj.semester}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3 leading-tight">
                  {subj.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Department of {subj.department_name}
                </p>
              </div>

              {/* Stats & Quick Links */}
              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Students</p>
                    <p className="text-sm font-extrabold text-slate-800">{subj.student_count || 0}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Materials</p>
                    <p className="text-sm font-extrabold text-slate-800">{subj.posts_count || 0}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Tests</p>
                    <p className="text-sm font-extrabold text-slate-800">{subj.assessments_count || 0}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => onNavigate(`/classroom?subjectId=${subj.id}`)}
                    className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Classroom</span>
                  </button>

                  <button
                    onClick={() => onNavigate(`/faculty/attendance?subjectId=${subj.id}`)}
                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Attendance</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
