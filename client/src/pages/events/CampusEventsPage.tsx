import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Download,
  Share2,
  Tag,
  Search,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const CampusEventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Event Creator Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hackathon');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('10:00 AM');
  const [organizer, setOrganizer] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(100);
  const [posterUrl, setPosterUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Participant List Modal
  const [activeEventRoster, setActiveEventRoster] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      let url = `/events?`;
      if (selectedCategory && selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(url);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, search]);

  const handleRegister = async (eventId: string) => {
    try {
      await api.post(`/events/${eventId}/register`);
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleViewParticipants = async (eventId: string, eventTitle: string) => {
    try {
      const res = await api.get(`/events/${eventId}/registrations`);
      setActiveEventRoster({ id: eventId, title: eventTitle });
      setParticipants(res.data.participants || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportParticipantsCSV = () => {
    if (!activeEventRoster || participants.length === 0) return;
    let headers = 'Student Name,Roll Number,Email,Phone,Department,Class,Registration Date\n';
    let rows = participants.map((p) =>
      `"${p.full_name}","${p.roll_number}","${p.email}","${p.phone}","${p.department_name}","${p.year} (${p.section})","${new Date(p.registered_at).toLocaleString()}"`
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeEventRoster.title}_Attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);

    try {
      await api.post('/events', {
        title,
        description,
        category,
        venue,
        eventDate,
        eventTime,
        organizer: organizer || user?.full_name,
        maxParticipants,
        posterUrl,
      });

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setVenue('');
      setEventDate('');
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create event');
    } finally {
      setIsPublishing(false);
    }
  };

  const categories = [
    'All',
    'Hackathon',
    'Workshop',
    'Seminar',
    'Symposium',
    'Cultural Event',
    'Sports',
    'Guest Lecture',
    'Placement Event',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <span>Campus Activities & Events</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Discover hackathons, technical symposia, guest lectures, cultural extravaganzas, and 1-click event registration.
          </p>
        </div>

        {(user?.role === 'FACULTY' || user?.role === 'ADMIN') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Publish New Event</span>
          </button>
        )}
      </div>

      {/* Filter and Category Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title, venue..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">Loading campus events...</div>
        ) : events.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs glass-card rounded-3xl p-8">
            No upcoming events matching this category.
          </div>
        ) : (
          events.map((ev) => {
            const isStudent = user?.role === 'STUDENT';
            const isRegistered = ev.is_registered;

            return (
              <div
                key={ev.id}
                className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between hover:border-indigo-300 transition-all shadow-xs group"
              >
                <div>
                  {/* Poster Image */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={ev.poster_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=300&fit=crop'}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="primary" size="sm">
                        {ev.category}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700">
                      {ev.registration_count || 0} / {ev.max_participants} Registered
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-semibold">{ev.event_date} at {ev.event_time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{ev.venue}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] text-slate-500">By {ev.organizer}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  {isStudent ? (
                    isRegistered ? (
                      <div className="w-full py-2.5 bg-emerald-50 text-emerald-800 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Registered Successfully</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRegister(ev.id)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                      >
                        1-Click Register
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleViewParticipants(ev.id, ev.title)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                    >
                      View Attendees ({ev.registration_count || 0})
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Publish Event Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Publish Campus Event" maxWidth="2xl">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. National Hackathon 2026: AI & Web3"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {categories.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Participant Limit</label>
              <input
                type="number"
                min="10"
                max="2000"
                required
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event Date</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event Time</label>
              <input
                type="text"
                required
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="09:00 AM onwards"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Venue / Auditorium</label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Main Auditorium"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Organizing Body</label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="Department Association"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Event Description & Cash Prizes</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event agenda, prize pool details, rules..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Poster Image URL</label>
            <input
              type="url"
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPublishing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50 mt-2"
          >
            {isPublishing ? 'Publishing Event...' : 'Publish Campus Event'}
          </button>
        </form>
      </Modal>

      {/* Participant Roster Modal */}
      {activeEventRoster && (
        <Modal
          isOpen={!!activeEventRoster}
          onClose={() => setActiveEventRoster(null)}
          title={`Registered Attendees — ${activeEventRoster.title}`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Total Registrations: <span className="font-bold text-slate-900">{participants.length}</span>
              </p>
              <button
                onClick={handleExportParticipantsCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV Roster</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Department & Class</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {participants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">No student registrations recorded yet.</td>
                    </tr>
                  ) : (
                    participants.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-indigo-600">{p.roll_number}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{p.full_name}</td>
                        <td className="px-4 py-3">{p.department_name} • {p.year} ({p.section})</td>
                        <td className="px-4 py-3 text-slate-500">{p.email} • {p.phone}</td>
                        <td className="px-4 py-3 text-slate-400">{new Date(p.registered_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
