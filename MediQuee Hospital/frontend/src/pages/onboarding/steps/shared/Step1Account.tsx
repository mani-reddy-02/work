import { useFormContext } from "react-hook-form";
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle, RefreshCw, Edit3, ArrowRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import type { OnboardingFormValues } from "../../schema";

export const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" className={className} fill="currentColor">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2M12.05 20.15C10.57 20.15 9.12 19.75 7.85 19L7.55 18.82L4.43 19.64L5.26 16.59L5.06 16.27C4.24 14.97 3.8 13.46 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.05 20.15M16.57 14.39C16.32 14.26 15.1 13.66 14.87 13.58C14.65 13.5 14.48 13.45 14.32 13.7C14.15 13.95 13.68 14.51 13.53 14.67C13.39 14.84 13.24 14.86 13 14.74C12.75 14.61 11.71 14.27 10.48 13.18C9.52 12.33 8.88 11.27 8.75 11.05C8.63 10.83 8.74 10.71 8.86 10.59C8.97 10.48 9.11 10.3 9.23 10.16C9.36 10.02 9.4 9.92 9.48 9.77C9.56 9.62 9.52 9.48 9.46 9.36C9.4 9.24 8.91 8.03 8.7 7.53C8.5 7.05 8.3 7.11 8.14 7.11C8 7.11 7.83 7.1 7.67 7.1C7.5 7.1 7.23 7.16 7 7.41C6.77 7.66 6.13 8.26 6.13 9.48C6.13 10.7 7.02 11.88 7.14 12.04C7.27 12.21 8.89 14.7 11.36 15.77C11.95 16.03 12.41 16.18 12.76 16.29C13.35 16.48 13.88 16.45 14.31 16.39C14.78 16.32 15.77 15.79 15.98 15.21C16.18 14.63 16.18 14.13 16.12 14.03C16.06 13.93 15.9 13.86 15.65 13.74L16.57 14.39Z" />
  </svg>
);

/**
 * 6-Digit Segmented PIN Input Box with auto-advance, backspace navigation, and paste support
 */
