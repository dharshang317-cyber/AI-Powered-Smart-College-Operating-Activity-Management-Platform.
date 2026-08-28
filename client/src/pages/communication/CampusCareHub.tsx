import React, { useState, useEffect } from 'react';
import { HeartHandshake, Plus, Clock, CheckCircle2, AlertCircle, Shield, User, Send, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const CampusCareHub: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Student Request Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [category, setCategory] = useState('Study planning');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [counselorId, setCounselorId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Counselor Update Modal
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const [reqRes, counRes] = await Promise.all([
        api.get('/communication/campus-care/requests'),
        api.get('/communication/campus-care/counselors'),
      ]);
      setRequests(reqRes.data.requests || []);
      setCounselors(counRes.data.counselors || []);
      if (counRes.data.counselors?.length > 0 && !counselorId) {
        setCounselorId(counRes.data.counselors[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    setIsSubmitting(true);

    try {
      await api.post('/communication/campus-care/requests', {
        category,
        subject,
        description,
        preferredTime,
        counselorId: counselorId || null,
      });

      setShowRequestModal(false);
      setSubject('');
      setDescription('');
      setPreferredTime('');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit guidance request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;

    try {
      await api.put(`/communication/campus-care/requests/${activeRequest.id}/status`, {
        status: updateStatus,
        resolutionNotes,
      });
      setActiveRequest(null);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const categories = [
    'Academic difficulty',
    'Exam stress',
    'Study planning',
    'Career guidance',
    'Personal concerns',
    'College-related concerns',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <HeartHandshake className="w-6 h-6 text-rose-600" />
            <span>Campus Care — Student Wellbeing & Guidance Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Safe, confidential support for study planning, exam stress advisory, and career guidance with designated faculty counselors.
          </p>
        </div>

        {user?.role === 'STUDENT' && (
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Request Confidential Guidance</span>
          </button>
        )}
      </div>

      {/* Guidance Notice Banner */}
      <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-950 flex items-start space-x-3">
        <Shield className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-bold">Confidentiality & Care Guarantee</p>
          <p className="text-[11px] text-rose-800 mt-0.5">
            Campus Care is an academic & personal guidance system connecting students to designated faculty mentors. Conversations and ticket notes are private between the student and assigned counselor.
          </p>
        </div>
      </div>

      {/* Requests Stream */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading guidance records...</div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs glass-card rounded-3xl p-8 space-y-2">
            <HeartHandshake className="w-10 h-10 text-rose-300 mx-auto" />
            <p className="font-bold text-slate-700">No active guidance requests.</p>
            <p className="text-slate-400 text-[11px]">Whenever you need study support or career advice, submit a request above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => {
              const isResolved = req.status === 'RESOLVED';
              const isPending = req.status === 'PENDING';

              return (
                <div
                  key={req.id}
                  className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-xs hover:border-rose-200 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <Badge
                        variant={isResolved ? 'success' : isPending ? 'warning' : 'primary'}
                        size="sm"
                        dot
                      >
                        {req.status}
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <span className="inline-block text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 mt-2">
                      {req.category}
                    </span>

                    <h3 className="text-base font-bold text-slate-900 mt-2 leading-tight">
                      {req.subject}
                    </h3>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      "{req.description}"
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                      <p>
                        <strong>Student:</strong> {req.student_name} ({req.department_name} • {req.year})
                      </p>
                      <p>
                        <strong>Assigned Mentor:</strong> {req.counselor_name || 'Campus Care Team'}
                      </p>
                      {req.preferred_time && (
                        <p className="text-[11px] text-indigo-600 font-semibold">
                          Preferred Slot: {req.preferred_time}
                        </p>
                      )}
                    </div>

                    {req.resolution_notes && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs text-emerald-950 leading-relaxed">
                        <p className="font-bold text-emerald-900">Mentor Follow-Up Notes:</p>
                        <p className="text-[11px] text-emerald-800 mt-0.5">{req.resolution_notes}</p>
                      </div>
                    )}
                  </div>

                  {user?.role !== 'STUDENT' && (
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setActiveRequest(req);
                          setUpdateStatus(req.status);
                          setResolutionNotes(req.resolution_notes || '');
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
                      >
                        Update Ticket & Add Notes
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Request Modal */}
      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="Submit Guidance Request" maxWidth="lg">
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Guidance Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Summary</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Guidance on balancing Placement Preparation with Project"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Explanation</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain your queries, concerns, or areas where you would like support..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Time / Slot</label>
              <input
                type="text"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                placeholder="e.g. Friday 3:00 PM"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Counselor (Optional)</label>
              <select
                value={counselorId}
                onChange={(e) => setCounselorId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Auto-Assign --</option>
                {counselors.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.department_name})</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Submitting Request...' : 'Send Confidential Request'}
          </button>
        </form>
      </Modal>

      {/* Counselor Update Modal */}
      {activeRequest && (
        <Modal isOpen={!!activeRequest} onClose={() => setActiveRequest(null)} title="Update Guidance Ticket" maxWidth="md">
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="PENDING">Pending Review</option>
                <option value="IN_PROGRESS">In Progress / Scheduled</option>
                <option value="RESOLVED">Resolved / Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution & Follow-Up Notes</label>
              <textarea
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Session summary, action steps, or scheduled timing..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
            >
              Save Update
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};
