import { motion } from "framer-motion"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { authApi } from "@/services/authApi"
import { Mail, Lock, ArrowRight, Activity, ShieldCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["admin", "doctor", "nurse", "receptionist", "lab"]),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: 'admin'
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      // Credentials and role are verified by the backend.
      const session = await authApi.login({ email: data.email, password: data.password, role: data.role });
      login(session.token, session.role);
      if (session.role === 'lab') navigate("/lab");
      else if (session.role === 'doctor') navigate("/doctor");
      else if (session.role === 'nurse') navigate("/nurse");
      else if (session.role === 'receptionist') navigate("/receptionist");
      else navigate("/dashboard");
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to sign in', 'error');
    }
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
            className="flex flex-col items-center mb-2"
          >
            <img src={import.meta.env.BASE_URL + 'logo-icon.png'} alt="MediQuee" className="w-16 h-16 rounded-2xl shadow-md object-contain mb-3" />
            <img src={import.meta.env.BASE_URL + 'logo.png'} alt="MediQuee" className="h-7 w-auto object-contain" />
          </motion.div>
          <h1 className="text-xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted text-xs mt-0.5">Log in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/80 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70">
                <Mail className="w-5 h-5" />
              </div>
              <input
                {...register("email")}
                type="email"
                placeholder="Email address"
                className={`w-full pl-12 pr-4 py-3.5 bg-surface border ${errors.email ? 'border-red-500 focus:ring-red-500/10' : 'border-border focus:border-primary focus:ring-primary/10'} rounded-2xl outline-none focus:ring-4 transition-all text-sm font-medium`}
              />
            </div>
            {errors.email && <span className="text-red-500 text-xs ml-1 font-medium">{errors.email.message}</span>}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/80 ml-1">Role</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <select 
                {...register("role")}
                className={`w-full pl-12 pr-4 py-3.5 bg-surface border ${errors.role ? 'border-red-500 focus:ring-red-500/10' : 'border-border focus:border-primary focus:ring-primary/10'} rounded-2xl outline-none focus:ring-4 transition-all text-sm font-medium appearance-none`}
              >
                <option value="admin">Hospital Admin</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="receptionist">Receptionist</option>
                <option value="lab">Lab</option>
              </select>
            </div>
            {errors.role && <span className="text-red-500 text-xs ml-1 font-medium">{errors.role.message}</span>}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-semibold text-foreground/80">Password</label>
              <a href="#" className="text-xs text-primary font-bold hover:underline">Forgot?</a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                {...register("password")}
                type="password" 
                placeholder="••••••••" 
                className={`w-full pl-12 pr-4 py-3.5 bg-surface border ${errors.password ? 'border-red-500 focus:ring-red-500/10' : 'border-border focus:border-primary focus:ring-primary/10'} rounded-2xl outline-none focus:ring-4 transition-all text-sm font-medium`}
              />
            </div>
            {errors.password && <span className="text-red-500 text-xs ml-1 font-medium">{errors.password.message}</span>}
          </motion.div>

          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl mt-4 shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            Log In
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <span className="text-muted text-sm">Don't have an account? </span>
          <Link to="/register" className="text-primary font-bold text-sm hover:underline">Sign up</Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-4 pt-3 border-t border-border/60 text-center"
        >
          <span className="text-xs text-muted">Need help? Call Support: </span>
          <a href="tel:8331045500" className="text-xs font-bold text-primary hover:underline">8331045500</a>
        </motion.div>
      </motion.div>
    </div>
  )
}
