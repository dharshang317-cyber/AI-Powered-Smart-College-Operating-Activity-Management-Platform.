import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldCheck, UserCheck, Calendar, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';

export const AdminActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/admin/activity-logs?search=${encodeURIComponent(search)}`);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <History className="w-6 h-6 text-indigo-600" />
            <span>System Activity & Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable timeline of administrative, faculty, and student actions across the college workspace.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter logs by action type, description, user name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action Type</th>
                <th className="px-6 py-4">Event Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">No activity logs recorded.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-900">{log.user_name || 'System'}</p>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{log.role || 'SYSTEM'}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-200 font-bold">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-800 leading-relaxed">
                      {log.description}
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
