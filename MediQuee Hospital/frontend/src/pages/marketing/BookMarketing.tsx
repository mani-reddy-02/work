import { ArrowLeft, Megaphone, TrendingUp, Target, Send, Calendar, Video, User, CheckCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useState } from "react"
import { adminApi } from "@/services/adminApi"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/context/AuthContext"

export function BookMarketing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const isDoctor = role === 'doctor';

  const services = [
    { 
      id: 'social', 
      label: isDoctor ? 'Doctor Profile & Social Media Growth' : 'Social Media Management', 
      description: isDoctor ? 'Grow your clinical reputation and patient following on Instagram & LinkedIn' : 'Build brand authority across digital platforms',
      icon: Megaphone 
    },
    { 
      id: 'seo', 
      label: isDoctor ? 'OPD Search & Google Ranking (SEO)' : 'Local SEO & Visibility', 
      description: isDoctor ? 'Rank #1 when patients in your city search for your medical specialty' : 'Optimize local search and Google Business Profile',
      icon: Target 
    },
    { 
      id: 'ads', 
      label: isDoctor ? 'Appointment Ads (Google & Meta)' : 'Digital Ads (PPC)', 
      description: isDoctor ? 'Drive high-intent patient bookings directly into your OPD queue' : 'Targeted search and social campaigns for footfall',
      icon: TrendingUp 
    },
    { 
      id: 'branding', 
      label: 'Doctor Branding & Health Awareness Reels', 
      description: 'Professional medical reels, patient education videos, and verified badge setup',
      icon: Video 
    }
  ];

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      toast('Please select at least one marketing service', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const preferredTimeVal = form.get('preferredTime');
      const customNotes = form.get('notes') as string;
      const budgetVal = form.get('budget') as string;

      const serviceLabels = selectedServices.map(
        id => services.find(s => s.id === id)?.label || id
      );

      const doctorPrefix = isDoctor && user?.name 
        ? `Doctor: Dr. ${user.name}${user.designation ? ` (${user.designation})` : ''}`
        : null;

      const fullNotes = [
        doctorPrefix,
        customNotes ? `Goals: ${customNotes.trim()}` : null,
      ].filter(Boolean).join(' | ');

      await adminApi.requestMarketing({
        campaignType: serviceLabels.join(', '),
        services: serviceLabels,
        preferredTime: preferredTimeVal ? String(preferredTimeVal) : null,
        notes: fullNotes || null,
        budget: budgetVal ? Number(budgetVal) : null,
      });

      setIsSubmitted(true);
      toast('Marketing request submitted to MediQuee Admin!', 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to submit request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#F7F8FA] min-h-[calc(100vh-80px)] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border shadow-xs px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { if (isDoctor) navigate('/doctor'); else navigate(-1); }} 
            className="p-2 -ml-2 rounded-xl text-[#0A1A3D] hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[18px] font-black text-[#0A1A3D] tracking-tight">
              {isDoctor ? "Doctor Marketing & Branding" : "Hospital Marketing"}
            </h1>
            <p className="text-[11px] font-bold text-muted">MediQuee Growth Accelerator</p>
          </div>
        </div>

        {isDoctor && (
          <span className="bg-[#EBF5FF] text-[#1B5DF1] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            DOCTOR
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 max-w-2xl mx-auto w-full">
        
        {/* Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-gradient-to-br from-[#1B5DF1] via-[#154fc9] to-[#0A1A3D] rounded-[24px] p-6 text-white mb-5 shadow-[0_8px_24px_rgba(27,93,241,0.2)] relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <Megaphone className="w-36 h-36 -mt-4 -mr-4" />
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <span className="bg-surface/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-block w-fit backdrop-blur-md">
              {isDoctor ? 'FOR DOCTORS & SPECIALISTS' : 'HEALTHCARE MARKETING'}
            </span>
            <h2 className="text-[22px] font-black tracking-tight leading-tight">
              {isDoctor ? 'Expand Your Patient Reach' : 'Boost Your Hospital Footfall'}
            </h2>
            <p className="text-[#EBF5FF]/90 text-[13px] leading-relaxed max-w-md font-medium">
              {isDoctor 
                ? 'Get specialized digital marketing, social presence, and patient appointment growth managed directly by MediQuee experts.'
                : 'Specialized marketing services designed specifically for healthcare providers to increase OPD bookings and institutional reputation.'}
            </p>
          </div>

          {/* User badge */}
          {user && (
            <div className="mt-4 pt-3.5 border-t border-white/15 flex items-center gap-2.5 text-[12px] font-semibold text-white/90">
              <div className="w-7 h-7 rounded-full bg-surface/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <span>
                Booking as <strong className="text-white font-bold">{isDoctor ? `Dr. ${user.name}` : user.name}</strong>
                {user.hospital?.name ? ` • ${user.hospital.name}` : ''}
              </span>
            </div>
          )}
        </motion.div>

        {isSubmitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-surface rounded-[24px] p-8 flex flex-col items-center justify-center text-center shadow-sm border border-border flex-1 gap-4"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[20px] font-black text-[#0A1A3D]">Request Received by Admin!</h3>
              <p className="text-muted text-[13px] max-w-sm font-medium leading-relaxed">
                Your marketing booking has been routed to the MediQuee Super Admin Requests desk. Our healthcare growth strategist will coordinate with you at your preferred time.
              </p>
            </div>
            <button 
              onClick={() => navigate(isDoctor ? '/doctor' : '/dashboard')} 
              className="mt-2 bg-[#1B5DF1] hover:bg-[#1244B6] text-white font-bold py-3.5 px-8 rounded-xl shadow-md shadow-[#1B5DF1]/20 active:scale-95 transition-all text-[14px]"
            >
              {isDoctor ? "Return to Doctor Dashboard" : "Go to Dashboard"}
            </button>
          </motion.div>
        ) : (
          <motion.form 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            onSubmit={handleSubmit} 
            className="flex flex-col gap-4 flex-1"
          >
            
            {/* Services selection */}
            <div className="bg-surface rounded-[24px] p-5 shadow-xs border border-border flex flex-col gap-3">
              <div>
                <h3 className="font-bold text-[#0A1A3D] text-[15px]">Select Services Interested In</h3>
                <p className="text-[12px] text-muted font-medium">Choose one or more campaigns tailored for your clinical practice</p>
              </div>
              
              <div className="flex flex-col gap-2.5 mt-1">
                {services.map(service => {
                  const Icon = service.icon;
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <div 
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-[#1B5DF1] bg-[#EBF5FF]/50 shadow-xs' 
                          : 'border-border bg-gray-50/70 hover:bg-gray-100/70'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#1B5DF1] text-white shadow-sm' : 'bg-surface text-muted border border-border shadow-2xs'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col flex-1 pr-2">
                        <span className={`font-bold text-[14px] ${isSelected ? 'text-[#1B5DF1]' : 'text-[#0A1A3D]'}`}>
                          {service.label}
                        </span>
                        <span className="text-[12px] text-muted font-medium mt-0.5 leading-snug">
                          {service.description}
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-[#1B5DF1] bg-[#1B5DF1]' : 'border-gray-300 bg-surface'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-surface rounded-full"></div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Contact & Objectives Card */}
            <div className="bg-surface rounded-[24px] p-5 shadow-xs border border-border flex flex-col gap-4">
              <h3 className="font-bold text-[#0A1A3D] text-[15px] border-b border-gray-100 pb-2">
                Consultation & Preferences
              </h3>
              
              {/* Preferred Time */}
              <div>
                <label className="text-[12px] font-bold text-[#0A1A3D] mb-1.5 block">Preferred Time to Connect</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <select 
                    name="preferredTime" 
                    required 
                    className="w-full bg-gray-50 border border-border text-[#0A1A3D] font-medium rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#1B5DF1] focus:ring-4 focus:ring-[#1B5DF1]/10 transition-all text-[13px] appearance-none"
                  >
                    <option value="">Select convenient time window</option>
                    <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                    <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                    <option value="Evening (4 PM - 7 PM)">Evening (4 PM - 7 PM)</option>
                  </select>
                </div>
              </div>

              {/* Goals / Notes */}
              <div>
                <label className="text-[12px] font-bold text-[#0A1A3D] mb-1.5 block">
                  Specific Objectives & Specialty Focus (Optional)
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder={isDoctor 
                    ? "e.g., Want to increase cardiology OPD appointments, promote new weekend consultation hours, or build Instagram awareness reels." 
                    : "e.g., Promote executive health checkups and maternity packages in our local city radius."}
                  className="w-full bg-gray-50 border border-border text-[#0A1A3D] font-medium rounded-xl p-3.5 focus:outline-none focus:border-[#1B5DF1] focus:ring-4 focus:ring-[#1B5DF1]/10 transition-all text-[13px] placeholder:text-muted/60"
                />
              </div>

              {/* Estimated Budget */}
              <div>
                <label className="text-[12px] font-bold text-[#0A1A3D] mb-1.5 block">
                  Estimated Monthly Marketing Budget (Optional)
                </label>
                <select 
                  name="budget" 
                  className="w-full bg-gray-50 border border-border text-[#0A1A3D] font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-[#1B5DF1] focus:ring-4 focus:ring-[#1B5DF1]/10 transition-all text-[13px] appearance-none"
                >
                  <option value="">Select budget range</option>
                  <option value="15000">₹10,000 - ₹20,000 / month (Starter)</option>
                  <option value="35000">₹25,000 - ₹50,000 / month (Growth)</option>
                  <option value="75000">₹50,000+ / month (Enterprise & Branding)</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-2 pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting || selectedServices.length === 0}
                className="w-full bg-[#1B5DF1] hover:bg-[#1244B6] text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-[#1B5DF1]/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 text-[15px]"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Submit Marketing Request <Send className="w-4 h-4 ml-1" /></>
                )}
              </button>
            </div>
            
          </motion.form>
        )}
      </div>
    </div>
  )
}
