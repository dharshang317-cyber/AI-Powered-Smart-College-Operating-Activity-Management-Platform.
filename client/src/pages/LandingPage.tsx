import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Building,
  Users,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  KeyRound,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { OtpVerificationModal } from '../components/OtpVerificationModal';

export const LandingPage: React.FC = () => {
  const { login, loginWithToken } = useAuth();

  // Active Main Tabs: 'LOGIN' | 'REGISTER'
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Role Tab Selection: 'STUDENT' | 'FACULTY' | 'CARE_CLUB' | 'ADMIN'
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'FACULTY' | 'CARE_CLUB' | 'ADMIN'>('STUDENT');

  // Login Method: 'PASSWORD' | 'OTP'
  const [loginMethod, setLoginMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');

  // Login Inputs
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or Phone
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // College & Department Directory for Registration
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');

  // Registration Form Fields
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartmentId, setRegDepartmentId] = useState('');
  
  // Student Specific
  const [regCourse, setRegCourse] = useState('B.Sc Information Technology');
  const [regYear, setRegYear] = useState('I Year');
  const [regSection, setRegSection] = useState('Section A');
  const [regRollNumber, setRegRollNumber] = useState('');

  // Faculty Specific
  const [regDesignation, setRegDesignation] = useState('Assistant Professor');
  const [regQualification, setRegQualification] = useState('M.Sc., M.Phil.');
  const [regSpecialization, setRegSpecialization] = useState('');

  // Campus Care Club Specific
  const [regCareDesignation, setRegCareDesignation] = useState('Student Wellness & Guidance Mentor');
  const [regCareQualification, setRegCareQualification] = useState('M.Sc. Psychology / Certified Counselor');
  const [regCareSpecialization, setRegCareSpecialization] = useState('Student Guidance, Exam Stress & Career Mentorship');
  const [regCareBio, setRegCareBio] = useState('Dedicated to supporting students with academic guidance, mental wellness, and confidential personal advice.');
  const [regCareHours, setRegCareHours] = useState('Mon - Fri: 10:00 AM - 5:00 PM');

  // Admin College Creation Specific
  const [regCollegeName, setRegCollegeName] = useState('');
  const [regCollegeAddress, setRegCollegeAddress] = useState('');
  const [regCollegePhone, setRegCollegePhone] = useState('');
  const [regCollegeType, setRegCollegeType] = useState('Arts & Science');
  const [regCollegeWebsite, setRegCollegeWebsite] = useState('');

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<'REGISTRATION' | 'LOGIN'>('REGISTRATION');
  const [pendingOtpEmail, setPendingOtpEmail] = useState('');
  const [verifiedOtpCode, setVerifiedOtpCode] = useState<string | null>(null);

  // Fetch Public College List
  useEffect(() => {
    api.get('/auth/colleges')
      .then((res) => {
        const list = res.data.colleges || [];
        setColleges(list);
        if (list.length > 0 && !selectedCollegeId) {
          setSelectedCollegeId(list[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch Departments when selected college changes
  useEffect(() => {
    if (!selectedCollegeId) return;
    api.get(`/auth/departments/${selectedCollegeId}`)
      .then((res) => {
        const list = res.data.departments || [];
        setDepartments(list);
        if (list.length > 0) {
          setRegDepartmentId(list[0].id);
        }
      })
      .catch(console.error);
  }, [selectedCollegeId]);

  // Standard Password / Phone Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await login(loginIdentifier.trim(), loginPassword, selectedRole);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Login failed. Please check your email/phone and password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Email OTP Login Flow
  const handleInitiateOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.includes('@')) {
      setErrorMessage('Please enter a valid email address to receive your login OTP code.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await api.post('/auth/send-otp', {
        email: loginIdentifier.trim().toLowerCase(),
        purpose: 'LOGIN',
      });
      setPendingOtpEmail(loginIdentifier.trim().toLowerCase());
      setOtpPurpose('LOGIN');
      setShowOtpModal(true);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to dispatch login OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify OTP Login completion
  const handleCompleteOtpLogin = async (otpCode: string) => {
    setShowOtpModal(false);
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/login-otp', {
        email: pendingOtpEmail,
        otpCode,
      });
      loginWithToken(res.data.token, res.data.user);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'OTP Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const GOOGLE_CLIENT_ID = '375579646660-tccankpn2rkq8o66dr909rm297kntsj1.apps.googleusercontent.com';

  // Initialize Google Identity Services
  useEffect(() => {
    const initGoogle = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: any) => {
              if (response.credential) {
                handleGoogleCallback(response.credential);
              }
            },
          });
          const btnDiv = document.getElementById('google-signin-btn-container');
          if (btnDiv) {
            (window as any).google.accounts.id.renderButton(btnDiv, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
              shape: 'pill',
            });
          }
        } catch (err) {
          console.error('Google Sign In initialization error:', err);
        }
      }
    };

    // Retry initialization if script is still loading
    const timer = setTimeout(initGoogle, 500);
    return () => clearTimeout(timer);
  }, [authMode]);

  // Google Credential Verification Handler
  const handleGoogleCallback = async (credential: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/auth/google-login', { credential });
      if (res.data.isNewUser) {
        setSuccessMessage('Google identity verified! Please complete your department and college details below.');
        setAuthMode('REGISTER');
        setRegEmail(res.data.profile.email);
        setRegFullName(res.data.profile.name);
      } else {
        loginWithToken(res.data.token, res.data.user);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.response?.data?.error || 'Google login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignInClick = () => {
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    } else {
      setErrorMessage('Google Sign-In is initializing. Please wait a moment.');
    }
  };

  // Registration Initiation with OTP Check
  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // If OTP not yet verified, dispatch OTP
    if (!verifiedOtpCode) {
      setIsSubmitting(true);
      try {
        await api.post('/auth/send-otp', {
          email: regEmail.trim().toLowerCase(),
          purpose: 'REGISTRATION',
          userName: regFullName,
        });
        setPendingOtpEmail(regEmail.trim().toLowerCase());
        setOtpPurpose('REGISTRATION');
        setShowOtpModal(true);
      } catch (err: any) {
        setErrorMessage(err.response?.data?.error || 'Failed to send registration verification code');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // OTP is already verified -> Finalize registration
    finalizeRegistration(verifiedOtpCode);
  };

  const finalizeRegistration = async (otpCode: string) => {
    setIsSubmitting(true);
    try {
      if (selectedRole === 'ADMIN') {
        const res = await api.post('/auth/register-admin', {
          adminName: regFullName,
          collegeName: regCollegeName,
          collegeEmail: regEmail,
          collegePhone: regPhone,
          collegeAddress: regCollegeAddress,
          collegeType: regCollegeType,
          collegeWebsite: regCollegeWebsite,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          otpCode,
        });
        loginWithToken(res.data.token, res.data.user);
      } else if (selectedRole === 'FACULTY') {
        const res = await api.post('/auth/register-faculty', {
          collegeId: selectedCollegeId,
          departmentId: regDepartmentId,
          fullName: regFullName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          designation: regDesignation,
          qualification: regQualification,
          specialization: regSpecialization,
          otpCode,
        });
        setSuccessMessage(res.data.message || 'Faculty registration submitted! Waiting for Administrator verification.');
        setAuthMode('LOGIN');
        setVerifiedOtpCode(null);
      } else if (selectedRole === 'CARE_CLUB') {
        const res = await api.post('/auth/register-care-club', {
          collegeId: selectedCollegeId,
          fullName: regFullName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          designation: regCareDesignation,
          qualification: regCareQualification,
          specialization: regCareSpecialization,
          bio: regCareBio,
          availableHours: regCareHours,
          otpCode,
        });
        setSuccessMessage(res.data.message || 'Campus Care Club registration submitted successfully! Your account is pending Administrator approval before activation.');
        setAuthMode('LOGIN');
        setVerifiedOtpCode(null);
      } else {
        const res = await api.post('/auth/register-student', {
          collegeId: selectedCollegeId,
          departmentId: regDepartmentId,
          fullName: regFullName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          course: regCourse,
          year: regYear,
          section: regSection,
          rollNumber: regRollNumber,
          otpCode,
        });
        setSuccessMessage(res.data.message || 'Student registration submitted! Waiting for Administrator verification.');
        setAuthMode('LOGIN');
        setVerifiedOtpCode(null);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerified = (otpCode: string) => {
    setShowOtpModal(false);
    if (otpPurpose === 'LOGIN') {
      handleCompleteOtpLogin(otpCode);
    } else {
      setVerifiedOtpCode(otpCode);
      finalizeRegistration(otpCode);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Mesh Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-600/30">
            CN
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-black text-white tracking-tight">CampusNexus AI</h1>
              <span className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                Operating System
              </span>
            </div>
            <p className="text-[11px] text-slate-400">One Campus. One Platform. Every Activity Connected.</p>
          </div>
        </div>

        {/* Portal Status Badge */}
        <div className="flex items-center space-x-2 bg-slate-900/90 px-3 py-1.5 rounded-2xl border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-slate-300 font-semibold">Institutional Portal Live</span>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Hero Content */}
        <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI-Powered Smart Campus Platform</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            The Complete Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">Arts & Science Colleges</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto lg:mx-0">
            Full academic management for Faculty, cross-department student guidance through **Campus Care Club**, smart classrooms, and an omni-capable AI copilot.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl text-center">
              <p className="text-xl font-black text-indigo-400">100%</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Faculty Power</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl text-center">
              <p className="text-xl font-black text-rose-400">Care Club</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">1-on-1 Guidance</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl text-center">
              <p className="text-xl font-black text-purple-400">24/7 AI</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Omni Copilot</p>
            </div>
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="lg:col-span-7 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6">
          {/* Main Auth Mode Switcher: Sign In vs Create Account */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => { setAuthMode('LOGIN'); setErrorMessage(null); }}
              className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                authMode === 'LOGIN'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In to Campus
            </button>

            <button
              onClick={() => { setAuthMode('REGISTER'); setErrorMessage(null); }}
              className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                authMode === 'REGISTER'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register New Account
            </button>
          </div>

          {/* Role Selector Tabs (4 Roles) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Your College Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('STUDENT')}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                  selectedRole === 'STUDENT'
                    ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-bold ring-2 ring-indigo-600/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span className="text-[11px]">Student</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('FACULTY')}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                  selectedRole === 'FACULTY'
                    ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-bold ring-2 ring-indigo-600/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px]">Faculty</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('CARE_CLUB')}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                  selectedRole === 'CARE_CLUB'
                    ? 'bg-rose-50/80 border-rose-600 text-rose-950 font-bold ring-2 ring-rose-600/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-rose-600" />
                <span className="text-[11px]">Care Club</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('ADMIN')}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                  selectedRole === 'ADMIN'
                    ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-bold ring-2 ring-indigo-600/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span className="text-[11px]">Admin</span>
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 text-rose-900 border border-rose-200 rounded-2xl text-xs font-semibold flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: SIGN IN */}
          {authMode === 'LOGIN' && (
            <div className="space-y-4">
              {/* Google Sign In Button */}
              <div id="google-signin-btn-container" className="w-full flex justify-center min-h-[44px]">
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-2xl border border-slate-200 text-xs transition-all flex items-center justify-center space-x-2 shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google Account</span>
                </button>
              </div>

              <div className="flex items-center space-x-3 my-2">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-[10px] text-slate-400 font-bold uppercase">Or Log In With</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Login Method Toggle: Password vs Email OTP */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setLoginMethod('PASSWORD')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    loginMethod === 'PASSWORD'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Password (Email/Phone)
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('OTP')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    loginMethod === 'OTP'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Email 6-Digit OTP
                </button>
              </div>

              {/* Password Login Form */}
              {loginMethod === 'PASSWORD' ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address or Mobile Phone
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. yourname@campusnexus.edu or +91 98400..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Account Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Signing In...' : `Sign In as ${selectedRole}`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Email OTP Login Form */
                <form onSubmit={handleInitiateOtpLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered College Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. student@campusnexus.edu"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">We will send an instant 6-digit login passcode to your email inbox.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Dispatching OTP...' : 'Send Login OTP Code'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* MODE 2: REGISTRATION */}
          {authMode === 'REGISTER' && (
            <form onSubmit={handleInitiateRegistration} className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {/* If registering as Student/Faculty -> Select College */}
              {selectedRole !== 'ADMIN' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select College</label>
                  <select
                    required
                    value={selectedCollegeId}
                    onChange={(e) => setSelectedCollegeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Administrator First-Time College Setup Fields */}
              {selectedRole === 'ADMIN' && (
                <div className="space-y-3 p-4 bg-purple-50/60 rounded-2xl border border-purple-200/80">
                  <h4 className="text-xs font-bold text-purple-950 flex items-center space-x-1.5">
                    <Building className="w-4 h-4 text-purple-600" />
                    <span>New College Workspace Setup</span>
                  </h4>

                  <input
                    type="text"
                    required
                    value={regCollegeName}
                    onChange={(e) => setRegCollegeName(e.target.value)}
                    placeholder="Official College Name (e.g. Apex Arts & Science College)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={regCollegePhone}
                      onChange={(e) => setRegCollegePhone(e.target.value)}
                      placeholder="College Phone"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={regCollegeAddress}
                      onChange={(e) => setRegCollegeAddress(e.target.value)}
                      placeholder="Campus Address"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh or Ananya S"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Academic Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="yourname@campusnexus.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Create Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              {/* Student Role Fields */}
              {selectedRole === 'STUDENT' && (
                <div className="space-y-3 p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Department</label>
                      <select
                        value={regDepartmentId}
                        onChange={(e) => setRegDepartmentId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Roll Number</label>
                      <input
                        type="text"
                        required
                        value={regRollNumber}
                        onChange={(e) => setRegRollNumber(e.target.value)}
                        placeholder="e.g. 26IT104"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Academic Year</label>
                      <select
                        value={regYear}
                        onChange={(e) => setRegYear(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                      >
                        <option value="I Year">I Year</option>
                        <option value="II Year">II Year</option>
                        <option value="III Year">III Year</option>
                        <option value="IV Year">IV Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Section</label>
                      <select
                        value={regSection}
                        onChange={(e) => setRegSection(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                      >
                        <option value="Section A">Section A</option>
                        <option value="Section B">Section B</option>
                        <option value="Section C">Section C</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Faculty Role Fields */}
              {selectedRole === 'FACULTY' && (
                <div className="space-y-3 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Department</label>
                      <select
                        value={regDepartmentId}
                        onChange={(e) => setRegDepartmentId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Designation</label>
                      <input
                        type="text"
                        value={regDesignation}
                        onChange={(e) => setRegDesignation(e.target.value)}
                        placeholder="Assistant Professor"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={regSpecialization}
                    onChange={(e) => setRegSpecialization(e.target.value)}
                    placeholder="Specialization (e.g. Data Structures & Cloud Computing)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
              )}

              {/* Campus Care Club Role Fields */}
              {selectedRole === 'CARE_CLUB' && (
                <div className="space-y-3 p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/80">
                  <div className="flex items-center space-x-2 text-rose-900 font-bold text-xs mb-1">
                    <HeartHandshake className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Campus Care Club Guidance Profile</span>
                  </div>
                  <p className="text-[11px] text-rose-700/90 leading-tight">
                    Care Club mentors are visible to all students across every department for confidential 1-on-1 advice. (Requires Admin Verification)
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Role / Designation</label>
                      <input
                        type="text"
                        required
                        value={regCareDesignation}
                        onChange={(e) => setRegCareDesignation(e.target.value)}
                        placeholder="e.g. Student Wellness Counselor"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Qualification</label>
                      <input
                        type="text"
                        required
                        value={regCareQualification}
                        onChange={(e) => setRegCareQualification(e.target.value)}
                        placeholder="e.g. M.Sc. Psychology"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Guidance Specialization</label>
                    <input
                      type="text"
                      required
                      value={regCareSpecialization}
                      onChange={(e) => setRegCareSpecialization(e.target.value)}
                      placeholder="e.g. Exam Anxiety, Career Planning, Academic Mentorship"
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Available Hours</label>
                      <input
                        type="text"
                        required
                        value={regCareHours}
                        onChange={(e) => setRegCareHours(e.target.value)}
                        placeholder="Mon - Fri: 10:00 AM - 5:00 PM"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Bio / Approach</label>
                      <input
                        type="text"
                        required
                        value={regCareBio}
                        onChange={(e) => setRegCareBio(e.target.value)}
                        placeholder="Short intro on how you help students"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Verifying Email...' : 'Verify Email & Submit Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Email OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={pendingOtpEmail}
        purpose={otpPurpose}
        collegeName="CampusNexus AI"
        userName={regFullName}
        onSuccess={handleOtpVerified}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/40 backdrop-blur-md py-4 px-8 text-center text-xs text-slate-400">
        <p className="font-bold text-slate-300">
          © 2026 | Developed by <span className="text-indigo-400 font-extrabold">Dharshan G</span>
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">CampusNexus AI — Next-Generation College Activity Operating System</p>
      </footer>
    </div>
  );
};
