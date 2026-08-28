import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Users, Building, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/Modal';

export const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [departmentId, setDepartmentId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [semester, setSemester] = useState('V Semester');
  const [facultyId, setFacultyId] = useState('');

  const fetchSubjects = async () => {
    try {
      const [subjRes, deptRes, facRes] = await Promise.all([
        api.get('/admin/subjects'),
        api.get('/admin/departments'),
        api.get('/admin/users?role=FACULTY&status=APPROVED'),
      ]);
      setSubjects(subjRes.data.subjects || []);
      setDepartments(deptRes.data.departments || []);
      setFacultyList(facRes.data.users || []);
      if (deptRes.data.departments?.length > 0) {
        setDepartmentId(deptRes.data.departments[0].id);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/subjects', {
        departmentId,
        name,
        code,
        semester,
        facultyId: facultyId || null,
      });
      setShowAddModal(false);
      setName('');
      setCode('');
      fetchSubjects();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add subject');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>Academic Curriculum & Subjects</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Define course subjects, semester allocations, and assign faculty professors.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Subjects Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Subject Code & Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Semester</th>
                <th className="px-6 py-4">Assigned Faculty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">Loading subjects...</td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">No subjects defined yet.</td>
                </tr>
              ) : (
                subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mr-2">
                        {s.code}
                      </span>
                      <span className="font-bold text-slate-900">{s.name}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {s.department_name} ({s.department_code})
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {s.semester}
                    </td>
                    <td className="px-6 py-4">
                      {s.faculty_name ? (
                        <div className="flex items-center space-x-2 text-indigo-700 font-semibold">
                          <Users className="w-3.5 h-3.5" />
                          <span>{s.faculty_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Assigned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Subject Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Academic Subject">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Distributed Database Management"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. IT304"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option>I Semester</option>
                <option>II Semester</option>
                <option>III Semester</option>
                <option>IV Semester</option>
                <option>V Semester</option>
                <option>VI Semester</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Faculty Professor</label>
            <select
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">-- Unassigned --</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>{f.full_name} ({f.department_name})</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md mt-2"
          >
            Save Subject
          </button>
        </form>
      </Modal>
    </div>
  );
};
