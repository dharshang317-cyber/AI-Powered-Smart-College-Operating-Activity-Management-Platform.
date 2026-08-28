import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  MessageSquare,
  Users,
  Clock,
  CheckCircle2,
  Shield,
  Send,
  Calendar,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';

export const CareClubDashboard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [convRes, reqRes] = await Promise.all([
          api.get('/communication/care-club/my-conversations'),
          api.get('/communication/care-club/requests'),
        ]);
        setConversations(convRes.data.conversations || []);
        setRequests(reqRes.data.requests || []);
      } catch (err) {
        console.error('Care Club dashboard load error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const activeSessions = requests.filter((r) => r.status === 'IN_PROGRESS');
  const resolvedCount = requests.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px] uppercase tracking-wider">
              Campus Care Club Mentor
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center space-x-2">
            <span>Welcome back, {user?.full_name}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Empowering students across all departments with empathetic advice, academic planning, and confidential guidance.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/campus-care')}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-rose-600/30 flex items-center space-x-2 self-start"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Open All Student Chats & Tickets</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-rose-500">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Chat Threads</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{conversations.length}</span>
            <span className="text-xs text-rose-600 font-semibold">1-on-1 Students</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Guidance Tickets</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-600">{pendingRequests.length}</span>
            <span className="text-xs text-slate-400 font-medium">Awaiting Review</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-indigo-500">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Sessions</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-indigo-600">{activeSessions.length}</span>
            <span className="text-xs text-slate-400 font-medium">In Progress</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved Cases</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-600">{resolvedCount}</span>
            <span className="text-xs text-emerald-600 font-semibold">Students Guided</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Student Chats & Pending Guidance Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Student Conversations */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-rose-600" />
              <span>Direct Student Guidance Conversations</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">{conversations.length} Active</span>
          </div>

          <div className="glass-card rounded-3xl p-4 divide-y divide-slate-100 shadow-xs">
            {conversations.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <HeartHandshake className="w-8 h-8 text-rose-300 mx-auto" />
                <p className="font-bold text-slate-700">No active student chats yet.</p>
                <p className="text-[11px] text-slate-400">
                  When students message you from the Campus Care Club directory, conversations will appear here.
                </p>
              </div>
            ) : (
              conversations.map((c: any) => (
                <div
                  key={c.otherUser?.id}
                  onClick={() => onNavigate(`/campus-care?chatUserId=${c.otherUser?.id}`)}
                  className="py-3.5 px-3 rounded-2xl hover:bg-rose-50/50 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={c.otherUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                      alt={c.otherUser?.full_name}
                      className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                          {c.otherUser?.full_name}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                            {c.unreadCount} new
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {c.otherUser?.department_name || 'Student'} • {c.otherUser?.year || 'Campus'}
                      </p>
                      {c.lastMessage && (
                        <p className="text-[11px] text-slate-600 truncate max-w-[260px] mt-0.5">
                          {c.lastMessage.message_text}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium">
                    {c.lastMessage?.created_at ? new Date(c.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Pending Guidance Tickets */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Incoming Guidance Requests</span>
            </h3>
            <span className="text-xs text-amber-600 font-bold">{pendingRequests.length} Pending</span>
          </div>

          <div className="glass-card rounded-3xl p-4 space-y-3 shadow-xs">
            {requests.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold text-slate-700">All guidance tickets resolved!</p>
              </div>
            ) : (
              requests.slice(0, 4).map((req) => (
                <div
                  key={req.id}
                  onClick={() => onNavigate('/campus-care')}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-rose-50/40 border border-slate-100 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <Badge variant={req.status === 'RESOLVED' ? 'success' : req.status === 'PENDING' ? 'warning' : 'primary'} size="sm">
                      {req.status}
                    </Badge>
                    <span className="text-[10px] text-slate-400">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-tight">{req.subject}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">"{req.description}"</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span className="font-semibold">{req.student_name} ({req.department_name})</span>
                    {req.preferred_time && <span className="text-rose-600 font-semibold">{req.preferred_time}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Counseling Best Practices Card */}
      <div className="bg-gradient-to-r from-rose-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2 text-rose-300 text-xs font-extrabold uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Campus Care Club Mentor Guidelines</span>
          </div>
          <h3 className="text-lg font-black tracking-tight">Active Empathetic Listening & Student Support</h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Ensure complete student privacy, validate their feelings without premature judgement, recommend practical time management routines, and schedule follow-up check-ins.
          </p>
        </div>
      </div>
    </div>
  );
};
