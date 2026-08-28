import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, Award, ArrowLeft, ArrowRight, Sparkles, Check, X } from 'lucide-react';
import api from '../../services/api';
import confetti from 'canvas-confetti';
import { Badge } from '../../components/Badge';

interface AssessmentTestRoomProps {
  assessmentId: string;
  onBack: () => void;
}

export const AssessmentTestRoom: React.FC<AssessmentTestRoomProps> = ({
  assessmentId,
  onBack,
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Live Test State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Evaluated Result State
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api.get(`/assessments/${assessmentId}`)
      .then((res) => {
        setData(res.data);
        if (res.data.submission) {
          setResult(res.data.submission);
        } else {
          setTimeLeftSeconds((res.data.assessment?.duration_minutes || 15) * 60);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [assessmentId]);

  // Live Timer Countdown
  useEffect(() => {
    if (result || timeLeftSeconds <= 0 || !data || data.submission) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds, result, data]);

  const handleSelectOption = (questionNumber: number, option: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionNumber]: option }));
  };

  const handleSubmitTest = async () => {
    if (isSubmitting || result) return;
    setIsSubmitting(true);

    try {
      const res = await api.post(`/assessments/${assessmentId}/submit`, {
        answers,
        timeTakenSeconds: ((data?.assessment?.duration_minutes || 15) * 60) - timeLeftSeconds,
      });

      setResult(res.data.result);

      // Trigger Celebration Confetti!
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Ignored in test environment
      }

      // Re-fetch assessment to get full answer keys & rationale
      const fullRes = await api.get(`/assessments/${assessmentId}`);
      setData(fullRes.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit test');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400 text-xs">Loading assessment environment...</div>;
  }

  const assessment = data?.assessment || {};
  const questions = data?.questions || [];
  const currentQuestion = questions[currentIndex] || {};

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assessments</span>
        </button>

        {!result && (
          <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-2xl text-indigo-900 font-extrabold text-sm shadow-xs">
            <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>Time Left: {formattedTime}</span>
          </div>
        )}
      </div>

      {/* RESULT REVIEW BANNER */}
      {result && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Assessment Completed & Auto-Graded</span>
            </div>
            <h3 className="text-2xl font-black">{assessment.title}</h3>
            <p className="text-xs text-emerald-100">Review your question performance, correct answers, and rationale below.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20 min-w-[140px]">
            <p className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">Your Score</p>
            <p className="text-3xl font-black mt-0.5">{result.score} / {result.total_marks || assessment.total_marks}</p>
            <p className="text-xs font-bold text-emerald-200 mt-1">{result.percentage}% Accuracy</p>
          </div>
        </div>
      )}

      {/* Main Test Layout: Question Area + Question Navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Panel */}
        <div className="lg:col-span-2 glass-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-xs flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {currentQuestion.marks || 1} Mark
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-4 leading-relaxed">
              {currentQuestion.question_text}
            </h3>

            {/* Options List */}
            <div className="mt-6 space-y-3">
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const optText = currentQuestion[`option_${optKey.toLowerCase()}`];
                const isSelected = answers[currentQuestion.question_number] === optKey;
                const isCorrect = currentQuestion.correct_option === optKey;

                let optionStyle = 'bg-slate-50 hover:bg-indigo-50/50 border-slate-200 text-slate-800';
                if (result) {
                  if (isCorrect) {
                    optionStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold ring-1 ring-emerald-400';
                  } else if (isSelected && !isCorrect) {
                    optionStyle = 'bg-rose-50 border-rose-300 text-rose-950 font-bold';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold ring-2 ring-indigo-500';
                }

                return (
                  <div
                    key={optKey}
                    onClick={() => handleSelectOption(currentQuestion.question_number, optKey)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm ${optionStyle}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-slate-700 shadow-2xs">
                        {optKey}
                      </span>
                      <span>{optText}</span>
                    </div>

                    {result && isCorrect && (
                      <span className="flex items-center space-x-1 text-emerald-600 text-xs font-extrabold">
                        <Check className="w-4 h-4" />
                        <span>Correct</span>
                      </span>
                    )}

                    {result && isSelected && !isCorrect && (
                      <span className="flex items-center space-x-1 text-rose-600 text-xs font-extrabold">
                        <X className="w-4 h-4" />
                        <span>Your Choice</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation box during review mode */}
            {result && currentQuestion.explanation && (
              <div className="mt-5 p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-950 leading-relaxed">
                <p className="font-bold text-amber-900">Rationale & Explanation:</p>
                <p className="mt-1 text-amber-800">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors disabled:opacity-30"
            >
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Next Question →
              </button>
            ) : !result ? (
              <button
                onClick={handleSubmitTest}
                disabled={isSubmitting}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Evaluating...' : 'Submit Assessment'}
              </button>
            ) : (
              <button
                onClick={onBack}
                className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs"
              >
                Finish Review
              </button>
            )}
          </div>
        </div>

        {/* Question Navigation Matrix */}
        <div className="glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Question Matrix</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {answeredCount} of {questions.length} questions answered
            </p>

            <div className="grid grid-cols-5 gap-2 mt-4">
              {questions.map((q: any, idx: number) => {
                const isAns = !!answers[q.question_number];
                const isCurr = idx === currentIndex;

                let matrixColor = 'bg-slate-100 text-slate-600 border-slate-200';
                if (result) {
                  const subAns = (result.answers_json ? JSON.parse(result.answers_json) : answers)[q.question_number];
                  const isCorrect = subAns === q.correct_option;
                  matrixColor = isCorrect
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-rose-500 text-white border-rose-600';
                } else if (isAns) {
                  matrixColor = 'bg-indigo-600 text-white border-indigo-700';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl font-bold text-xs border transition-all ${matrixColor} ${
                      isCurr ? 'ring-2 ring-indigo-400 ring-offset-2 scale-105' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {!result && (
            <button
              onClick={handleSubmitTest}
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50 mt-4"
            >
              {isSubmitting ? 'Evaluating...' : `Submit Test (${answeredCount}/${questions.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
