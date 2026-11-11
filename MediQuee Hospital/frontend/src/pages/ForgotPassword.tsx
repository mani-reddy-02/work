import { useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, PhoneCall } from "lucide-react"

export function ForgotPassword() {
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [role, setRole] = useState("admin")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailOrPhone.trim()) {
      setError("Please enter your registered email or mobile number")
      return
    }

    setIsSubmitting(true)
    setError("")

    // Simulated response pending WhatsApp OTP reset backend integration
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-surface backdrop-blur-xl border border-white/50 rounded-[32px] p-8 shadow-2xl shadow-blue-900/5 relative z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex flex-col items-center mb-3"
          >
            <img
              src={import.meta.env.BASE_URL + "logo.png"}
              alt="MediQuee Hospital"
              className="h-10 w-auto object-contain"
            />
          </motion.div>
          <h1 className="text-xl font-bold text-foreground">Forgot Password</h1>
          <p className="text-muted text-xs mt-0.5 text-center">
            Recover your hospital portal access
          </p>
        </div>

        {isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center gap-4 py-2"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-base font-bold text-foreground">
                Request Submitted
              </h2>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                If an active account exists for{" "}
                <span className="font-semibold text-foreground">
                  {emailOrPhone}
                </span>{" "}
                with the role of{" "}
                <span className="capitalize font-semibold text-foreground">
                  {role}
                </span>
                , password reset verification instructions will be delivered to your registered contact.
              </p>
            </div>

            <div className="w-full bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 flex items-center gap-3 text-left">
              <PhoneCall className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-slate-800">Need instant reset help?</p>
                <p className="text-slate-500">
                  Call Hospital Support at{" "}
                  <a
                    href="tel:8331045500"
                    className="font-bold text-blue-600 hover:underline"
                  >
                    8331045500
                  </a>
                </p>
              </div>
            </div>

            <Link
              to="/login"
              className="w-full mt-2 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-primary/20 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/80 ml-1">
                Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface border border-border focus:border-primary focus:ring-primary/10 rounded-2xl outline-none focus:ring-4 transition-all text-sm font-medium appearance-none"
                >
                  <option value="admin">Hospital Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="lab">Lab</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/80 ml-1">
                Email or Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => {
                    setEmailOrPhone(e.target.value)
                    if (error) setError("")
                  }}
                  placeholder="Enter registered email or phone"
                  className={`w-full pl-12 pr-4 py-3.5 bg-surface border ${
                    error
                      ? "border-red-500 focus:ring-red-500/10"
                      : "border-border focus:border-primary focus:ring-primary/10"
                  } rounded-2xl outline-none focus:ring-4 transition-all text-sm font-medium`}
                />
              </div>
              {error && (
                <span className="text-red-500 text-xs ml-1 font-medium">
                  {error}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Reset Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center mt-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-muted hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </Link>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted">
            Need help? Call Support:{" "}
            <a
              href="tel:8331045500"
              className="text-foreground font-bold hover:underline"
            >
              8331045500
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

