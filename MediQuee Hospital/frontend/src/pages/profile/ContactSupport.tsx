import { useState } from "react"
import { 
  ArrowLeft, PhoneCall, Mail, MessageSquare, Clock, ShieldCheck, 
  ChevronDown, ChevronUp, Copy, Check, ExternalLink, Headphones, 
  HelpCircle, Building2, Calendar, FileText, Zap, Award
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

interface PartnerFaq {
  q: string;
  a: string;
  category: string;
}

const PARTNER_FAQS: PartnerFaq[] = [
  {
    category: "Financial & Settlements",
    q: "How do weekly 80/20 settlements work?",
    a: "Settlements are calculated every Monday for all completed OP consultations, video appointments, diagnostic lab bookings, and home nursing care from the preceding week. The hospital receives 80% net revenue directly into its registered bank account, with platform processing at 20%. You can inspect itemized breakdown slips anytime in the Payouts tab."
  },
  {
    category: "Doctor Slots & Scheduling",
    q: "How do I update doctor consultation slots and OP timings?",
    a: "Navigate to Staff Management or Doctor Schedules from your menu. Select the doctor profile to edit active days, morning/evening consultation windows, token caps, and video appointment availability. All schedule modifications sync to the patient mobile app in real time."
  },
  {
    category: "Diagnostic & Compliance",
    q: "How do I upload lab reports and verify regulatory licenses?",
    a: "Diagnostic laboratory reports can be uploaded as PDFs or high-resolution images directly from the Lab Dashboard under 'Upload Report'. All regulatory licenses (Clinical Establishment Act registration, Diagnostic Lab License) are stored securely under Hospital Information -> Licensing & Regulatory Documents."
  },
  {
    category: "Marketing & Platform Growth",
    q: "How do hospital marketing banner and campaign approvals work?",
    a: "Submit promotional banner requests, doctor branding reels, or medical camp proposals via Profile -> My Requests or the 'Book Marketing' shortcut. MediQuee's growth team reviews target locations and assets within 24 hours and updates status directly in your portal."
  },
  {
    category: "Staff & User Access",
    q: "How do I add or manage doctors, nurses, receptionists, and lab staff?",
    a: "As a Hospital Administrator, go to Profile -> Staff Management and tap 'Add Staff'. Choose the role (Doctor, Receptionist, Nurse, Lab Staff) and assign credentials. Each staff member receives their dedicated, role-protected dashboard immediately."
  }
];

export function ContactSupport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@mediquee.com");
    setCopiedEmail(true);
    toast("Email address copied to clipboard!", "success");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello MediQuee Partner Support, I am contacting from ${user?.hospital?.name || 'SM_Hospital'} regarding partner assistance.`
  );
  const whatsappUrl = `https://wa.me/918331045500?text=${whatsappMessage}`;

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)] pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md pt-4 pb-3 px-4 border-b border-border flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(user?.role === 'lab' || (user as any)?.role === 'LAB_ADMIN' ? '/lab/profile' : '/profile');
              }
            }} 
            className="p-2 -ml-2 text-muted hover:text-foreground transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Partner Support Desk</h1>
            <p className="text-xs text-muted">Dedicated executive & operational support for hospital partners</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Support Online
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6 max-w-4xl mx-auto w-full mt-2">
        {/* Top Executive Priority Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Direct Phone Call */}
          <div className="bg-surface rounded-2xl border border-border hover:border-[#1769E0]/40 transition-all p-5 shadow-sm flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1769E0] border border-blue-100 flex items-center justify-center shadow-xs">
                <PhoneCall className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-[#1769E0] text-[10px] font-bold uppercase rounded-md border border-blue-200">
                24/7 Helpline
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Hospital Priority Desk</span>
              <h3 className="text-xl font-black text-foreground mt-0.5 font-mono">8331045500</h3>
              <p className="text-xs text-muted mt-1">Direct hot-line for emergency escalation and urgent assistance.</p>
            </div>

            <a
              href="tel:8331045500"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1769E0] hover:bg-[#1255b8] text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Partner Desk</span>
            </a>
          </div>

          {/* Card 2: Email Technical & Billing Support */}
          <div className="bg-surface rounded-2xl border border-border hover:border-emerald-300 transition-all p-5 shadow-sm flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md border border-emerald-200">
                Billing & SLA
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Email Support Team</span>
              <h3 className="text-sm font-bold text-foreground mt-0.5 font-mono truncate" title="support@mediquee.com">
                support@mediquee.com
              </h3>
              <p className="text-xs text-muted mt-1">Technical bugs, payout inquiries & integration queries.</p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="mailto:support@mediquee.com"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-muted hover:text-foreground rounded-xl transition-colors cursor-pointer"
                title="Copy email to clipboard"
              >
                {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Card 3: WhatsApp Priority Support */}
          <div className="bg-surface rounded-2xl border border-border hover:border-green-400 transition-all p-5 shadow-sm flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 border border-green-100 flex items-center justify-center shadow-xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded-md border border-green-200 flex items-center gap-1">
                <Zap className="w-3 h-3 text-green-600" />
                Fastest Reply
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">WhatsApp Priority Chat</span>
              <h3 className="text-base font-bold text-foreground mt-0.5">MediQuee Partner Bot</h3>
              <p className="text-xs text-muted mt-1">Chat directly with your partner operations executive via WhatsApp.</p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>

        {/* Operational Support SLA & Hours Card */}
        <div className="bg-surface rounded-3xl border border-border shadow-sm p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1769E0] flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Operational Support & SLA Details</h2>
                <p className="text-xs text-muted">Guaranteed service levels for MediQuee hospital network</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-3 py-1 bg-blue-50 text-[#1769E0] border border-blue-200 text-xs font-bold rounded-xl">
              Enterprise Tier SLA
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50/80 dark:bg-gray-900/30 rounded-2xl border border-border/60 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[#1769E0]">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Technical Desk</span>
              </div>
              <span className="text-sm font-black text-foreground">24/7 Availability</span>
              <p className="text-[11px] text-muted">Emergency OPD token sync, app downtime & server status</p>
            </div>

            <div className="p-4 bg-gray-50/80 dark:bg-gray-900/30 rounded-2xl border border-border/60 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-emerald-600">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Settlements Desk</span>
              </div>
              <span className="text-sm font-black text-foreground">Mon–Sat · 9 AM – 8 PM</span>
              <p className="text-[11px] text-muted">Weekly bank payouts, reconciliation & tax invoices</p>
            </div>

            <div className="p-4 bg-gray-50/80 dark:bg-gray-900/30 rounded-2xl border border-border/60 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-purple-600">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Response SLA</span>
              </div>
              <span className="text-sm font-black text-foreground">&lt; 15 Mins Target</span>
              <p className="text-[11px] text-muted">Priority response for active hospital partners</p>
            </div>
          </div>
        </div>

        {/* Quick Help / Partner FAQs Accordion */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#1769E0]" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Partner Knowledge & FAQs</h2>
            </div>
            <span className="text-xs text-muted">{PARTNER_FAQS.length} Articles</span>
          </div>

          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden divide-y divide-border/60">
            {PARTNER_FAQS.map((faq, index) => {
              const isOpen = expandedFaq === index;

              return (
                <div key={index} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="p-4 sm:p-5 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/40 flex items-center justify-between gap-4 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1769E0]">
                        {faq.category}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {faq.q}
                      </span>
                    </div>

                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all",
                      isOpen ? "bg-blue-50 text-[#1769E0] border-blue-200" : "bg-gray-50 dark:bg-gray-800 text-muted border-border"
                    )}>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-foreground/80 leading-relaxed bg-gray-50/40 dark:bg-gray-900/10">
                          <p>{faq.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
