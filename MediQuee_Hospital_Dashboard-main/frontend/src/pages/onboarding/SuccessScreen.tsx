import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SuccessScreenProps {
  businessType: "hospital" | "laboratory";
}

export function SuccessScreen({ businessType }: SuccessScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#16A34A]/20 to-[#1769E0]/20 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white p-8 md:p-12 rounded-[32px] shadow-2xl shadow-black/5 flex flex-col items-center text-center max-w-md w-full relative z-10"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          className="w-24 h-24 bg-[#16A34A]/10 text-[#16A34A] rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>

        <h1 className="text-[28px] font-black text-[#172033] tracking-tight mb-3">
          Registration Submitted!
        </h1>
        
        <p className="text-[15px] text-[#667085] leading-relaxed mb-8">
          Your {businessType} registration has been successfully submitted and is pending verification. You will be able to log in once an administrator approves your account.
        </p>

        <button
          onClick={() => navigate("/login")}
          className="w-full h-14 bg-[#172033] hover:bg-black active:scale-[0.98] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-black/10"
        >
          Go to Login
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>

    </div>
  );
}
