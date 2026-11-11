import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Clock, PhoneCall, Mail, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export function VerificationBanner() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Verification is required for hospital/lab facilities
  const vStatus = user?.hospital?.verificationStatus;
  const isPending = Boolean(
    user?.hospital &&
    vStatus !== 'APPROVED' &&
    vStatus !== 'VERIFIED'
  );

  // If verification is completed, do not render the banner
  if (!isPending) {
    return null;
  }

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshUser();
      toast("Checked verification status", "info");
    } catch (e) {
      toast("Unable to check status. Please try again.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50 border-2 border-amber-400/50 text-amber-950 shadow-sm"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 mt-0.5 text-amber-800">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                Facility Verification Pending
              </h3>
              <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-900 border border-amber-500/30">
                Awaiting Admin Approval
              </span>
            </div>
            <p className="text-[13px] text-amber-900/90 mt-1 leading-relaxed max-w-3xl">
              Your hospital account has been created and is currently awaiting verification by MediQuee Administration. 
              <strong> All facility operations (adding doctors, staff, departments, accepting appointments, and requesting payouts) are locked</strong> until an administrator verifies and activates your account. Please wait for approval or contact support for expedited review.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch lg:self-center shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-amber-200">
          <a
            href="tel:8331045500"
            className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition-all shadow-sm shadow-amber-600/20 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call: 8331045500</span>
          </a>
          
          <a
            href="mailto:support@mediquee.com?subject=Expedite%20Hospital%20Verification"
            className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/80 hover:bg-white text-amber-900 border border-amber-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4 text-amber-700" />
            <span>Email Admin</span>
          </a>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Check if Admin has approved"
            className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white/80 hover:bg-white text-amber-800 border border-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

