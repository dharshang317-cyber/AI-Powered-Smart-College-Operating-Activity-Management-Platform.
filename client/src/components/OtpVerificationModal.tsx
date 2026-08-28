import React, { useState, useEffect, useRef } from 'react';
import { Mail, ShieldCheck, Clock, RefreshCw, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';
  collegeName?: string;
  userName?: string;
  onSuccess: (otpCode: string) => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  purpose,
  collegeName,
  userName,
  onSuccess,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s)
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg(null);
      setResendMsg(null);
      setTimeLeft(600);
      // Focus first input box
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [isOpen, email]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => Math.max(t - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    setErrorMsg(null);
    const cleanVal = val.replace(/[^0-9]/g, '');

    // Handle paste of full 6-digit code
    if (cleanVal.length >= 6) {
      const newDigits = cleanVal.slice(0, 6).split('');
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal.slice(-1);
    setDigits(newDigits);

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setErrorMsg(null);
    setResendMsg(null);
    try {
      const res = await api.post('/auth/send-otp', {
        email,
        purpose,
        collegeName,
        userName,
      });
      setResendMsg(res.data.message || 'New OTP sent to your email!');
      setTimeLeft(600);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = digits.join('');
    if (otpCode.length !== 6) {
      setErrorMsg('Please enter the full 6-digit code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      // For registration confirmation check
      if (purpose === 'REGISTRATION') {
        const res = await api.post('/auth/verify-otp', { email, otpCode, purpose });
        if (res.data.success) {
          onSuccess(otpCode);
        }
      } else {
        // Direct callback for login
        onSuccess(otpCode);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Invalid or expired verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Verify Your Email</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            We have sent a 6-digit verification code to <strong className="text-slate-800">{email}</strong>.
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {resendMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold text-center flex items-center justify-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{resendMsg}</span>
          </div>
        )}

        {/* 6 Digit Numeric Inputs */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center space-x-2 sm:space-x-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black rounded-2xl border-2 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-mono"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2">
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Expires in: {formattedTime}</span>
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
              <span>Resend Code</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isVerifying || digits.join('').length !== 6}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{isVerifying ? 'Verifying Code...' : 'Confirm & Proceed'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
