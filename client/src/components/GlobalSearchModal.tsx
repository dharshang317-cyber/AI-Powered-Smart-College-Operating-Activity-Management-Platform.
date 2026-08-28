import React, { useState, useEffect } from 'react';
import { Search, BookOpen, FileText, Calendar, User as UserIcon, X, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    materials: any[];
    assessments: any[];
    events: any[];
    users: any[];
  }>({
    materials: [],
    assessments: [],
    events: [],
    users: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ materials: [], assessments: [], events: [], users: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [matRes, assessRes, eventRes] = await Promise.all([
          api.get(`/classroom/posts?search=${encodeURIComponent(query)}`),
          api.get(`/assessments`),
          api.get(`/events?search=${encodeURIComponent(query)}`),
        ]);

        const filteredAssess = (assessRes.data.assessments || []).filter((a: any) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          (a.subject_name && a.subject_name.toLowerCase().includes(query.toLowerCase()))
        );

        setResults({
          materials: matRes.data.posts || [],
          assessments: filteredAssess,
          events: eventRes.data.events || [],
          users: [],
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (path: string) => {
    onNavigate(path);
    onClose();
    setQuery('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Campus Search" maxWidth="2xl">
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subjects, study materials, tests, events, professors..."
          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {isLoading && (
          <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Searching campus records...</span>
          </div>
        )}

        {!isLoading && query.length >= 2 && (
          <>
            {/* Study Materials */}
            {results.materials.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Study Materials & Handouts</span>
                </h4>
                <div className="space-y-1.5">
                  {results.materials.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(`/classroom?postId=${item.id}`)}
                      className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.subject_name} • {item.post_type} • By {item.faculty_name}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessments */}
            {results.assessments.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Online Assessments & Quizzes</span>
                </h4>
                <div className="space-y-1.5">
                  {results.assessments.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(`/assessments`)}
                      className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.subject_name} • {item.duration_minutes} Mins • {item.total_marks} Marks
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {results.events.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Campus Events & Workshops</span>
                </h4>
                <div className="space-y-1.5">
                  {results.events.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(`/events`)}
                      className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-amber-600">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.category} • {item.event_date} at {item.venue}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.materials.length === 0 && results.assessments.length === 0 && results.events.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                No matching campus records found for "{query}".
              </div>
            )}
          </>
        )}

        {query.length < 2 && (
          <div className="py-6 text-center text-slate-400 text-xs">
            Type at least 2 characters to search across subjects, materials, quizzes, and events.
          </div>
        )}
      </div>
    </Modal>
  );
};
