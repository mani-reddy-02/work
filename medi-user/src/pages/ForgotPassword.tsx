import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Phone,
  RefreshCw,
  ShieldCheck,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" className={className} fill="currentColor">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2M12.05 20.15C10.57 20.15 9.12 19.75 7.85 19L7.55 18.82L4.43 19.64L5.26 16.59L5.06 16.27C4.24 14.97 3.8 13.46 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.05 20.15M16.57 14.39C16.32 14.26 15.1 13.66 14.87 13.58C14.65 13.5 14.48 13.45 14.32 13.7C14.15 13.95 13.68 14.51 13.53 14.67C13.39 14.84 13.24 14.86 13 14.74C12.75 14.61 11.71 14.27 10.48 13.18C9.52 12.33 8.88 11.27 8.75 11.05C8.63 10.83 8.74 10.71 8.86 10.59C8.97 10.48 9.11 10.3 9.23 10.16C9.36 10.02 9.4 9.92 9.48 9.77C9.56 9.62 9.52 9.48 9.46 9.36C9.4 9.24 8.91 8.03 8.7 7.53C8.5 7.05 8.3 7.11 8.14 7.11C8 7.11 7.83 7.1 7.67 7.1C7.5 7.1 7.23 7.16 7 7.41C6.77 7.66 6.13 8.26 6.13 9.48C6.13 10.7 7.02 11.88 7.14 12.04C7.27 12.21 8.89 14.7 11.36 15.77C11.95 16.03 12.41 16.18 12.76 16.29C13.35 16.48 13.88 16.45 14.31 16.39C14.78 16.32 15.77 15.79 15.98 15.21C16.18 14.63 16.18 14.13 16.12 14.03C16.06 13.93 15.9 13.86 15.65 13.74L16.57 14.39Z" />
  </svg>
);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPasswordSendOtp, forgotPasswordVerifyOtp, forgotPasswordReset } = useAuth();

  // Wizard Steps:
  // 1 = Enter Identifier (Phone or Email)
  // 2 = Enter WhatsApp OTP
  // 3 = Enter New Password
  // 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Timing
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  // OTP Input references
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  // Focus first OTP input when step 2 opens
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Password strength calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: 'bg-slate-200', width: '0%' };
    if (pass.length < 6) return { label: 'Weak', color: 'bg-red-400', width: '33%' };
    if (pass.length < 10 || !/\d/.test(pass)) return { label: 'Medium', color: 'bg-orange-400', width: '66%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = getPasswordStrength(newPassword);

  // Step 1: Send WhatsApp OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setApiError('');
    setSuccessNotice('');

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setApiError('Please enter your registered mobile number or email');
      return;
    }

    setIsLoading(true);
    const res = await forgotPasswordSendOtp(cleanInput);
    setIsLoading(false);

    if (res.success) {
      setTargetPhone(res.phone || cleanInput);
      setMaskedPhone(res.maskedPhone || `+91 ${cleanInput.slice(-10)}`);
      setOtpTimer(res.cooldownSeconds || 60);
      setSuccessNotice(res.message || 'OTP sent successfully to your WhatsApp number!');
      setStep(2);
    } else {
      setApiError(res.error || 'Failed to dispatch OTP. Please check your mobile number.');
    }
  };

  // Step 2: Verify WhatsApp OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    setApiError('');
    const code = (codeToVerify !== undefined ? codeToVerify : otpCode).trim();

    if (!code || code.length < 4) {
      setApiError('Please enter the complete 6-digit WhatsApp OTP');
      return;
    }

    setIsLoading(true);
    const res = await forgotPasswordVerifyOtp(targetPhone, code);
    setIsLoading(false);

    if (res.success) {
      setApiError('');
      setStep(3);
    } else {
      setApiError(res.error || 'Invalid or expired OTP code. Please try again.');
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!newPassword) {
      setApiError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setApiError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setApiError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const res = await forgotPasswordReset({
      phone: targetPhone,
      otp: otpCode,
      newPassword,
    });
    setIsLoading(false);

    if (res.success) {
      setStep(4);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } else {
      setApiError(res.error || 'Failed to reset password. Please try again.');
    }
  };

  // OTP Box Key Handling
  const handleOtpBoxChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      const arr = (otpCode + '      ').slice(0, 6).split('');
      arr[index] = '';
      const nextStr = arr.join('').trimEnd();
      setOtpCode(nextStr);
      return;
    }

    if (rawVal.length > 1) {
      // Pasted full OTP
      const pasted = rawVal.slice(0, 6);
      setOtpCode(pasted);
      if (pasted.length === 6) {
        handleVerifyOtp(pasted);
      }
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const arr = (otpCode + '      ').slice(0, 6).split('');
    arr[index] = rawVal;
    const nextStr = arr.join('').trimEnd();
    setOtpCode(nextStr);

    if (nextStr.length === 6) {
      handleVerifyOtp(nextStr);
    } else if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpCode[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      setOtpCode(pasted);
      if (pasted.length === 6) {
        handleVerifyOtp(pasted);
      }
      const nextIdx = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Official Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 text-center">
        <Link to="/" className="inline-block mb-3 focus:outline-none">
          <img
            src="/logo.png"
            alt="MediQuee Healthcare"
            className="h-10 sm:h-12 w-auto mx-auto object-contain hover:opacity-95 transition-opacity"
          />
        </Link>
        <p className="text-center text-xs sm:text-sm text-slate-500 font-medium">
          Your Healthcare, Just a Tap Away
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-5 sm:px-10 shadow-lg shadow-slate-200/50 rounded-2xl border border-slate-100 relative">

          {/* Back Navigation */}
          {step < 4 && (
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (step === 1) navigate('/login');
                  else if (step === 2) setStep(1);
                  else if (step === 3) setStep(2);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                {step === 1 ? 'Back to Login' : 'Previous Step'}
              </button>

              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Step {step} of 3
              </span>
            </div>
          )}

          {/* Progress Indicators */}
          {step < 4 && (
            <div className="grid grid-cols-3 gap-1.5 mb-6">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-blue-600' : 'bg-slate-100'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-100'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-blue-600' : 'bg-slate-100'}`} />
            </div>
          )}

          {/* Global API Error Alert */}
          {apiError && (
            <div className="mb-5 p-3.5 bg-red-50 text-red-700 rounded-xl border border-red-200/80 font-medium text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-tight">{apiError}</span>
            </div>
          )}

          {/* Global Success Notice */}
          {successNotice && step === 2 && (
            <div className="mb-5 p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 font-medium text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-tight">{successNotice}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 1: ENTER REGISTERED IDENTIFIER                               */}
          {/* ================================================================= */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                  <KeyRound className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Forgot Password?</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  Enter your registered mobile number or email. We will send a 6-digit WhatsApp OTP to reset your password.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="identifier" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Registered Mobile Number / Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="identifier"
                      type="text"
                      placeholder="e.g. 9876543210 or user@example.com"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (apiError) setApiError('');
                      }}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
                      autoFocus
                    />
                  </div>
                </div>

                {/* WhatsApp Notification Badge */}
                <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
                    <WhatsAppIcon className="w-4 h-4 fill-white" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-emerald-800 font-medium leading-tight">
                    Instant delivery directly to your verified <strong className="font-semibold text-emerald-950">WhatsApp</strong>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !identifier.trim()}
                  className="w-full h-12 mt-2 flex items-center justify-center gap-2 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending WhatsApp OTP...</span>
                    </>
                  ) : (
                    <>
                      <WhatsAppIcon className="w-4 h-4 fill-white" />
                      <span>Send WhatsApp OTP</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: VERIFY WHATSAPP OTP                                       */}
          {/* ================================================================= */}
          {step === 2 && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-center mx-auto mb-3 shadow-sm shadow-emerald-500/10">
                <WhatsAppIcon className="w-8 h-8 text-emerald-600 fill-emerald-600" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Verify WhatsApp OTP</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                Enter the 6-digit verification code sent to
              </p>

              <div className="inline-flex items-center gap-2 my-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full">
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                  {maskedPhone || targetPhone}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* 6 Digit Segmented Input */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-4">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const digit = otpCode[idx] || '';
                  const isFilled = !!digit;
                  return (
                    <input
                      key={idx}
                      ref={(el) => { otpInputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpBoxChange(idx, e)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className={`w-10 h-13 sm:w-11 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl border-2 font-mono outline-none transition-all ${apiError
                          ? 'border-red-400 bg-red-50/30 text-red-700'
                          : isFilled
                            ? 'border-emerald-500 bg-emerald-50/20 text-slate-900 shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10'
                        }`}
                    />
                  );
                })}
              </div>

              {/* Resend Countdown */}
              <div className="flex items-center justify-center text-xs text-slate-500 mb-5">
                {otpTimer > 0 ? (
                  <span>
                    Resend code in <strong className="text-slate-800 font-bold font-mono">{otpTimer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend WhatsApp OTP
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={isLoading || otpCode.trim().length < 6}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: CREATE NEW PASSWORD                                       */}
          {/* ================================================================= */}
          {step === 3 && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Create New Password</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Choose a secure password with at least 6 characters.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (apiError) setApiError('');
                      }}
                      className="block w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{ width: strength.width }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase w-12 text-right">
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (apiError) setApiError('');
                      }}
                      className="block w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full h-12 mt-2 flex items-center justify-center gap-2 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 4: SUCCESS CONFIRMATION                                      */}
          {/* ================================================================= */}
          {step === 4 && (
            <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
                Password Reset Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto mb-6">
                Your password has been securely updated. Redirecting you to login...
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full h-12 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                Go to Login
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}