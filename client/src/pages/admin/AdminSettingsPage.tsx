import React, { useState, useEffect } from 'react';
import { Settings, Save, Building, ShieldCheck, Sliders, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AdminSettingsPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [college, setCollege] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [goodThreshold, setGoodThreshold] = useState(75.0);
  const [warningThreshold, setWarningThreshold] = useState(70.0);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [currentSemester, setCurrentSemester] = useState('Odd');
  const [allowMessaging, setAllowMessaging] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [collegeName, setCollegeName] = useState('');
  const [collegeAddress, setCollegeAddress] = useState('');
  const [collegePhone, setCollegePhone] = useState('');
  const [collegeWebsite, setCollegeWebsite] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      const s = res.data.settings || {};
      const c = res.data.college || {};
      setSettings(s);
      setCollege(c);
      setGoodThreshold(s.attendance_threshold_good || 75.0);
      setWarningThreshold(s.attendance_threshold_warning || 70.0);
      setAcademicYear(s.academic_year || '2026-2027');
      setCurrentSemester(s.current_semester || 'Odd');
      setAllowMessaging(s.allow_student_messaging === 1);
      setAiEnabled(s.ai_enabled === 1);
      setCollegeName(c.name || '');
      setCollegeAddress(c.address || '');
      setCollegePhone(c.phone || '');
      setCollegeWebsite(c.website || '');
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/admin/settings', {
        attendanceThresholdGood: Number(goodThreshold),
        attendanceThresholdWarning: Number(warningThreshold),
        academicYear,
        currentSemester,
        allowStudentMessaging: allowMessaging ? 1 : 0,
        aiEnabled: aiEnabled ? 1 : 0,
        collegeName,
        address: collegeAddress,
        phone: collegePhone,
        website: collegeWebsite,
      });
      setFeedback('College policies and workspace settings saved successfully!');
      await refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400 text-xs">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          <span>College Policy & System Settings</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure campus attendance thresholds, academic calendar periods, communication rules, and AI integration.
        </p>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Attendance Policy Engine */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Compliance Thresholds</h3>
              <p className="text-[11px] text-slate-500">Configures automated alerts and eligibility status calculations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Good Standing Minimum Threshold (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="50"
                max="100"
                required
                value={goodThreshold}
                onChange={(e) => setGoodThreshold(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Default: 75.0% (Mandatory standard for semester eligibility)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Critical Warning Threshold (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="40"
                max="90"
                required
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Default: 70.0% (Triggers advisory warnings to students and faculty)</p>
            </div>
          </div>
        </div>

        {/* Section 2: Academic Period */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Year & Session</h3>
              <p className="text-[11px] text-slate-500">Active university academic cycle</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026-2027"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Semester Cycle</label>
              <select
                value={currentSemester}
                onChange={(e) => setCurrentSemester(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Odd">Odd Semester (Sem V / III / I)</option>
                <option value="Even">Even Semester (Sem VI / IV / II)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: College Profile Details */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">College Workspace Information</h3>
              <p className="text-[11px] text-slate-500">Official college identity and contact info</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">College Name</label>
              <input
                type="text"
                required
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Phone</label>
                <input
                  type="text"
                  value={collegePhone}
                  onChange={(e) => setCollegePhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
                <input
                  type="url"
                  value={collegeWebsite}
                  onChange={(e) => setCollegeWebsite(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Address</label>
              <input
                type="text"
                value={collegeAddress}
                onChange={(e) => setCollegeAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: System Features & AI Toggle */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Copilot & Communication Toggles</h3>
              <p className="text-[11px] text-slate-500">Enable automated AI query handling and direct messaging</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">Enable CampusNexus AI Copilot</p>
                <p className="text-[11px] text-slate-500">Empowers students, faculty, and administrators with role-tailored AI assistance</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowMessaging}
                onChange={(e) => setAllowMessaging(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">Enable Student-Faculty Direct Messaging</p>
                <p className="text-[11px] text-slate-500">Allows department-restricted 1-on-1 academic messaging</p>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Configurations...' : 'Save College Settings'}</span>
        </button>
      </form>
    </div>
  );
};
