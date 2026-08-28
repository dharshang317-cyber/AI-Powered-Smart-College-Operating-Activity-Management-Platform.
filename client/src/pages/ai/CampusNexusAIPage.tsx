import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Award,
  Layers,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  Code2,
  Atom,
  GraduationCap,
  Briefcase,
  Copy,
  Check,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  generatedQuiz?: any;
  suggestions?: string[];
  contextUsed?: string[];
}

export const CampusNexusAIPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch contextual suggestions
    api.get('/ai/suggestions')
      .then((res) => setSuggestions(res.data.suggestions || []))
      .catch(console.error);

    // Initial greeting based on role
    const greeting =
      user?.role === 'STUDENT'
        ? `Hello ${user?.full_name?.split(' ')[0]}! 🌟 I am **CampusNexus AI**, your omni-domain superintelligent copilot (powered like Gemini, ChatGPT, and Grok)!\n\nI can help you with:\n• **💻 Coding & Algorithms:** Python, JavaScript, React, SQL, DSA & Web Dev\n• **🔬 Science & Math:** Quantum Physics, Calculus, Linear Algebra, Astronomy\n• **🎓 Campus Live Data:** Real-time timetable, subject-wise attendance %, pending quizzes\n• **💼 Career & Life:** Placement prep, resumes, interview tips & mental wellness\n\nWhat would you like to explore today?`
        : user?.role === 'FACULTY'
        ? `Welcome Professor ${user?.full_name?.split(' ')[0]}! 👨‍🏫 I am **CampusNexus AI**.\n\nI can generate 10-question MCQ quizzes with answer keys & explanations, draft course outlines, analyze classroom attendance trends, and explain advanced computing & science concepts.`
        : user?.role === 'CARE_CLUB'
        ? `Welcome Care Club Mentor ${user?.full_name?.split(' ')[0]}! 💖 I can assist with student counseling frameworks, stress-management workshops, empathetic listening strategies, and career mentorship resources.`
        : `Greetings Administrator! 🏛️ I can provide executive activity summaries, track attendance compliance across departments, and deliver omni-domain intelligence across the institution.`;

    setMessages([
      {
        role: 'assistant',
        content: greeting,
      },
    ]);
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const messageToSend = queryText || input;
    if (!messageToSend.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: messageToSend.trim() };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await api.post('/ai/chat', {
        message: messageToSend.trim(),
        history,
      });

      const assistantMsg: Message = {
        role: 'assistant',
        content: res.data.message,
        generatedQuiz: res.data.generatedQuiz,
        suggestions: res.data.suggestions,
        contextUsed: res.data.contextUsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (res.data.suggestions?.length > 0) {
        setSuggestions(res.data.suggestions);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I encountered an issue retrieving AI intelligence. Please verify connectivity.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportQuiz = async (quizData: any) => {
    try {
      const subRes = await api.get('/faculty/my-subjects');
      const firstSub = subRes.data.subjects?.[0];
      if (!firstSub) {
        alert('Please assign a subject before publishing quizzes.');
        return;
      }

      await api.post('/assessments', {
        subjectId: firstSub.id,
        title: quizData.title || 'AI Generated Quiz',
        instructions: 'Complete all multiple choice questions within allocated time limit.',
        durationMinutes: 15,
        questions: quizData.questions,
      });

      alert(`✅ Successfully published "${quizData.title}" directly to your students in ${firstSub.name}!`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to import quiz');
    }
  };

  const handleCopyContent = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation history cleared. How can I help you today?',
      },
    ]);
  };

  const topicChips = [
    { label: 'Explain Quantum Computing', icon: Atom, query: 'Explain how Quantum Computing works and why it is revolutionary' },
    { label: 'Binary Search (Python)', icon: Code2, query: 'Write a Python implementation of Binary Search with time complexity' },
    { label: 'Campus Schedule & Classes', icon: GraduationCap, query: 'What are my classes scheduled for today?' },
    { label: 'Placement Interview Tips', icon: Briefcase, query: 'Give me proven strategies to crack campus placement interviews' },
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-indigo-200 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">CampusNexus AI</h2>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                Omni Intelligence Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Multi-domain AI (Coding, Science, Math, World Knowledge & Live Campus Data)
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs flex items-center space-x-1"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Domain Quick Launchers */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        {topicChips.map((chip, idx) => {
          const Icon = chip.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSend(chip.query)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-xl font-bold text-slate-700 text-xs transition-all shrink-0"
            >
              <Icon className="w-3.5 h-3.5 text-indigo-600" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 glass-card rounded-3xl shadow-xs">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-3xl p-4 sm:p-5 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-2xs space-y-3 relative group ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none'
                }`}
              >
                {!isUser && (
                  <button
                    onClick={() => handleCopyContent(m.content, idx)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy to Clipboard"
                  >
                    {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}

                <div className="whitespace-pre-line prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed">
                  {m.content}
                </div>

                {/* If AI Generated a Quiz for Faculty -> 1-Click Publish Button */}
                {m.generatedQuiz && (user?.role === 'FACULTY' || user?.role === 'ADMIN') && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>{m.generatedQuiz.questions?.length || 10} MCQs Ready for Publishing</span>
                    </div>

                    <button
                      onClick={() => handleImportQuiz(m.generatedQuiz)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                    >
                      Import & Publish Test
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-3xl rounded-tl-none text-xs text-slate-500 flex items-center space-x-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-100" />
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce delay-200" />
              <span className="font-semibold text-slate-600 ml-1">Thinking & synthesizing answer...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {suggestions.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto py-1 px-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center space-x-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Suggested:</span>
          </span>
          {suggestions.map((sug, sIdx) => (
            <button
              key={sIdx}
              onClick={() => handleSend(sug)}
              className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-full text-xs font-semibold text-slate-700 whitespace-nowrap transition-colors shadow-2xs"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask anything — programming, quantum physics, career coaching, timetable, or assessments...`}
          className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-medium"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-2xl font-bold disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
