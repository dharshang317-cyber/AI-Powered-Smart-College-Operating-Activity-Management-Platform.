import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, Search, CheckCheck } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import { Badge } from '../../components/Badge';

export const MessagingHub: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/communication/contacts')
      .then((res) => {
        const list = res.data.contacts || [];
        setContacts(list);
        if (list.length > 0) setActiveContact(list[0]);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const fetchMessages = async (contactId: string) => {
    try {
      const res = await api.get(`/communication/messages/${contactId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact.id);
    }
  }, [activeContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time socket listener for incoming direct messages
  useEffect(() => {
    const socket = getSocket();
    const handleIncoming = (msg: any) => {
      if (activeContact && (msg.sender_id === activeContact.id || msg.receiver_id === activeContact.id)) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('new_direct_message', handleIncoming);
    return () => {
      socket.off('new_direct_message', handleIncoming);
    };
  }, [activeContact]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeContact) return;

    const messageText = text.trim();
    setText('');

    try {
      const res = await api.post(`/communication/messages/${activeContact.id}`, { messageText });
      setMessages((prev) => [...prev, res.data.data]);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.department_name && c.department_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <MessageSquare className="w-6 h-6 text-indigo-600" />
          <span>Academic Messaging & Advising Hub</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Controlled direct communication between students and approved departmental faculty members.
        </p>
      </div>

      {/* Messaging Shell */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-3 h-[600px]">
        {/* Left Contacts Roster */}
        <div className="border-r border-slate-100 flex flex-col h-full bg-slate-50/50">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search faculty or students..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading contacts...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No contacts found in your department.</div>
            ) : (
              filteredContacts.map((c) => {
                const isSelected = activeContact?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveContact(c)}
                    className={`p-3.5 flex items-center space-x-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-100/60'
                    }`}
                  >
                    <img
                      src={c.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                      alt={c.full_name}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900 text-xs truncate">{c.full_name}</p>
                        <span className="text-[10px] text-indigo-600 font-semibold">{c.role}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {c.department_name || c.designation || 'Academic Contact'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Conversation Area */}
        <div className="md:col-span-2 flex flex-col h-full bg-white">
          {activeContact ? (
            <>
              {/* Top Contact Bar */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center space-x-3">
                  <img
                    src={activeContact.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                    alt={activeContact.full_name}
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{activeContact.full_name}</h4>
                    <p className="text-[11px] text-slate-400">
                      {activeContact.department_name} • {activeContact.designation || activeContact.roll_number || activeContact.role}
                    </p>
                  </div>
                </div>

                <Badge variant="primary" size="sm">
                  {activeContact.role}
                </Badge>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20">
                {messages.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 text-xs">
                    No prior messages. Send a note to start the conversation.
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          <p>{m.message_text}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 px-1">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex items-center space-x-2 bg-white">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Write a message to ${activeContact.full_name}...`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-40 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select a contact to begin advising conversation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
