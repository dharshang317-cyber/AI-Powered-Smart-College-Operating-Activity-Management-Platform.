import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Search,
  Filter,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

interface UserManagementPageProps {
  initialRole?: 'STUDENT' | 'FACULTY';
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ initialRole = 'STUDENT' }) => {
  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>(initialRole);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let url = `/admin/users?role=${role}`;
      if (selectedDept) url += `&departmentId=${selectedDept}`;
      if (selectedStatus) url += `&status=${selectedStatus}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(url);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    api.get('/admin/departments')
      .then((res) => setDepartments(res.data.departments || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [role, selectedDept, selectedStatus, search]);

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
    try {
      await api.post('/admin/update-user-status', { userId, status: nextStatus });
      fetchUsers();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove "${name}" from college records?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    // In demo / prototype, notify user
    setEditingUser(null);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            {role === 'STUDENT' ? (
              <GraduationCap className="w-6 h-6 text-emerald-600" />
            ) : (
              <Users className="w-6 h-6 text-indigo-600" />
            )}
            <span>{role === 'STUDENT' ? 'Student Records Directory' : 'Faculty Staff Directory'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage student admissions, academic rolls, faculty designations, and account access permissions.
          </p>
        </div>

        {/* Role Switcher */}
        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center space-x-1 self-start">
          <button
            onClick={() => setRole('STUDENT')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              role === 'STUDENT' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Students ({users.filter((u) => u.role === 'STUDENT').length || '...'})
          </button>
          <button
            onClick={() => setRole('FACULTY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              role === 'FACULTY' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Faculty ({users.filter((u) => u.role === 'FACULTY').length || '...'})
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="glass-card p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${role.toLowerCase()}s by name, email, roll...`}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        >
          <option value="">All Account Statuses</option>
          <option value="APPROVED">Approved & Active</option>
          <option value="PENDING">Pending Approval</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Department & Academic Info</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">Loading directory records...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">No matching user records found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                          alt={u.full_name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{u.full_name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{u.department_name || '—'}</p>
                      <p className="text-[11px] text-slate-500">
                        {role === 'STUDENT'
                          ? `${u.course || 'B.Sc'} • Roll: ${u.roll_number} (${u.year || 'III Year'})`
                          : `${u.designation} • ${u.qualification || ''}`}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      <p>{u.phone}</p>
                    </td>

                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          u.status === 'APPROVED'
                            ? 'success'
                            : u.status === 'PENDING'
                            ? 'warning'
                            : 'danger'
                        }
                        dot
                        size="sm"
                      >
                        {u.status}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {u.status !== 'PENDING' && (
                          <button
                            onClick={() => handleStatusToggle(u.id, u.status)}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              u.status === 'APPROVED'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title={u.status === 'APPROVED' ? 'Suspend Access' : 'Activate Access'}
                          >
                            {u.status === 'APPROVED' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                          </button>
                        )}

                        {!u.is_primary_admin && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.full_name)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Remove User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
