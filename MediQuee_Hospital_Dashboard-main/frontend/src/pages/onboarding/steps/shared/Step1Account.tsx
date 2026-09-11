import { useFormContext } from "react-hook-form";
import { User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { OnboardingFormValues } from "../../schema";

export function Step1Account() {
  const { register, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-[22px] font-bold text-[#172033] tracking-tight">Create your MediQuee account</h2>
        <p className="text-[14px] text-[#667085]">Set up your account to manage your healthcare business.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-[#172033] ml-1">Full Name</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <User className="w-5 h-5" />
          </div>
          <input 
            {...register("account.name")}
            type="text" 
            placeholder="John Doe" 
            className={`w-full pl-11 pr-4 py-3.5 bg-white border ${errors.account?.name ? 'border-red-500 focus:ring-red-500/10' : 'border-gray-200 focus:border-[#1769E0] focus:ring-[#1769E0]/10'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] placeholder:text-gray-400`}
          />
        </div>
        {errors.account?.name && <span className="text-red-500 text-[12px] ml-1 font-medium">{errors.account.name.message}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-[#172033] ml-1">Email Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Mail className="w-5 h-5" />
          </div>
          <input 
            {...register("account.email")}
            type="email" 
            placeholder="you@example.com" 
            className={`w-full pl-11 pr-4 py-3.5 bg-white border ${errors.account?.email ? 'border-red-500 focus:ring-red-500/10' : 'border-gray-200 focus:border-[#1769E0] focus:ring-[#1769E0]/10'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] placeholder:text-gray-400`}
          />
        </div>
        {errors.account?.email && <span className="text-red-500 text-[12px] ml-1 font-medium">{errors.account.email.message}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-[#172033] ml-1">Mobile Number</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Phone className="w-5 h-5" />
          </div>
          <input 
            {...register("account.phone")}
            type="tel" 
            placeholder="+91 00000 00000" 
            className={`w-full pl-11 pr-4 py-3.5 bg-white border ${errors.account?.phone ? 'border-red-500 focus:ring-red-500/10' : 'border-gray-200 focus:border-[#1769E0] focus:ring-[#1769E0]/10'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] placeholder:text-gray-400`}
          />
        </div>
        {errors.account?.phone && <span className="text-red-500 text-[12px] ml-1 font-medium">{errors.account.phone.message}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-[#172033] ml-1">Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Lock className="w-5 h-5" />
          </div>
          <input 
            {...register("account.password")}
            type={showPassword ? "text" : "password"} 
            placeholder="Create a strong password" 
            className={`w-full pl-11 pr-12 py-3.5 bg-white border ${errors.account?.password ? 'border-red-500 focus:ring-red-500/10' : 'border-gray-200 focus:border-[#1769E0] focus:ring-[#1769E0]/10'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] placeholder:text-gray-400`}
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.account?.password && <span className="text-red-500 text-[12px] ml-1 font-medium">{errors.account.password.message}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-[#172033] ml-1">Confirm Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Lock className="w-5 h-5" />
          </div>
          <input 
            {...register("account.confirmPassword")}
            type={showConfirmPassword ? "text" : "password"} 
            placeholder="Re-enter your password" 
            className={`w-full pl-11 pr-12 py-3.5 bg-white border ${errors.account?.confirmPassword ? 'border-red-500 focus:ring-red-500/10' : 'border-gray-200 focus:border-[#1769E0] focus:ring-[#1769E0]/10'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] placeholder:text-gray-400`}
          />
          <button 
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.account?.confirmPassword && <span className="text-red-500 text-[12px] ml-1 font-medium">{errors.account.confirmPassword.message}</span>}
      </div>
      
      <p className="text-[12px] text-gray-500 text-center mt-2 px-4">
        By continuing, you agree to our <a href="#" className="text-[#1769E0] font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-[#1769E0] font-semibold hover:underline">Privacy Policy</a>.
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
