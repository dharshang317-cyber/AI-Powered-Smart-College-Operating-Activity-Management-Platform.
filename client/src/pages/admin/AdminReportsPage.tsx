import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Printer, GraduationCap, Users, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'FACULTY' | 'ASSESSMENTS'>('STUDENTS');

  useEffect(() => {
    api.get('/admin/reports')
      .then((res) => setReports(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const exportCSV = (type: string) => {
    let headers = '';
    let rows: any[] = [];
    let filename = `CampusNexus_${type}_Report_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'STUDENTS') {
      headers = 'Full Name,Email,Phone,Roll Number,Course,Year,Section,Department,Status\n';
      rows = (reports?.studentRoster || []).map((s: any) =>
        `"${s.full_name}","${s.email}","${s.phone}","${s.roll_number}","${s.course}","${s.year}","${s.section}","${s.department_name}","${s.status}"`
      );
    } else if (type === 'FACULTY') {
      headers = 'Full Name,Email,Phone,Designation,Qualification,Specialization,Department,Status\n';
      rows = (reports?.facultyRoster || []).map((f: any) =>
        `"${f.full_name}","${f.email}","${f.phone}","${f.designation}","${f.qualification || ''}","${f.specialization || ''}","${f.department_name}","${f.status}"`
      );
    } else if (type === 'ASSESSMENTS') {
      headers = 'Assessment Title,Subject,Department,Total Submissions,Average Score,Highest Score,Lowest Score\n';
      rows = (reports?.assessmentReport || []).map((a: any) =>
        `"${a.title}","${a.subject_name}","${a.department_name}","${a.total_submissions || 0}","${a.average_score ? Number(a.average_score).toFixed(1) : '0.0'}","${a.highest_score || 0}","${a.lowest_score || 0}"`
      );
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            <span>Academic Reporting & Data Export</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export verified college records for auditing, accreditation, and administrative reports.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start">
          <button
            onClick={() => exportCSV(activeTab)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('STUDENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === 'STUDENTS' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Roster ({reports?.studentRoster?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('FACULTY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === 'FACULTY' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Faculty Directory ({reports?.facultyRoster?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('ASSESSMENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === 'ASSESSMENTS' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Assessments ({reports?.assessmentReport?.length || 0})</span>
        </button>
      </div>

      {/* Active Table Display */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {activeTab === 'STUDENTS' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Department & Class</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {reports?.studentRoster?.map((s: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{s.full_name}</td>
                    <td className="px-6 py-3.5 font-bold text-indigo-600">{s.roll_number}</td>
                    <td className="px-6 py-3.5">{s.department_name} • {s.year} ({s.section})</td>
                    <td className="px-6 py-3.5 text-slate-500">{s.email} • {s.phone}</td>
                    <td className="px-6 py-3.5 font-semibold text-emerald-600">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'FACULTY' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Faculty Member</th>
                  <th className="px-6 py-4">Designation & Degree</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {reports?.facultyRoster?.map((f: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{f.full_name}</td>
                    <td className="px-6 py-3.5">{f.designation} ({f.qualification || 'M.Sc.'})</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{f.department_name}</td>
                    <td className="px-6 py-3.5 text-slate-500">{f.email} • {f.phone}</td>
                    <td className="px-6 py-3.5 font-semibold text-indigo-600">{f.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'ASSESSMENTS' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Test Title</th>
                  <th className="px-6 py-4">Subject & Department</th>
                  <th className="px-6 py-4">Submissions</th>
                  <th className="px-6 py-4">Average Score</th>
                  <th className="px-6 py-4">Highest / Lowest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {reports?.assessmentReport?.map((a: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{a.title}</td>
                    <td className="px-6 py-3.5">{a.subject_name} ({a.department_name})</td>
                    <td className="px-6 py-3.5 font-bold text-slate-800">{a.total_submissions || 0} students</td>
                    <td className="px-6 py-3.5 font-bold text-indigo-600">
                      {a.average_score ? Number(a.average_score).toFixed(1) : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{a.highest_score || 0} / {a.lowest_score || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
