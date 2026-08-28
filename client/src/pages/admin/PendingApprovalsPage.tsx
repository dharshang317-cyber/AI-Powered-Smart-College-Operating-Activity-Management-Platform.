import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  GraduationCap,
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  Building,
  Info,
} from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';

export const PendingApprovalsPage: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'FACULTY' | 'CARE_CLUB' | 'STUDENT'>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchPending = async () => {
    try {
      const res = await api.get('/admin/pending-approvals');
      setPendingUsers(res.data.pendingUsers || []);
    } catch (err) {
      console.error('Error fetching pending users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (userId: string, name: string) => {
    try {
      await api.post('/admin/approve-user', { userId });
      setFeedback({ msg: `Successfully verified and activated account for ${name}`, type: 'success' });
      fetchPending();
    } catch (err: any) {
      setFeedback({ msg: err.response?.data?.error || 'Failed to approve user', type: 'error' });
    }
  };

  const handleReject = async (userId: string, name: string) => {
    const reason = window.prompt(`Enter reason for rejecting registration request for ${name}:`);
    if (reason === null) return;

    try {
      await api.post('/admin/reject-user', { userId, reason });
      setFeedback({ msg: `Registration request for ${name} has been rejected`, type: 'success' });
      fetchPending();
    } catch (err: any) {
      setFeedback({ msg: err.response?.data?.error || 'Failed to reject user', type: 'error' });
    }
  };

  const filteredUsers = pendingUsers.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department_name && u.department_name.toLowerCase().includes(search.toLowerCase())) ||
      (u.roll_number && u.roll_number.toLowerCase().includes(search.toLowerCase())) ||
      (u.specialization && u.specialization.toLowerCase().includes(search.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            <span>Registration Verification Hub (Admin Exclusivity)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review and approve pending Faculty, Student, and Campus Care Club registrations before granting campus system access.
          </p>
        </div>

        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200 self-start">
          {pendingUsers.length} Pending Applications
        </span>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              roleFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({pendingUsers.length})
          </button>
          <button
            onClick={() => setRoleFilter('FACULTY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              roleFilter === 'FACULTY' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Faculty ({pendingUsers.filter((u) => u.role === 'FACULTY').length})
          </button>
          <button
            onClick={() => setRoleFilter('CARE_CLUB')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              roleFilter === 'CARE_CLUB' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Care Club ({pendingUsers.filter((u) => u.role === 'CARE_CLUB').length})
          </button>
          <button
            onClick={() => setRoleFilter('STUDENT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              roleFilter === 'STUDENT' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Students ({pendingUsers.filter((u) => u.role === 'STUDENT').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, roll, email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Pending Applications List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading pending requests...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">Verification Queue Clear</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are no pending student or faculty registration requests waiting for review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((applicant) => (
            <div
              key={applicant.id}
              className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all shadow-xs"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={applicant.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                      alt={applicant.full_name}
                      className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200 shadow-sm"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {applicant.full_name}
                      </h4>
                      <Badge variant={applicant.role === 'FACULTY' ? 'primary' : applicant.role === 'CARE_CLUB' ? 'warning' : 'success'} size="sm">
                        {applicant.role === 'CARE_CLUB' ? 'CARE CLUB' : applicant.role}
                      </Badge>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(applicant.created_at).toLocaleDateString()}</span>
                  </span>
                </div>

                {/* Details Breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  {applicant.role === 'CARE_CLUB' ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <Users className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-bold text-rose-950">
                          {applicant.designation || applicant.care_designation || 'Student Guidance Counselor'} ({applicant.qualification || 'Certified'})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 pl-5">
                        <span className="font-semibold">Guidance Area:</span> {applicant.specialization || applicant.care_specialization || 'Mental Wellness & Career'}
                      </div>
                      {applicant.bio && (
                        <div className="text-[11px] text-slate-500 italic pl-5 bg-rose-50/50 p-2 rounded-xl border border-rose-100">
                          "{applicant.bio}"
                        </div>
                      )}
                      {applicant.available_hours && (
                        <div className="text-[11px] text-slate-500 pl-5">
                          <span className="font-semibold">Hours:</span> {applicant.available_hours}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        Department: {applicant.department_name || 'Not assigned'}
                      </span>
                    </div>
                  )}

                  {applicant.role === 'FACULTY' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Designation: {applicant.designation} ({applicant.qualification})</span>
                      </div>
                      {applicant.specialization && (
                        <div className="text-[11px] text-slate-500 pl-5">
                          Specialization / Subjects: {applicant.specialization}
                        </div>
                      )}
                    </>
                  )}

                  {applicant.role === 'STUDENT' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {applicant.course} • {applicant.year} ({applicant.section})
                        </span>
                      </div>
                      <div className="text-[11px] text-indigo-600 font-bold pl-5">
                        Roll Number: {applicant.roll_number}
                      </div>
                    </>
                  )}

                  <div className="flex items-center space-x-2 pt-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{applicant.email}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{applicant.phone}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => handleApprove(applicant.id, applicant.full_name)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm shadow-emerald-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Activate</span>
                </button>

                <button
                  onClick={() => handleReject(applicant.id, applicant.full_name)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 border border-rose-200"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
