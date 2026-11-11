import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, PhoneCall, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function VerificationPendingShield({
  title = "Feature Locked — Verification Required",
  description = "This action is restricted because your facility account is awaiting approval by MediQuee Administration. Operations such as adding doctors, staff, creating departments, and requesting payouts are unlocked once your account has been verified."
}: {
  title?: string;
  description?: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-surface border border-border/80 rounded-3xl p-6 md:p-8 shadow-xl text-center flex flex-col items-center"
      >
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-amber-600">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md border-2 border-surface">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 border border-amber-500/30 mb-3">
          Verification Pending
        </span>

        <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-2">
          {title}
        </h2>

        <p className="text-sm text-muted leading-relaxed max-w-md mb-6">
          {description}
        </p>

        <div className="w-full bg-muted/30 border border-border/60 rounded-2xl p-4 mb-6 text-left flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Need Expedited Approval?
          </span>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            <a
              href="tel:8331045500"
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call: 8331045500</span>
            </a>
            <a
              href="mailto:support@mediquee.com?subject=Expedite%20Hospital%20Verification"
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs font-semibold hover:bg-muted/50 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-muted" />
              <span>support@mediquee.com</span>
            </a>
          </div>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-muted/60 hover:bg-muted text-foreground text-sm font-semibold transition-colors w-full cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </motion.div>
    </div>
  );
}

