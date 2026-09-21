import { ArrowLeft, Search, HelpCircle, FileText, MessageCircle, ChevronDown, ChevronUp, PhoneCall } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { useTranslation } from "react-i18next"

export function HelpSupport() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { q: "How to reset my password?", a: "Go to Security & Privacy in your Profile, then select Change Password." },
    { q: "How to add a new doctor?", a: "Navigate to Staff Management and click 'Add Doctor' to register a new physician." },
    { q: "Where can I view daily revenue?", a: "Your Payouts dashboard contains detailed daily, weekly, and monthly revenue metrics." },
    { q: "How to schedule a home collection?", a: "Go to the Lab dashboard, select Home Collection, and click 'Create Booking'." },
  ];

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)] transition-colors">
      <div className="sticky top-0 z-30 bg-background pt-4 pb-3 px-4 border-b border-border flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t('help_support')}</h1>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Direct Helpline Card */}
        <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-primary flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-muted font-medium">Direct Support Helpline</span>
              <p className="text-sm font-bold text-foreground">8331045500</p>
            </div>
          </div>
          <a href="tel:8331045500" className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-colors">
            Call Support
          </a>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search for help..." 
            className="w-full bg-surface border border-border rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary text-foreground transition-colors shadow-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="w-10 h-10 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-foreground">Documentation</span>
          </button>
          <button className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="w-10 h-10 bg-green-50/50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-foreground">Community</span>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-foreground px-1">Frequently Asked Questions</h2>
          <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
            {faqs.map((faq, i) => (
              <div key={i} className="flex flex-col border-b border-border last:border-0">
                <button 
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-foreground flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-muted shrink-0" />
                    {faq.q}
                  </div>
                  {expandedFaq === i ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                </button>
                {expandedFaq === i && (
                  <div className="px-11 pb-4 text-sm text-muted bg-gray-50/50 dark:bg-gray-800/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
