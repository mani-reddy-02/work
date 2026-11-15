import { useFormContext } from "react-hook-form";
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle, RefreshCw, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { OnboardingFormValues } from "../../schema";

export const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" className={className} fill="currentColor">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2M12.05 20.15C10.57 20.15 9.12 19.75 7.85 19L7.55 18.82L4.43 19.64L5.26 16.59L5.06 16.27C4.24 14.97 3.8 13.46 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.05 20.15M16.57 14.39C16.32 14.26 15.1 13.66 14.87 13.58C14.65 13.5 14.48 13.45 14.32 13.7C14.15 13.95 13.68 14.51 13.53 14.67C13.39 14.84 13.24 14.86 13 14.74C12.75 14.61 11.71 14.27 10.48 13.18C9.52 12.33 8.88 11.27 8.75 11.05C8.63 10.83 8.74 10.71 8.86 10.59C8.97 10.48 9.11 10.3 9.23 10.16C9.36 10.02 9.4 9.92 9.48 9.77C9.56 9.62 9.52 9.48 9.46 9.36C9.4 9.24 8.91 8.03 8.7 7.53C8.5 7.05 8.3 7.11 8.14 7.11C8 7.11 7.83 7.1 7.67 7.1C7.5 7.1 7.23 7.16 7 7.41C6.77 7.66 6.13 8.26 6.13 9.48C6.13 10.7 7.02 11.88 7.14 12.04C7.27 12.21 8.89 14.7 11.36 15.77C11.95 16.03 12.41 16.18 12.76 16.29C13.35 16.48 13.88 16.45 14.31 16.39C14.78 16.32 15.77 15.79 15.98 15.21C16.18 14.63 16.18 14.13 16.12 14.03C16.06 13.93 15.9 13.86 15.65 13.74L16.57 14.39Z" />
  </svg>
);

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
  const hasValidPhoneLength = cleanPhone.length >= 10;

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

      {/* Mobile Number with WhatsApp Verification Status */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Mobile Number</label>
          {isPhoneVerified ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp Verified
            </span>
          ) : isOtpSent ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              OTP Sent
            </span>
          ) : null}
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70">
            <Phone className="w-5 h-5" />
          </div>
          <input 
            {...register("account.phone")}
            type="tel" 
            placeholder="+91 00000 00000" 
            disabled={isPhoneVerified}
            className={`w-full pl-11 ${isPhoneVerified ? 'pr-24 bg-emerald-50/20' : hasValidPhoneLength && onSendOtp ? 'pr-28' : 'pr-4'} py-3.5 bg-surface border ${
              isPhoneVerified
                ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10'
                : errors.account?.phone
                ? 'border-red-500 focus:ring-red-500/10'
                : 'border-border focus:border-[#1769E0] focus:ring-[#1769E0]/10'
            } rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] placeholder:text-muted/70`}
          />

          {/* Inline Action in Phone input */}
          <div className="absolute inset-y-0 right-2 flex items-center">
            {isPhoneVerified ? (
              <button
                type="button"
                onClick={onChangePhone}
                className="text-[12px] font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                Change
              </button>
            ) : hasValidPhoneLength && onSendOtp && (
              <button
                type="button"
                onClick={() => onSendOtp()}
                disabled={isSendingOtp}
                className="text-[12px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                {isSendingOtp ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                )}
                {isOtpSent ? "Resend" : "Send OTP"}
              </button>
            )}
          </div>
        </div>
        {errors.account?.phone && <span className="text-red-500 text-[12px] ml-1 font-medium">{errors.account.phone.message}</span>}
      </div>

      {/* WhatsApp OTP Verification Box (Appears when OTP is sent & not yet verified) */}
      {isOtpSent && !isPhoneVerified && (
        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40 border-2 border-emerald-300/80 rounded-2xl p-4.5 flex flex-col gap-3 shadow-md shadow-emerald-500/5 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
                <WhatsAppIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-gray-900 leading-tight">Enter WhatsApp OTP</h4>
                <p className="text-[12px] text-gray-600 mt-0.5">
                  Code sent to <span className="font-semibold text-gray-900">+91 {cleanPhone.slice(-10)}</span>
                </p>
              </div>
            </div>

            {onChangePhone && (
              <button
                type="button"
                onClick={onChangePhone}
                className="text-[12px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Edit Number
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="relative">
              <input
                id="whatsapp-otp-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  if (setOtpCode) setOtpCode(val);
                  if (val.length === 6 && onVerifyOtp) {
                    onVerifyOtp(val);
                  }
                }}
                placeholder="••••••"
                className="w-full tracking-[0.5em] text-center font-mono text-2xl font-black py-3 px-4 bg-white border border-emerald-300 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 text-gray-900 shadow-sm"
                autoFocus
              />
            </div>

            {otpError ? (
              <div className="flex items-center gap-1.5 text-red-600 text-[12px] font-semibold mt-1 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{otpError}</span>
              </div>
            ) : otpNotice ? (
              <div className="flex items-center gap-1.5 text-emerald-700 text-[12px] font-semibold mt-1 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{otpNotice}</span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between pt-1">
            {otpTimer > 0 ? (
              <span className="text-[12px] font-medium text-gray-500">
                Resend code in <strong className="text-gray-800 font-bold">{otpTimer}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSendOtp && onSendOtp()}
                disabled={isSendingOtp}
                className="text-[12px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
              >
                {isSendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Resend WhatsApp OTP
              </button>
            )}

            {onVerifyOtp && (
              <button
                type="button"
                onClick={() => onVerifyOtp()}
                disabled={isVerifyingOtp || otpCode.trim().length < 4}
                className={`px-4 py-2 text-[13px] font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  otpCode.trim().length >= 4 && !isVerifyingOtp
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Proceed
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

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
            className="absolute inset-y-0 right-4 flex items-center text-muted/70 hover:text-gray-600"
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
            className="absolute inset-y-0 right-4 flex items-center text-muted/70 hover:text-gray-600"
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