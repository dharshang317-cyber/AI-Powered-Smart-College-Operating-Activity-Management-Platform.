import React, { useState, useEffect } from 'react';
import { Award, Plus, Clock, FileText, CheckCircle2, AlertCircle, Sparkles, BarChart3 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

interface AssessmentsPageProps {
  onNavigate: (path: string) => void;
}

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Manual & AI Quiz Creator Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [instructions, setInstructions] = useState('Answer all multiple choice questions. Each question carries 1 mark.');
  const [questions, setQuestions] = useState<any[]>([
    {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'A',
      marks: 1,
      explanation: '',
    },
  ]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAssessments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/assessments');
      setAssessments(res.data.assessments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
    if (user?.role === 'FACULTY' || user?.role === 'ADMIN') {
      api.get('/faculty/my-subjects').then((res) => {
        const list = res.data.subjects || [];
        setSubjects(list);
        if (list.length > 0 && !subjectId) setSubjectId(list[0].id);
      });
    }
  }, []);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        marks: 1,
        explanation: '',
      },
    ]);
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleGenerateAIQuestions = async () => {
    if (!aiPrompt) return;
    setIsGeneratingAI(true);
    try {
      const res = await api.post('/ai/generate-quiz', { topic: aiPrompt });
      if (res.data.generatedQuiz?.questions) {
        setQuestions(res.data.generatedQuiz.questions);
        if (!title) setTitle(`Quiz: ${aiPrompt}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !title || questions.length === 0) return;
    setIsSaving(true);

    try {
      await api.post('/assessments', {
        subjectId,
        title,
        instructions,
        durationMinutes,
        questions,
      });

      setShowCreateModal(false);
      setTitle('');
      fetchAssessments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create assessment');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Award className="w-6 h-6 text-indigo-600" />
            <span>Online Assessment & Quiz Engine</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Timed objective assessments with instant automatic evaluation, question rationale, and academic analytics.
          </p>
        </div>

        {(user?.role === 'FACULTY' || user?.role === 'ADMIN') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assessment</span>
          </button>
        )}
      </div>

      {/* Assessment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">Loading active assessments...</div>
        ) : assessments.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs glass-card rounded-3xl p-8">
            No online assessments scheduled at this moment.
          </div>
        ) : (
          assessments.map((a) => {
            const isStudent = user?.role === 'STUDENT';
            const isSubmitted = a.isSubmitted;

            return (
              <div
                key={a.id}
                className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                      {a.subject_code || 'IT301'}
                    </span>
                    <Badge variant={isSubmitted ? 'success' : 'primary'} size="sm">
                      {isSubmitted ? 'Submitted' : `${a.duration_minutes} Mins`}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2 leading-tight">
                    {a.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {a.subject_name} • Faculty: {a.faculty_name}
                  </p>

                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Questions</p>
                      <p className="text-sm font-bold text-slate-800">{a.question_count || 10} MCQs</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Max Marks</p>
                      <p className="text-sm font-bold text-slate-800">{a.total_marks} Marks</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100">
                  {isStudent ? (
                    isSubmitted ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          Score: {a.submission?.score}/{a.submission?.total_marks} ({a.submission?.percentage}%)
                        </span>
                        <button
                          onClick={() => onNavigate(`/assessments/take/${a.id}`)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                        >
                          Review Key →
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onNavigate(`/assessments/take/${a.id}`)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center space-x-1.5"
                      >
                        <Award className="w-4 h-4" />
                        <span>Start Timed Test</span>
                      </button>
                    )
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        {a.total_submissions || 0} Submissions
                      </span>
                      <button
                        onClick={() => onNavigate(`/assessments/analytics/${a.id}`)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Analytics</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Assessment Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Online Assessment" maxWidth="4xl">
        <form onSubmit={handleCreateAssessment} className="space-y-6">
          {/* AI Generator Header Box */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-indigo-950">1-Click AI MCQ Question Generator</h4>
                <p className="text-[11px] text-indigo-700">Enter a topic to generate 10 structured questions with answer keys instantly.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. React Hooks or Database Sharding"
                className="px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 sm:w-64"
              />
              <button
                type="button"
                onClick={handleGenerateAIQuestions}
                disabled={isGeneratingAI || !aiPrompt}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {isGeneratingAI ? 'Generating...' : 'Auto-Generate'}
              </button>
            </div>
          </div>

          {/* Test Meta Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Web Technology Mid-Term Online Test"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                max="180"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions for Students</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-900">Questions ({questions.length})</h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
              >
                + Add Question
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div key={qIdx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-600">Question {qIdx + 1}</span>
                  <div className="flex items-center space-x-2">
                    <label className="text-[11px] font-semibold text-slate-500">Correct Option:</label>
                    <select
                      value={q.correct_option || 'A'}
                      onChange={(e) => handleQuestionChange(qIdx, 'correct_option', e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-emerald-700"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                </div>

                <input
                  type="text"
                  required
                  value={q.question_text}
                  onChange={(e) => handleQuestionChange(qIdx, 'question_text', e.target.value)}
                  placeholder="Enter question statement..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={q.option_a}
                    onChange={(e) => handleQuestionChange(qIdx, 'option_a', e.target.value)}
                    placeholder="Option A"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={q.option_b}
                    onChange={(e) => handleQuestionChange(qIdx, 'option_b', e.target.value)}
                    placeholder="Option B"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={q.option_c}
                    onChange={(e) => handleQuestionChange(qIdx, 'option_c', e.target.value)}
                    placeholder="Option C"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={q.option_d}
                    onChange={(e) => handleQuestionChange(qIdx, 'option_d', e.target.value)}
                    placeholder="Option D"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                  />
                </div>

                <input
                  type="text"
                  value={q.explanation || ''}
                  onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                  placeholder="Explanation / Rationale for answer key (optional)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-500"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50"
          >
            {isSaving ? 'Publishing Online Test...' : 'Publish Assessment to Students'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
