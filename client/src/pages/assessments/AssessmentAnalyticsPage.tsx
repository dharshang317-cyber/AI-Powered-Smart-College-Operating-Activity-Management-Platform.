import React, { useState, useEffect } from 'react';
import { Award, ArrowLeft, Users, BarChart2, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';

interface AssessmentAnalyticsPageProps {
  assessmentId: string;
  onBack: () => void;
}

export const AssessmentAnalyticsPage: React.FC<AssessmentAnalyticsPageProps> = ({
  assessmentId,
  onBack,
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get(`/assessments/${assessmentId}/analytics`)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [assessmentId]);

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400 text-xs">Loading assessment analytics...</div>;
  }

  const assessment = data?.assessment || {};
  const an = data?.analytics || {};
  const submissions = data?.submissions || [];

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assessments</span>
        </button>

        <Badge variant="primary" size="sm">
          {assessment.subject_name} ({assessment.subject_code})
        </Badge>
      </div>

      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
          {assessment.title}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Department of {assessment.department_name} • Faculty: {assessment.faculty_name}
        </p>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Submissions"
          value={an.totalSubmissions || 0}
          subtitle="Students evaluated"
          icon={Users}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />

        <StatCard
          title="Average Score"
          value={`${an.averageScore || 0} / ${assessment.total_marks}`}
          subtitle="Mean performance"
          icon={BarChart2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="Highest Score"
          value={`${an.highestScore || 0} / ${assessment.total_marks}`}
          subtitle="Top performer"
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />

        <StatCard
          title="Pass Percentage"
          value={`${an.passRate || 0}%`}
          subtitle="≥50% benchmark"
          icon={Award}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Student Submissions Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xs space-y-4 p-6">
        <h3 className="text-base font-bold text-slate-900">Student Submission Roster & Marks</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Roll Number</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Score</th>
                <th className="px-6 py-3.5">Percentage</th>
                <th className="px-6 py-3.5">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No student submissions recorded for this test yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-bold text-indigo-600">{sub.roll_number}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-900">{sub.student_name}</p>
                      <p className="text-[10px] text-slate-400">{sub.student_email}</p>
                    </td>
                    <td className="px-6 py-3.5 font-extrabold text-slate-900">
                      {sub.score} / {sub.total_marks}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={sub.percentage >= 70 ? 'success' : sub.percentage >= 50 ? 'warning' : 'danger'} size="sm" dot>
                        {sub.percentage}%
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {new Date(sub.submitted_at).toLocaleString()}
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
