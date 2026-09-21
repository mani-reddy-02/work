import { ArrowLeft, Stethoscope, Users, Building2, ShieldCheck, Activity, Send, CheckCircle2, MessageSquare, Phone } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useState } from "react"
import { adminApi } from "@/services/adminApi"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/context/AuthContext"

export function AboutMediQuee() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const subject = String(form.get('subject') || '').trim();
      const message = String(form.get('message') || '').trim();
      const contactPerson = String(form.get('contactPerson') || '').trim();
      const contactPhone = String(form.get('contactPhone') || '').trim();
      const contactEmail = String(form.get('contactEmail') || '').trim();

      if (!subject || !message) {
        toast('Please provide a subject and message', 'warning');
        setIsSubmitting(false);
        return;
      }

      await adminApi.requestInquiry({
        subject,
        message,
        contactPerson: contactPerson || user?.name,
        contactPhone: contactPhone || user?.phone,
        contactEmail: contactEmail || user?.email,
      });

      setIsSubmitted(true);
      toast('Your information has been sent to MediQuee Admin!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to send inquiry to Admin', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)] pb-28">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-900 text-white rounded-b-[36px] shadow-lg pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10">
          <div className="pt-4 pb-3 px-4 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/80 hover:text-white hover:bg-surface/10 rounded-full transition-colors" title="Back">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-[18px] font-bold">About MediQuee</h1>
          </div>
          <div className="px-6 pt-2 pb-2">
            <h2 className="text-2xl font-bold mb-2">Empowering Modern Healthcare</h2>
            <p className="text-blue-100 text-sm leading-relaxed max-w-xl">
              Transforming healthcare operations with end-to-end OPD queue intelligence, telemedicine, and enterprise analytics.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-20 flex flex-col gap-6">
        {/* Mission Statement */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <div className="mb-4 bg-white/95 p-3 rounded-2xl w-fit shadow-sm border border-border/40">
            <img src={import.meta.env.BASE_URL + 'logo.png'} alt="MediQuee" className="h-9 w-auto object-contain" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" /> Our Mission
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            At MediQuee, our mission is to empower hospitals and clinics with intelligent, digital-first tools that eliminate patient waiting friction, simplify doctor schedules, and deliver transparent revenue settlements.
          </p>
        </motion.div>

        {/* Key Features Grid */}
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-bold text-foreground px-1">Key Pillars</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }} className="bg-surface border border-blue-100/80 rounded-2xl p-4 flex flex-col gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Smart OPD Queues</h4>
                <p className="text-xs text-muted mt-0.5">Real-time token calls and doctor availability.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-surface border border-emerald-100/80 rounded-2xl p-4 flex flex-col gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Facility Management</h4>
                <p className="text-xs text-muted mt-0.5">Automated departments, staff & lab sync.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="bg-surface border border-purple-100/80 rounded-2xl p-4 flex flex-col gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Telemedicine</h4>
                <p className="text-xs text-muted mt-0.5">High-definition audio & video consultations.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-surface border border-amber-100/80 rounded-2xl p-4 flex flex-col gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Security & Privacy</h4>
                <p className="text-xs text-muted mt-0.5">HIPAA-compliant encrypted clinical records.</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Interactive Inquiry / Connect with Admin Card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-surface rounded-3xl p-6 shadow-sm border border-border flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-foreground">Contact MediQuee Admin</h3>
              <p className="text-[12px] text-muted">Request demo, custom integrations, or platform assistance</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-background rounded-2xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-primary flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-muted font-medium">Customer Support Helpline</span>
                <p className="text-sm font-bold text-foreground">8331045500</p>
              </div>
            </div>
            <a href="tel:8331045500" className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-colors">
              Call Now
            </a>
          </div>

          {isSubmitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-foreground">Information Sent to Admin!</h4>
              <p className="text-sm text-gray-600 max-w-sm">
                MediQuee Administration has received your inquiry and will reach out to you via call or email.
              </p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="mt-2 text-sm text-indigo-600 font-semibold hover:underline"
              >
                Send another inquiry
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Subject / Inquiry Topic</label>
                <select name="subject" required className="w-full bg-gray-50 border border-border text-foreground rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm">
                  <option value="Platform Demo & Walkthrough">Platform Demo & Walkthrough</option>
                  <option value="Hospital Expansion & Multi-Branch">Hospital Expansion & Multi-Branch</option>
                  <option value="Custom Hardware / Token Display Integration">Custom Hardware / Token Display Integration</option>
                  <option value="Billing & Commission Support">Billing & Commission Support</option>
                  <option value="General Partnership & Feedback">General Partnership & Feedback</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Contact Person</label>
                  <input 
                    type="text" 
                    name="contactPerson" 
                    defaultValue={user?.name || ''} 
                    placeholder="e.g. Dr. Ramesh / Hospital Director" 
                    className="w-full bg-gray-50 border border-border text-foreground rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Contact Phone</label>
                  <input 
                    type="tel" 
                    name="contactPhone" 
                    defaultValue={user?.phone || '8331045500'} 
                    placeholder="e.g. 8331045500" 
                    className="w-full bg-gray-50 border border-border text-foreground rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Message / Requirements</label>
                <textarea 
                  name="message" 
                  rows={3} 
                  required 
                  placeholder="Share details on your requirements, schedule, or questions for the admin team..."
                  className="w-full bg-gray-50 border border-border text-foreground rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-md shadow-indigo-200 active:scale-[0.98] transition-all disabled:opacity-70 mt-1"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Submit Information to Admin <Send className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}
        </motion.div>

      </div>
    </div>
  )
}

