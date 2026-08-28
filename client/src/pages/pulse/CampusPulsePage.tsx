import React, { useState, useEffect } from 'react';
import { Activity, Trophy, BookOpen, CheckCircle, HeartHandshake, UserCheck, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { Badge } from '../../components/Badge';

export const CampusPulsePage: React.FC = () => {
  const [pulseItems, setPulseItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPulse = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/communication/pulse');
      setPulseItems(res.data.pulse || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPulse();

    const socket = getSocket();
    const handleNewPulse = (item: any) => {
      setPulseItems((prev) => [item, ...prev]);
    };

    socket.on('new_pulse_item', handleNewPulse);
    return () => {
      socket.off('new_pulse_item', handleNewPulse);
    };
  }, []);

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-indigo-500" />;
      case 'CheckCircle':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-5 h-5 text-rose-500" />;
      case 'UserCheck':
        return <UserCheck className="w-5 h-5 text-sky-500" />;
      default:
        return <Activity className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Activity className="w-6 h-6 text-indigo-600 animate-pulse" />
            <span>Campus Pulse — Live Activity Stream</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time campus updates, new academic materials, published quizzes, event announcements, and milestones.
          </p>
        </div>

        <button
          onClick={fetchPulse}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
          title="Refresh Pulse"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Pulse Timeline Stream */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading Campus Pulse...</div>
        ) : pulseItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs glass-card rounded-3xl p-8">
            No campus updates broadcasted yet today.
          </div>
        ) : (
          pulseItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="glass-card p-5 rounded-3xl flex items-start space-x-4 hover:border-indigo-300 transition-all shadow-2xs"
            >
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-2xs shrink-0">
                {getIcon(item.icon)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <Badge variant="primary" size="sm">
                    {item.category}
                  </Badge>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2 leading-tight">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.content}
                </p>

                <p className="text-[10px] text-slate-400 font-medium mt-2">
                  Broadcasted by <span className="text-slate-700 font-semibold">{item.author_name}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
