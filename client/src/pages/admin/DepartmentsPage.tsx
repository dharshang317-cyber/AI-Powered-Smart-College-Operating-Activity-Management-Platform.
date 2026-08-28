import React, { useState, useEffect } from 'react';
import { Building, Plus, Users, GraduationCap, BookOpen, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hodName, setHodName] = useState('');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/departments', { name, code, hodName, description });
      setShowAddModal(false);
      setName('');
      setCode('');
      setHodName('');
      setDescription('');
      setFeedback('Department created successfully!');
      fetchDepartments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create department');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Building className="w-6 h-6 text-indigo-600" />
            <span>Academic Departments</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure Arts & Science departments, assign Heads of Departments (HOD), and review departmental student strength.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    CODE: {dept.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2 leading-tight">
                    {dept.name}
                  </h3>
                </div>
                <Badge variant={dept.is_active ? 'success' : 'neutral'} dot size="sm">
                  {dept.is_active ? 'Active' : 'Disabled'}
                </Badge>
              </div>

              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {dept.description || 'Academic Center of Excellence for Undergraduate & Postgraduate programs.'}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                <p className="text-slate-400 font-semibold text-[11px]">Head of Department:</p>
                <p className="font-bold text-slate-800">{dept.hod_name || 'Designated Professor'}</p>
              </div>
            </div>

            {/* Department Metric Badges */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
              <div className="p-2 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Students</p>
                <p className="text-sm font-extrabold text-slate-800">{dept.student_count || 0}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Faculty</p>
                <p className="text-sm font-extrabold text-slate-800">{dept.faculty_count || 0}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Subjects</p>
                <p className="text-sm font-extrabold text-slate-800">{dept.subject_count || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Department">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Artificial Intelligence & Data Science"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. AIDS"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Head of Department (HOD)</label>
            <input
              type="text"
              value={hodName}
              onChange={(e) => setHodName(e.target.value)}
              placeholder="e.g. Dr. K. Meenakshi"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of department scope..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md mt-2"
          >
            Create Department
          </button>
        </form>
      </Modal>
    </div>
  );
};
