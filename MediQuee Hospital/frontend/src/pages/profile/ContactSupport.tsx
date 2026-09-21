import { ArrowLeft, Send, Mail, PhoneCall } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useToast } from "@/context/ToastContext"
import { useState } from "react"
import { useTranslation } from "react-i18next"

export function ContactSupport() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    if (!subject || !message) {
      toast("Please fill in all fields", "error");
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSubject("");
      setMessage("");
      toast("Message sent to support! We will get back to you shortly.", "success");
    }, 1000);
  };

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)] transition-colors">
      <div className="sticky top-0 z-30 bg-background pt-4 pb-3 px-4 border-b border-border flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t('contact_support')}</h1>
      </div>

      <div className="p-4 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3">
          <a 
            href="tel:8331045500" 
            className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-foreground">Call Us</span>
            <span className="text-xs text-primary font-bold">8331045500</span>
          </a>
          <a 
            href="mailto:support@mediquee.com" 
            className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 bg-green-50/50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-foreground">Email Us</span>
            <span className="text-xs text-muted">support@mediquee.com</span>
          </a>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface rounded-2xl border border-border shadow-sm p-4 flex flex-col gap-4">
          <h2 className="font-bold text-foreground">Send us a message</h2>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Subject</label>
            <input 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              type="text" 
              placeholder="How can we help?" 
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground" 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Message</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4} 
              placeholder="Describe your issue..." 
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none text-foreground" 
            />
          </div>

          <button 
            onClick={handleSend}
            disabled={isSending}
            className="bg-blue-600 text-white font-bold rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors mt-2 disabled:opacity-50"
          >
            {isSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />} 
            {isSending ? 'Sending...' : 'Send Message'}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
