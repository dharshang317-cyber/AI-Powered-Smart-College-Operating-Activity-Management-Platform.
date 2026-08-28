import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { NotificationItem } from '../types';
import { useAuth } from './AuthContext';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  toasts: Toast[];
  removeToast: (id: string) => void;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/communication/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/communication/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/communication/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const socket = getSocket();

    const handleNewNotification = (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
      addToast(notif.title, notif.message, 'info');
    };

    const handleAdminAlert = (data: any) => {
      addToast(`Admin Alert: ${data.title}`, data.message, 'warning');
      fetchNotifications();
    };

    const handleDirectMessage = (data: any) => {
      addToast(`New Message from ${data.sender_name}`, data.message_text, 'info');
    };

    const handleStatusChanged = (data: any) => {
      addToast('Account Status Updated', `Your account status is now ${data.status}`, 'success');
      fetchNotifications();
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('admin_alert', handleAdminAlert);
    socket.on('new_direct_message', handleDirectMessage);
    socket.on('account_status_changed', handleStatusChanged);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('admin_alert', handleAdminAlert);
      socket.off('new_direct_message', handleDirectMessage);
      socket.off('account_status_changed', handleStatusChanged);
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        removeToast,
        fetchNotifications,
        markAllAsRead,
        markAsRead,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-800 flex items-start justify-between space-x-3 transition-all animate-bounce-subtle"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping"></span>
                <p className="font-semibold text-sm text-indigo-200">{toast.title}</p>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white text-sm font-bold ml-2 p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
