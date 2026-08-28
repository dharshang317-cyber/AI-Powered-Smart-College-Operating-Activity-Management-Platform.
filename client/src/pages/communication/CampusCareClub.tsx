import React, { useState, useEffect, useRef } from 'react';
import {
  HeartHandshake,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  User,
  Send,
  MessageSquare,
  Sparkles,
  Lock,
  Calendar,
  X,
  Search,
  Check,
  CheckCheck,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { getSocket } from '../../services/socket';

export const CampusCareClub: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'MENTORS' | 'TICKETS'>('MENTORS');
  const [members, setMembers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Private 1-on-1 Chat Drawer State
  const [activeChatMember, setActiveChatMember] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Guidance Appointment Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [category, setCategory] = useState('Personal & Academic Guidance');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [selectedCounselorId, setSelectedCounselorId] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Ticket Status Modal (for Mentors & Admin)
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchClubData = async () => {
    setIsLoading(true);
    try {
      const [membersRes, reqRes] = await Promise.all([
        api.get('/communication/care-club/members'),
        api.get('/communication/care-club/requests'),
      ]);
      setMembers(membersRes.data.members || []);
      setRequests(reqRes.data.requests || []);
      if (membersRes.data.members?.length > 0 && !selectedCounselorId) {
        setSelectedCounselorId(membersRes.data.members[0].id);
      }
    } catch (err) {
      console.error('Error fetching Campus Care Club data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClubData();

    // Check URL param for direct chat jump
    const urlParams = new URLSearchParams(window.location.search);
    const chatUserId = urlParams.get('chatUserId');
    if (chatUserId) {
      openChatWithId(chatUserId);
    }
  }, []);

  // Listen to incoming real-time private messages
  useEffect(() => {
    const s = getSocket();
    const handleNewMessage = (msg: any) => {
      if (activeChatMember && (msg.sender_id === activeChatMember.id || msg.receiver_id === activeChatMember.id)) {
        setChatMessages((prev) => [...prev, msg]);
      }
    };

    s.on('new_care_message', handleNewMessage);
    s.on('new_direct_message', handleNewMessage);

    return () => {
      s.off('new_care_message', handleNewMessage);
      s.off('new_direct_message', handleNewMessage);
    };
  }, [activeChatMember]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const openChatWithId = async (memberId: string) => {
    try {
      const res = await api.get(`/communication/care-club/chat/${memberId}`);
      setActiveChatMember(res.data.member || { id: memberId, full_name: 'Care Club Mentor' });
      setChatMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to open chat:', err);
    }
  };

  const handleOpenChat = async (member: any) => {
    setActiveChatMember(member);
    try {
      const res = await api.get(`/communication/care-club/chat/${member.id}`);
      setChatMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatMember || isSendingMessage) return;

    const text = chatInput.trim();
    setChatInput('');
    setIsSendingMessage(true);

    try {
      const res = await api.post(`/communication/care-club/chat/${activeChatMember.id}`, {
        messageText: text,
      });

      if (res.data.data) {
        setChatMessages((prev) => [...prev, res.data.data]);
      }
    } catch (err) {
      console.error('Failed to send private care message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    setIsSubmittingTicket(true);

    try {
      await api.post('/communication/care-club/requests', {
        category,
        subject,
        description,
        preferredTime,
        counselorId: selectedCounselorId || null,
      });

      setShowRequestModal(false);
      setSubject('');
      setDescription('');
      setPreferredTime('');
      fetchClubData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit guidance request');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;

    try {
      await api.put(`/communication/care-club/requests/${activeRequest.id}/status`, {
        status: updateStatus,
        resolutionNotes,
      });
      setActiveRequest(null);
      fetchClubData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(q) ||
      (m.specialization && m.specialization.toLowerCase().includes(q)) ||
      (m.designation && m.designation.toLowerCase().includes(q)) ||
      (m.department_name && m.department_name.toLowerCase().includes(q))
    );
  });

  const categories = [
    'Personal & Academic Guidance',
    'Exam Stress & Mental Wellness',
    'Career Planning & Placement Advisory',
    'Study Routine & Time Management',
    'Freshman Transition & Personal Concerns',
    'Higher Studies & Abroad Admissions',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <HeartHandshake className="w-7 h-7 text-rose-600" />
            <span>Campus Care Club — 1-on-1 Confidential Student Guidance</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Connect privately with approved Care Club mentors across all departments. Ask questions, receive confidential advice, and discuss any academic or personal matters securely.
          </p>
        </div>

        {user?.role === 'STUDENT' && (
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs shadow-md shadow-rose-600/30 transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Book Confidential Guidance Session</span>
          </button>
        )}
      </div>

      {/* Confidentiality Assurance Card */}
      <div className="bg-gradient-to-r from-rose-50 via-rose-50/80 to-purple-50 border border-rose-200/90 rounded-3xl p-5 text-xs text-rose-950 flex items-start space-x-3.5 shadow-2xs">
        <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-sm shrink-0 mt-0.5">
          <Shield className="w-5 h-5" />
        </div>
        <div className="leading-relaxed">
          <div className="flex items-center space-x-2">
            <p className="font-extrabold text-rose-950 text-sm">100% Confidential & Secure Communication</p>
            <span className="bg-rose-200/80 text-rose-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Private Channel
            </span>
          </div>
          <p className="text-[11px] text-rose-800/90 mt-1">
            Campus Care Club mentors are verified professionals available for students in **all departments**.
            Your 1-on-1 chats and guidance inquiries are completely confidential. You can ask anything openly without hesitation.
          </p>
        </div>
      </div>

      {/* Main Tab Bar & Search */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('MENTORS')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
              activeTab === 'MENTORS'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Care Club Mentors ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
              activeTab === 'TICKETS'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Guidance Appointments ({requests.length})</span>
          </button>
        </div>

        {activeTab === 'MENTORS' && (
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by mentor name, specialization..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>
        )}
      </div>

      {/* TAB 1: CARE CLUB MENTORS DIRECTORY (Cross-Department Visibility) */}
      {activeTab === 'MENTORS' && (
        <div>
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 text-xs">Loading Campus Care Club mentors...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-2">
              <HeartHandshake className="w-10 h-10 text-rose-300 mx-auto" />
              <p className="font-bold text-slate-700">No Care Club mentors found.</p>
              <p className="text-slate-400 text-[11px]">Check back soon as new verified counselors are added.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMembers.map((mentor) => (
                <div
                  key={mentor.id}
                  className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4 hover:border-rose-300 transition-all shadow-xs group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Avatar & Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={mentor.avatar_url || 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&h=120&fit=crop'}
                          alt={mentor.full_name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-rose-200 shadow-sm"
                        />
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                            {mentor.full_name}
                          </h4>
                          <span className="text-[11px] font-semibold text-rose-600 block mt-0.5">
                            {mentor.designation}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {mentor.qualification}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Specialization Badge */}
                    <div className="pt-2">
                      <span className="inline-block text-[11px] font-bold text-rose-800 bg-rose-100/70 border border-rose-200 px-2.5 py-1 rounded-xl">
                        🎯 {mentor.specialization || 'Student Guidance & Wellness'}
                      </span>
                    </div>

                    {/* Bio / Guidance Approach */}
                    {mentor.bio && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-100 italic">
                        "{mentor.bio}"
                      </p>
                    )}

                    {/* Availability */}
                    {mentor.available_hours && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span>Hours: {mentor.available_hours}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <button
                      onClick={() => handleOpenChat(mentor)}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-rose-600/20 flex items-center justify-center space-x-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Private 1-on-1 Confidential Chat</span>
                    </button>

                    {user?.role === 'STUDENT' && (
                      <button
                        onClick={() => {
                          setSelectedCounselorId(mentor.id);
                          setShowRequestModal(true);
                        }}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center space-x-1.5 border border-slate-200"
                      >
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Book Appointment Slot</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GUIDANCE APPOINTMENTS & TICKETS */}
      {activeTab === 'TICKETS' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 text-xs">Loading guidance appointments...</div>
          ) : requests.length === 0 ? (
            <div className="py-20 text-center glass-card rounded-3xl p-8 space-y-2">
              <HeartHandshake className="w-10 h-10 text-rose-300 mx-auto" />
              <p className="font-bold text-slate-700">No guidance appointments yet.</p>
              <p className="text-slate-400 text-[11px]">Whenever you need support or guidance, book a session with a Care Club mentor.</p>
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
                      <div className="pt-3 border-t border-slate-100 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setActiveRequest(req);
                            setUpdateStatus(req.status);
                            setResolutionNotes(req.resolution_notes || '');
                          }}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
                        >
                          Update Status & Notes
                        </button>
                        <button
                          onClick={() => openChatWithId(req.student_id)}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors"
                        >
                          Chat Student
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PRIVATE 1-ON-1 CONFIDENTIAL CHAT DRAWER */}
      {activeChatMember && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Chat Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={activeChatMember.avatar_url || 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop'}
                  alt={activeChatMember.full_name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-rose-500"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight flex items-center space-x-1.5">
                  <span>{activeChatMember.full_name}</span>
                  <Lock className="w-3 h-3 text-rose-400" />
                </h4>
                <p className="text-[10px] text-rose-300 font-medium">
                  {activeChatMember.designation || activeChatMember.care_designation || 'Care Club Mentor'} • Confidential
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveChatMember(null)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Security Pill */}
          <div className="bg-rose-50 px-4 py-2 text-[11px] text-rose-900 font-medium border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>Private & confidential conversation</span>
            </div>
            <span className="text-[10px] text-rose-600 font-bold">Encrypted Channel</span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {chatMessages.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <HeartHandshake className="w-10 h-10 text-rose-400 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Start Your Confidential Conversation</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  You can say anything openly. Your mentor is here to listen, support, and guide you.
                </p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isMe
                          ? 'bg-rose-600 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                      }`}
                    >
                      <p>{msg.message_text}</p>
                      <div
                        className={`text-[9px] mt-1 flex items-center justify-end space-x-1 ${
                          isMe ? 'text-rose-200' : 'text-slate-400'
                        }`}
                      >
                        <span>{new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-rose-200" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              required
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your message confidentially..."
              className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isSendingMessage}
              className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl transition-all shadow-md shadow-rose-600/30 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Student Request Modal */}
      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="Book Confidential Guidance Session" maxWidth="lg">
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Guidance Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-rose-500"
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
              placeholder="e.g. Guidance on balancing Placement Preparation with Semester Project"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Explanation (Confidential)</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain your queries, concerns, or areas where you would like support..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-rose-500"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Mentor</label>
              <select
                value={selectedCounselorId}
                onChange={(e) => setSelectedCounselorId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-rose-500"
              >
                <option value="">-- Any Available Mentor --</option>
                {members.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.designation})</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmittingTicket}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-rose-600/30 disabled:opacity-50 mt-2"
          >
            {isSubmittingTicket ? 'Submitting Request...' : 'Send Confidential Guidance Request'}
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
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-colors shadow-md"
            >
              Save Update
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};
