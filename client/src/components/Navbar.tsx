import React, { useState } from 'react';
import {
  Bell,
  Search,
  Bot,
  Sparkles,
  LogOut,
  User,
  ExternalLink,
  CheckCheck,
  Menu,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Badge } from './Badge';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenSearch,
  onNavigate,
}) => {
  const { user, college, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'danger';
      case 'FACULTY':
        return 'primary';
      case 'CARE_CLUB':
        return 'warning';
      case 'STUDENT':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between">
        {/* Left Side: Mobile Menu Button & College Name */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-sm font-black text-base">
              CN
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm lg:text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-1.5">
                  <span>{college?.name || user?.college_name || 'CampusNexus AI'}</span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Smart College Operating Platform • {user?.role} Portal
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Global Search, AI Assistant, Notifications & User Profile */}
        <div className="flex items-center space-x-2.5 sm:space-x-4">
          {/* Global Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 rounded-xl text-xs text-slate-500 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search campus...</span>
            <kbd className="bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 rounded border border-slate-200">
              Ctrl K
            </kbd>
          </button>

          {/* AI Assistant Quick Launcher */}
          <button
            onClick={() => onNavigate('/ai')}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all group overflow-hidden"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-spin-slow" />
            <span className="hidden sm:inline">CampusNexus AI</span>
            <span className="sm:hidden">AI</span>
            <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-slate-800">Campus Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      You're all caught up! No recent notifications.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.link_url) onNavigate(n.link_url);
                          setShowNotifications(false);
                        }}
                        className={`p-3.5 text-xs transition-colors cursor-pointer hover:bg-slate-50 ${
                          n.is_read ? 'opacity-70 bg-white' : 'bg-indigo-50/40 font-medium'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="font-bold text-slate-900">{n.title}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                alt={user?.full_name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shadow-sm"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                  {user?.full_name}
                </p>
                <Badge variant={getRoleBadgeVariant(user?.role || 'STUDENT')} size="sm">
                  {user?.role}
                </Badge>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                <div className="p-3.5 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      onNavigate('/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
