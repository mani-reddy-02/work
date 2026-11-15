import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  HeartPulse, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  RotateCw,
  MapPin,
  Calendar,
  Droplet,
  User,
  PhoneCall,
  Check
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" className={className} fill="currentColor">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2M12.05 20.15C10.57 20.15 9.12 19.75 7.85 19L7.55 18.82L4.43 19.64L5.26 16.59L5.06 16.27C4.24 14.97 3.8 13.46 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.05 20.15M16.57 14.39C16.32 14.26 15.1 13.66 14.87 13.58C14.65 13.5 14.48 13.45 14.32 13.7C14.15 13.95 13.68 14.51 13.53 14.67C13.39 14.84 13.24 14.86 13 14.74C12.75 14.61 11.71 14.27 10.48 13.18C9.52 12.33 8.88 11.27 8.75 11.05C8.63 10.83 8.74 10.71 8.86 10.59C8.97 10.48 9.11 10.3 9.23 10.16C9.36 10.02 9.4 9.92 9.48 9.77C9.56 9.62 9.52 9.48 9.46 9.36C9.4 9.24 8.91 8.03 8.7 7.53C8.5 7.05 8.3 7.11 8.14 7.11C8 7.11 7.83 7.1 7.67 7.1C7.5 7.1 7.23 7.16 7 7.41C6.77 7.66 6.13 8.26 6.13 9.48C6.13 10.7 7.02 11.88 7.14 12.04C7.27 12.21 8.89 14.7 11.36 15.77C11.95 16.03 12.41 16.18 12.76 16.29C13.35 16.48 13.88 16.45 14.31 16.39C14.78 16.32 15.77 15.79 15.98 15.21C16.18 14.63 16.18 14.13 16.12 14.03C16.06 13.93 15.9 13.86 15.65 13.74L16.57 14.39Z" />
  </svg>
);