function SegmentedOtpInput({
  value,
  onChange,
  onComplete,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (val: string) => void;
  error?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    const firstEmpty = Math.min(value.length, 5);
    inputRefs.current[firstEmpty]?.focus();
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      const nextArr = (value + "      ").slice(0, 6).split("");
      nextArr[index] = "";
      onChange(nextArr.join("").trimEnd());
      return;
    }

    if (rawVal.length > 1) {
      // Pasted multi-character string
      const pasted = rawVal.slice(0, 6);
      onChange(pasted);
      if (pasted.length === 6 && onComplete) {
        onComplete(pasted);
      }
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    // Single digit typed
    const nextArr = (value + "      ").slice(0, 6).split("");
    nextArr[index] = rawVal;
    const newVal = nextArr.join("").trimEnd();
    onChange(newVal);

    if (newVal.length === 6 && onComplete) {
      onComplete(newVal);
    } else if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      onChange(pastedData);
      if (pastedData.length === 6 && onComplete) {
        onComplete(pastedData);
      }
      const focusIdx = Math.min(pastedData.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-2">
      {[0, 1, 2, 3, 4, 5].map((idx) => {
        const char = value[idx] || "";
        const isFilled = !!char;
        return (
          <input
            key={idx}
            ref={(el) => { inputRefs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={char}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-black rounded-2xl border-2 transition-all outline-none font-mono ${
              error
                ? 'border-red-400 bg-red-50/40 text-red-700 focus:ring-4 focus:ring-red-500/10'
                : isFilled
                ? 'border-emerald-500 bg-emerald-50/25 text-gray-900 shadow-sm'
                : 'border-gray-200 bg-surface text-gray-900 focus:border-[#1769E0] focus:ring-4 focus:ring-[#1769E0]/15'
            }`}
          />
        );
      })}
    </div>
  );
}

export interface Step1AccountProps {
  isOtpSent?: boolean;
  isPhoneVerified?: boolean;
  isSendingOtp?: boolean;
  isVerifyingOtp?: boolean;
  otpCode?: string;
  setOtpCode?: (code: string) => void;
  otpTimer?: number;
  otpError?: string;
  otpNotice?: string;
  onSendOtp?: () => Promise<boolean>;
  onVerifyOtp?: (code?: string) => Promise<boolean>;
  onChangePhone?: () => void;
}

export function Step1Account({
  isOtpSent = false,
  isPhoneVerified = false,
  isSendingOtp = false,
  isVerifyingOtp = false,
  otpCode = "",
  setOtpCode,
  otpTimer = 0,
  otpError = "",
  otpNotice = "",
  onSendOtp,
  onVerifyOtp,
  onChangePhone,
}: Step1AccountProps) {
  const { register, watch, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const phoneValue = watch("account.phone") || "";
  const cleanPhone = phoneValue.replace(/\D/g, "");

  // =========================================================================
  // VIEW B: DEDICATED WHATSAPP VERIFICATION SCREEN
  // Shown when OTP is dispatched and pending user verification
  // =========================================================================
  if (isOtpSent && !isPhoneVerified) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-4 px-2 w-full animate-in fade-in zoom-in-95 duration-300">
        {/* Hero WhatsApp Badge */}
        <div className="relative mb-5">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
              <WhatsAppIcon className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
            </div>
          </div>
        </div>

        {/* Header & Phone Number with Edit */}
        <h2 className="text-[22px] sm:text-2xl font-bold text-[#172033] tracking-tight mb-1.5">
          Verify your WhatsApp Number
        </h2>
        <p className="text-[13px] sm:text-[14px] text-gray-500 max-w-sm mb-1">
          We sent a 6-digit verification code to
        </p>
        <div className="inline-flex items-center justify-center gap-2 mb-6 bg-gray-50 border border-gray-200/80 rounded-full px-3.5 py-1">
          <span className="text-[14px] sm:text-[15px] font-bold text-gray-900 font-mono tracking-wide">
            +91 {cleanPhone.slice(-10)}
          </span>
          {onChangePhone && (
            <button
              type="button"
              onClick={onChangePhone}
              className="text-[12px] font-semibold text-[#1769E0] hover:text-[#0A4399] transition-colors flex items-center gap-1 ml-1"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>

        {/* 6-Digit Segmented PIN Boxes */}
        <div className="w-full max-w-sm mb-3">
          <SegmentedOtpInput
            value={otpCode}
            onChange={(val) => setOtpCode && setOtpCode(val)}
            onComplete={(val) => onVerifyOtp && onVerifyOtp(val)}
            error={!!otpError}
          />

          {otpError ? (
            <div className="flex items-center justify-center gap-1.5 text-red-600 text-[12px] font-semibold mt-2.5 bg-red-50/80 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          ) : otpNotice ? (
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-[12px] font-semibold mt-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{otpNotice}</span>
            </div>
          ) : null}
        </div>

        {/* Resend Timer / Action */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {otpTimer > 0 ? (
            <p className="text-[13px] text-gray-500 font-medium">
              Didn't receive code? Resend in <span className="font-bold text-gray-800 font-mono">{otpTimer}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onSendOtp && onSendOtp()}
              disabled={isSendingOtp}
              className="text-[13px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Resend code via WhatsApp
            </button>
          )}
        </div>

        {/* Verify & Proceed Button */}
        <div className="w-full max-w-sm flex flex-col gap-2.5">
          {onVerifyOtp && (
            <button
              type="button"
              onClick={() => onVerifyOtp()}
              disabled={isVerifyingOtp || otpCode.trim().length < 6}
              className={`w-full h-12 py-3 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all ${
                otpCode.trim().length === 6 && !isVerifyingOtp
                  ? 'bg-[#1769E0] hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-[0.99] cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isVerifyingOtp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Proceed to Step 2
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {onChangePhone && (
            <button
              type="button"
              onClick={onChangePhone}
              className="text-[13px] font-semibold text-gray-500 hover:text-gray-800 py-1 transition-colors"
            >
              Back to account details
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW A: CLEAN STEP 1 ACCOUNT FORM
  // Standard 5 inputs with no crowded inline boxes
  // =========================================================================
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-[22px] font-bold text-[#172033] tracking-tight">Create your MediQuee account</h2>
        <p className="text-[14px] text-[#667085]">Set up your account to manage your healthcare business.</p>
      </div>

      {/* Full Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-[#172033] ml-1">Full Name</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70">
            <User className="w-5 h-5" />
          </div>
          <input 
            {...register("account.name")}
            type="text" 
            placeholder="John Doe" 
            className={`w-full pl-11 pr-4 py-3.5 bg-surface border ${errors.account?.name ? 'border-red-500 focus:ring-red-500/10' : 'border-border focus:border-[#1769E0] focus:ring-[#1769E0]/10'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] placeholder:text-muted/70`}
          />
        </div>
        {errors.account?.name && <span className="text-red-500 text-[12px] ml-1 font-medium">{errors.account.name.message}</span>}
      </div>

      {/* Email Address */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-[#172033] ml-1">Email Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70">
            <Mail className="w-5 h-5" />
          </div>
          <input 
            {...register("account.email")}
            type="email" 
            placeholder="you@example.com" 
            className={`w-full pl-11 pr-4 py-3.5 bg-surface border ${errors.account?.email ? 'border-red-500 focus:ring-red-500/10' : 'border-border focus:border-[#1769E0] focus:ring-[#1769E0]/10'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] placeholder:text-muted/70`}
          />
        </div>
        {errors.account?.email && <span className="text-red-500 text-[12px] ml-1 font-medium">{errors.account.email.message}</span>}
      </div>

      {/* Mobile Number */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Mobile Number</label>
          {isPhoneVerified && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp Verified
            </span>
          )}
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70">
            <Phone className="w-5 h-5" />
          </div>
          <input 
            {...register("account.phone")}
            type="tel" 
            placeholder="+91 00000 00000" 
            className={`w-full pl-11 pr-4 py-3.5 bg-surface border ${
              isPhoneVerified
                ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10'
                : errors.account?.phone
                ? 'border-red-500 focus:ring-red-500/10'
                : 'border-border focus:border-[#1769E0] focus:ring-[#1769E0]/10'
            } rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] placeholder:text-muted/70`}
          />
        </div>
        {errors.account?.phone && <span className="text-red-500 text-[12px] ml-1 font-medium">{errors.account.phone.message}</span>}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-[#172033] ml-1">Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70">
            <Lock className="w-5 h-5" />
          </div>
          <input 
            {...register("account.password")}
            type={showPassword ? "text" : "password"} 
            placeholder="Create a strong password" 
            className={`w-full pl-11 pr-12 py-3.5 bg-surface border ${errors.account?.password ? 'border-red-500 focus:ring-red-500/10' : 'border-border focus:border-[#1769E0] focus:ring-[#1769E0]/10'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] placeholder:text-muted/70`}
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-4 flex items-center text-muted/70 hover:text-gray-600 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.account?.password && <span className="text-red-500 text-[12px] ml-1 font-medium">{errors.account.password.message}</span>}
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-[#172033] ml-1">Confirm Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70">
            <Lock className="w-5 h-5" />
          </div>
          <input 
            {...register("account.confirmPassword")}
            type={showConfirmPassword ? "text" : "password"} 
            placeholder="Re-enter your password" 
            className={`w-full pl-11 pr-12 py-3.5 bg-surface border ${errors.account?.confirmPassword ? 'border-red-500 focus:ring-red-500/10' : 'border-border focus:border-[#1769E0] focus:ring-[#1769E0]/10'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] placeholder:text-muted/70`}
          />
          <button 
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-4 flex items-center text-muted/70 hover:text-gray-600 cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.account?.confirmPassword && <span className="text-red-500 text-[12px] ml-1 font-medium">{errors.account.confirmPassword.message}</span>}
      </div>
      
      <p className="text-[12px] text-muted text-center mt-2 px-4">
        By continuing, you agree to our{" "}
        <Link to="/terms-of-service" target="_blank" className="text-[#1769E0] font-semibold hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy-policy" target="_blank" className="text-[#1769E0] font-semibold hover:underline">
          Privacy Policy
        </Link>.
      </p>

      <div className="flex items-center justify-center mt-2">
        <p className="text-[14px] text-[#172033] font-medium">
          Already have an account?{" "}
          <Link to="/login" className="text-[#1769E0] font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}