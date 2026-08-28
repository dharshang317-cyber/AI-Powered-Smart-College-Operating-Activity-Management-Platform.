import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building,
  BookOpen,
  CalendarCheck,
  FileText,
  Calendar,
  Layers,
  HeartHandshake,
  MessageSquare,
  Sparkles,
  FileSpreadsheet,
  History,
  Settings,
  Clock,
  Award,
  Activity,
  UserCheck,
  X,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';

  // Navigation configurations based on role
  const adminLinks = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Pending Approvals', path: '/admin/approvals', icon: UserCheck },
    { label: 'Students Directory', path: '/admin/students', icon: GraduationCap },
    { label: 'Faculty Directory', path: '/admin/faculty', icon: Users },
    { label: 'Departments', path: '/admin/departments', icon: Building },
    { label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { label: 'Attendance Hub', path: '/admin/attendance', icon: CalendarCheck },
    { label: 'Assessments', path: '/admin/assessments', icon: FileText },
    { label: 'Campus Events', path: '/events', icon: Calendar },
    { label: 'Smart Classroom', path: '/classroom', icon: Layers },
    { label: 'Campus Care Club', path: '/campus-care', icon: HeartHandshake },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Campus Pulse', path: '/pulse', icon: Activity },
    { label: 'CampusNexus AI', path: '/ai', icon: Sparkles, highlight: true },
    { label: 'Reports & Export', path: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Activity Logs', path: '/admin/activity-logs', icon: History },
    { label: 'College Settings', path: '/admin/settings', icon: Settings },
  ];

  const facultyLinks = [
    { label: 'Faculty Dashboard', path: '/faculty', icon: LayoutDashboard },
    { label: 'Students Directory', path: '/faculty/students', icon: GraduationCap },
    { label: 'Departments', path: '/admin/departments', icon: Building },
    { label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { label: 'Timetable Builder', path: '/faculty/timetable', icon: Clock },
    { label: 'Mark Attendance', path: '/faculty/attendance', icon: CalendarCheck },
    { label: 'Smart Classroom (PPT/PDF)', path: '/classroom', icon: Layers },
    { label: 'Assessments & Quizzes', path: '/assessments', icon: FileText },
    { label: 'Campus Care Club', path: '/campus-care', icon: HeartHandshake },
    { label: 'Campus Events', path: '/events', icon: Calendar },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Campus Pulse', path: '/pulse', icon: Activity },
    { label: 'Academic Reports', path: '/admin/reports', icon: FileSpreadsheet },
    { label: 'CampusNexus AI', path: '/ai', icon: Sparkles, highlight: true },
  ];

  const careClubLinks = [
    { label: 'Care Club Workspace', path: '/care-club', icon: HeartHandshake },
    { label: 'Student Guidance & Chats', path: '/campus-care', icon: MessageSquare },
    { label: 'Campus Events', path: '/events', icon: Calendar },
    { label: 'Campus Pulse', path: '/pulse', icon: Activity },
    { label: 'CampusNexus AI', path: '/ai', icon: Sparkles, highlight: true },
  ];

  const studentLinks = [
    { label: 'Campus Snapshot', path: '/student', icon: LayoutDashboard },
    { label: 'My Timetable', path: '/student/timetable', icon: Clock },
    { label: 'My Attendance', path: '/student/attendance', icon: CalendarCheck },
    { label: 'Smart Classroom', path: '/classroom', icon: Layers },
    { label: 'Assessments & Tests', path: '/assessments', icon: Award },
    { label: 'Campus Care Club', path: '/campus-care', icon: HeartHandshake },
    { label: 'Campus Events', path: '/events', icon: Calendar },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Campus Pulse', path: '/pulse', icon: Activity },
    { label: 'CampusNexus AI', path: '/ai', icon: Sparkles, highlight: true },
  ];

  const links =
    role === 'ADMIN'
      ? adminLinks
      : role === 'FACULTY'
      ? facultyLinks
      : role === 'CARE_CLUB'
      ? careClubLinks
      : studentLinks;

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Mobile Close */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 tracking-tight block">
                CampusNexus AI
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block">
                {role} Workspace
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Link List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path;

            return (
              <button
                key={link.path}
                onClick={() => handleLinkClick(link.path)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60 shadow-xs'
                    : link.highlight
                    ? 'text-indigo-600 hover:bg-indigo-50/60 font-bold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive
                      ? 'text-indigo-600'
                      : link.highlight
                      ? 'text-indigo-500'
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                <span className="truncate">{link.label}</span>
                {link.highlight && (
                  <span className="ml-auto bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Info Card */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="font-bold text-slate-800 text-[11px]">Campus Engine Active</p>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Real-time WebSockets Connected</p>
          </div>
        </div>
      </aside>
    </>
  );
};