export default function Register() {
  const navigate = useNavigate();
  const { register, sendWhatsAppOtp, verifyWhatsAppOtp } = useAuth();
  
  // Step State: 1 = Basic Info & WhatsApp OTP, 2 = Personal Details (Age, Gender, Place, etc.)
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Base Account Details
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  
  // Step 2: Personal Details
  const [personalData, setPersonalData] = useState({
    age: '',
    dob: '',
    gender: 'Male',
    place: '',
    bloodGroup: '',
    email: '',
    emergencyContact: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  
  // OTP States
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpNotice, setOtpNotice] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Timer countdown for resending OTP
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

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: 'bg-slate-200' };
    if (pass.length < 6) return { label: 'Weak', color: 'bg-red-400', width: '33%' };
    if (pass.length < 10 || !/\d/.test(pass)) return { label: 'Medium', color: 'bg-orange-400', width: '66%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = getPasswordStrength(formData.password);

  const validateBaseFields = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
      isValid = false;
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'Valid 10-digit mobile number is required';
      isValid = false;
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSendOtp = async () => {
    setApiError('');
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrors((prev) => ({ ...prev, phone: 'Please enter a valid 10-digit mobile number first' }));
      return;
    }

    setIsSendingOtp(true);
    const res = await sendWhatsAppOtp(cleanPhone);
    setIsSendingOtp(false);

    if (res.success) {
      setIsOtpSent(true);
      setOtpTimer(60);
      setOtpNotice(res.message || 'OTP sent successfully to your WhatsApp number!');
      setTimeout(() => {
        const otpInput = document.getElementById('whatsapp-otp-input');
        if (otpInput) otpInput.focus();
      }, 100);
    } else {
      setApiError(res.error || 'Failed to send WhatsApp OTP. Please verify your mobile number.');
    }
  };

  // Step 1: User verifies OTP and advances to Personal Details screen
  const handleVerifyOtpAndNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setApiError('');

    if (!validateBaseFields()) {
      return;
    }

    if (!agreeTerms) {
      setApiError('Please accept the Terms & Conditions and Privacy Policy to proceed');
      return;
    }

    if (!isOtpSent) {
      await handleSendOtp();
      return;
    }

    if (!formData.otp.trim() || formData.otp.trim().length < 4) {
      setErrors((prev) => ({ ...prev, otp: 'Please enter the 6-digit WhatsApp OTP' }));
      return;
    }

    setIsVerifyingOtp(true);
    const cleanPhone = formData.phone.replace(/\D/g, '');
    const res = await verifyWhatsAppOtp(cleanPhone, formData.otp.trim());
    setIsVerifyingOtp(false);

    if (res.success) {
      setErrors({});
      setApiError('');
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setApiError(res.error || 'Invalid or expired OTP. Please verify and try again.');
    }
  };

  // Sync Age and DOB
  const handleAgeChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean) {
      const num = parseInt(clean, 10);
      if (num > 0 && num <= 120) {
        const birthYear = new Date().getFullYear() - num;
        setPersonalData((prev) => ({
          ...prev,
          age: clean,
          dob: `${birthYear}-01-01`,
        }));
      } else {
        setPersonalData((prev) => ({ ...prev, age: clean }));
      }
    } else {
      setPersonalData((prev) => ({ ...prev, age: '', dob: '' }));
    }
    if (errors.age) {
      setErrors((prev) => ({ ...prev, age: '' }));
    }
  };

  const handleDobChange = (val: string) => {
    if (val) {
      const birthYear = new Date(val).getFullYear();
      const currentYear = new Date().getFullYear();
      const calculatedAge = currentYear - birthYear;
      setPersonalData((prev) => ({
        ...prev,
        dob: val,
        age: calculatedAge > 0 && calculatedAge <= 120 ? calculatedAge.toString() : prev.age,
      }));
    } else {
      setPersonalData((prev) => ({ ...prev, dob: '' }));
    }
    if (errors.age) {
      setErrors((prev) => ({ ...prev, age: '' }));
    }
  };

  // Step 2: User completes personal details and submits registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    const newErrors: Record<string, string> = {};
    if (!personalData.age || parseInt(personalData.age, 10) < 1 || parseInt(personalData.age, 10) > 120) {
      newErrors.age = 'Please enter a valid age (1 - 120)';
    }
    if (!personalData.gender) {
      newErrors.gender = 'Please select your gender';
    }
    if (!personalData.place.trim()) {
      newErrors.place = 'Please enter your city / place';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    const cleanPhone = formData.phone.replace(/\D/g, '');

    const res = await register({
      name: formData.name.trim(),
      phone: cleanPhone,
      password: formData.password,
      otp: formData.otp.trim(),
      whatsappConsent,
      age: personalData.age ? parseInt(personalData.age, 10) : undefined,
      gender: personalData.gender,
      place: personalData.place.trim(),
      address: personalData.place.trim(),
      dob: personalData.dob || undefined,
      bloodGroup: personalData.bloodGroup || undefined,
      email: personalData.email.trim() || undefined,
      emergencyContact: personalData.emergencyContact.trim() || undefined,
    });

    setIsLoading(false);

    if (res.success) {
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1400);
    } else {
      setApiError(res.error || 'Registration failed. Please review your details and try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (apiError) {
      setApiError('');
    }
  };

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPersonalData({ ...personalData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (apiError) {
      setApiError('');
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Title Header with Official Brand Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 text-center">
        <Link to="/" className="inline-block mb-3 focus:outline-none">
          <img src="/logo.png" alt="MediQuee Healthcare" className="h-10 sm:h-12 w-auto mx-auto object-contain hover:opacity-95 transition-opacity" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {step === 1 ? 'Create Your Account' : 'Personal Information'}
        </h1>
        <p className="mt-1 text-sm text-slate-600 font-medium px-4">
          {step === 1 
            ? 'Join MediQuee and manage your healthcare in one place.' 
            : 'Provide your personal details to personalize your healthcare & appointments.'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-6 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-slate-200/80">
          
          {/* Progress Multi-Step Indicator */}
          {!showSuccess && (
            <div className="mb-6">
              <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-300"
                  style={{ width: step === 1 ? '30%' : '100%' }}
                />

                {/* Step 1 Pill */}
                <div 
                  onClick={() => { if (step === 2) setStep(1); }}
                  className={`relative z-10 flex items-center gap-2 bg-white px-2 py-1 rounded-full cursor-pointer select-none transition-all ${
                    step === 1 ? 'ring-2 ring-blue-500/20' : 'hover:opacity-80'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > 1 
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20' 
                      : 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  }`}>
                    {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 1</p>
                    <p className={`text-xs font-bold ${step === 1 ? 'text-blue-600' : 'text-slate-700'}`}>Account & OTP</p>
                  </div>
                </div>

                {/* Step 2 Pill */}
                <div className={`relative z-10 flex items-center gap-2 bg-white px-2 py-1 rounded-full select-none transition-all ${
                  step === 2 ? 'ring-2 ring-blue-500/20' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === 2 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    2
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 2</p>
                    <p className={`text-xs font-bold ${step === 2 ? 'text-blue-600' : 'text-slate-400'}`}>Personal Details</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {apiError && (
            <div className="mb-4 p-3.5 bg-red-50 text-red-700 rounded-xl border border-red-100 font-medium text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{apiError}</span>
            </div>
          )}

          {showSuccess ? (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <HeartPulse className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Account Created Successfully</h3>
              <p className="text-slate-600 mb-8 font-medium">
                Welcome to MediQuee, <span className="text-slate-900 font-bold">{formData.name}</span>! Redirecting you to your health dashboard...
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </div>
          ) : step === 1 ? (
            /* ================= STEP 1: ACCOUNT & OTP ================= */
            <form className="space-y-4" onSubmit={handleVerifyOtpAndNext}>
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                <div className="mt-1">
                  <input
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2.5 border rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm font-medium transition-all ${
                      errors.name ? 'border-red-300 focus:border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-500 bg-white'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>}
                </div>
              </div>

              {/* Primary Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Mobile Number (Primary)</label>
                <div className={`mt-1 flex items-center rounded-xl border shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 ${
                  errors.phone ? 'border-red-300 focus-within:border-red-500 bg-red-50/50' : 'border-slate-300 focus-within:border-blue-500 bg-white'
                }`}>
                  <span className="inline-flex items-center pl-3.5 pr-2.5 text-slate-600 font-bold text-xs sm:text-sm select-none border-r border-slate-200 py-2.5">
                    +91
                  </span>
                  <input
                    name="phone"
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2.5 bg-transparent rounded-r-xl placeholder-slate-400 focus:outline-none sm:text-sm font-medium"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone}</p>}
              </div>

              {/* Password and Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <div className="mt-1 relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-2.5 border rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm font-medium pr-10 transition-all ${
                        errors.password ? 'border-red-300 focus:border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-500 bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>}
                  
                  {formData.password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase w-10 text-right">{strength.label}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
                  <div className="mt-1 relative">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-2.5 border rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm font-medium pr-10 transition-all ${
                        errors.confirmPassword ? 'border-red-300 focus:border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-500 bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* WhatsApp Notification Opt-in Checkbox */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 transition-colors">
                <input
                  id="whatsappConsent"
                  name="whatsappConsent"
                  type="checkbox"
                  checked={whatsappConsent}
                  onChange={(e) => setWhatsappConsent(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer mt-0.5"
                />
                <label htmlFor="whatsappConsent" className="text-xs text-slate-600 font-medium cursor-pointer leading-tight select-none">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-0.5">
                    <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Notifications & OTPs
                  </span>
                  I agree to receive WhatsApp notifications for updates, alerts, appointment reminders, and OTPs.
                </label>
              </div>

              {/* WhatsApp OTP Verification Box */}
              {isOtpSent && (
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                      <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp OTP Verification</span>
                    </div>
                    {otpTimer > 0 ? (
                      <span className="text-[11px] font-semibold text-slate-500">
                        Resend in <span className="font-mono text-blue-700 font-bold">{otpTimer}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RotateCw className={`w-3 h-3 ${isSendingOtp ? 'animate-spin' : ''}`} />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600">
                    Enter the 6-digit verification code sent to your WhatsApp at{' '}
                    <strong className="text-slate-900 font-bold font-mono">+91 {formData.phone}</strong>
                  </p>

                  <div>
                    <input
                      id="whatsapp-otp-input"
                      name="otp"
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={formData.otp}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-2.5 text-center tracking-[0.5em] font-mono text-lg font-bold border rounded-xl bg-white shadow-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-base transition-all ${
                        errors.otp ? 'border-red-300 focus:border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-500'
                      }`}
                    />
                    {errors.otp && <p className="mt-1 text-xs text-red-500 font-medium">{errors.otp}</p>}
                  </div>
                </div>
              )}

              {/* Terms and Privacy Policy Checkbox */}
              <div className="flex items-start pt-1">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer mt-0.5"
                />
                <div className="ml-2 text-xs">
                  <label htmlFor="terms" className="text-slate-600 font-medium cursor-pointer leading-tight">
                    I agree to the{' '}
                    <Link to="/terms" target="_blank" className="text-blue-600 hover:underline font-bold">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" target="_blank" className="text-blue-600 hover:underline font-bold">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              {/* Submit / Continue Button */}
              <div>
                {!isOtpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || !agreeTerms || !formData.phone || formData.phone.length < 10}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md shadow-emerald-600/20 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending WhatsApp OTP...</span>
                      </>
                    ) : (
                      <>
                        <WhatsAppIcon className="w-5 h-5" />
                        <span>Send WhatsApp OTP</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || !agreeTerms || !formData.otp}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md shadow-blue-500/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify OTP & Next</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          ) : (
            /* ================= STEP 2: PERSONAL DETAILS (AGE, GENDER, PLACE, ETC.) ================= */
            <form className="space-y-5 animate-in fade-in duration-300" onSubmit={handleCompleteRegistration}>
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-900 font-medium leading-relaxed">
                  Mobile number <strong className="font-mono text-blue-950">+91 {formData.phone}</strong> verified via WhatsApp. Please finish setting up your profile below.
                </p>
              </div>

              {/* Age and Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Age */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age (Years) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="age"
                      type="number"
                      min={1}
                      max={120}
                      placeholder="e.g. 28"
                      value={personalData.age}
                      onChange={(e) => handleAgeChange(e.target.value)}
                      className={`appearance-none block w-full px-3 py-2.5 border rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm font-medium transition-all ${
                        errors.age ? 'border-red-300 focus:border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-500 bg-white'
                      }`}
                    />
                  </div>
                  {errors.age && <p className="mt-1 text-xs text-red-500 font-medium">{errors.age}</p>}
                </div>

                {/* Date of Birth (Optional / Auto-synced) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth (Optional)
                  </label>
                  <div className="relative">
                    <input
                      name="dob"
                      type="date"
                      value={personalData.dob}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm font-medium bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: 'Male', icon: '👨' },
                    { label: 'Female', icon: '👩' },
                    { label: 'Other', icon: '🧑' },
                  ].map((item) => {
                    const isSelected = personalData.gender === item.label;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setPersonalData((prev) => ({ ...prev, gender: item.label }));
                          if (errors.gender) setErrors((prev) => ({ ...prev, gender: '' }));
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-sm font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.gender && <p className="mt-1 text-xs text-red-500 font-medium">{errors.gender}</p>}
              </div>

              {/* Place / City / Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Place / City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    name="place"
                    type="text"
                    placeholder="Enter city or town (e.g. Hyderabad, Bengaluru, Kurnool)"
                    value={personalData.place}
                    onChange={handlePersonalChange}
                    className={`appearance-none block w-full pl-9 pr-3 py-2.5 border rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm font-medium transition-all ${
                      errors.place ? 'border-red-300 focus:border-red-500 bg-red-50/50' : 'border-slate-300 focus:border-blue-500 bg-white'
                    }`}
                  />
                </div>
                {errors.place && <p className="mt-1 text-xs text-red-500 font-medium">{errors.place}</p>}
              </div>

              {/* Blood Group and Optional Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Blood Group (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-rose-500">
                      <Droplet className="h-4 w-4" />
                    </div>
                    <select
                      name="bloodGroup"
                      value={personalData.bloodGroup}
                      onChange={handlePersonalChange}
                      className="appearance-none block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm font-medium bg-white text-slate-700"
                    >
                      <option value="">Select Blood Group</option>
                      {bloodGroups.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="e.g. user@example.com"
                    value={personalData.email}
                    onChange={handlePersonalChange}
                    className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm font-medium bg-white"
                  />
                </div>
              </div>

              {/* Emergency Contact (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Contact Number (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <PhoneCall className="h-4 w-4" />
                  </div>
                  <input
                    name="emergencyContact"
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit emergency contact phone number"
                    value={personalData.emergencyContact}
                    onChange={handlePersonalChange}
                    className="appearance-none block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm font-medium bg-white"
                  />
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md shadow-blue-500/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Health Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {!showSuccess && (
            <div className="mt-5">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-slate-500 font-medium uppercase tracking-wider">Or</span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-slate-600 font-medium">
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                    Login
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
