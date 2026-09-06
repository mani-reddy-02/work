import { User, Bell, Shield, Settings, LogOut, ChevronRight, Building2, Users, LayoutGrid, Key, HelpCircle, MessageSquare, FileSignature, Calendar, History, Stethoscope } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { useState } from "react"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { cn } from "@/lib/utils"

export function Profile() {
  const navigate = useNavigate();
  const { logout, role } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  const appLinks = [
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Shield, label: "Security & Privacy", path: "/security" },
    { icon: Settings, label: "App Settings", path: "/settings" },
  ];

  const supportLinks = [
    { icon: HelpCircle, label: "Help & Support", path: "/support" },
    { icon: MessageSquare, label: "Contact Support", path: "/contact" },
  ];

  const accountLinks = (role === 'doctor' || role === 'nurse' || role === 'receptionist') ? [
    { icon: User, label: "Personal Information", path: "/profile/personal" },
  ] : [
    { icon: Building2, label: "Hospital Information", path: "/profile/hospital" },
  ];

  const professionalLinks = role === 'doctor' ? [
    { icon: FileSignature, label: "E-Prescription Settings", path: "/profile/erx" },
    { icon: Calendar, label: "Clinic Schedule", path: "/profile/schedule" },
    { icon: History, label: "Consultation History", path: "/profile/history" },
  ] : [];

  const operationLinks = ((role as string) === 'admin' || (role as string) === 'superadmin') ? [
    { icon: Users, label: "Staff Management", path: "/profile/staff" },
    { icon: LayoutGrid, label: "Departments", path: "/profile/departments" },
    { icon: Key, label: "Permissions", path: "/profile/permissions" },
  ] : [];

  const isDoctor = role === 'doctor';

  const renderSection = (title: string, links: any[]) => (
    <div className="flex flex-col gap-2 mb-6">
      <h3 className={cn("text-[14px] font-semibold px-1 uppercase tracking-wider", isDoctor ? "text-gray-400" : "text-[#667085]")}>{title}</h3>
      <div className={cn("bg-white rounded-2xl overflow-hidden", isDoctor ? "border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]" : "border border-gray-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]")}>
        {links.map((link, index) => (
          <motion.button 
            key={index}
            variants={item}
            onClick={() => navigate(link.path)} 
            className="w-full flex items-center justify-between p-4 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", isDoctor ? "bg-[#EBF5FF] text-[#1B5DF1] border-[#1B5DF1]/10" : "bg-gray-50 text-[#667085] border-gray-100")}>
                <link.icon className="w-4 h-4" />
              </div>
              <span className={cn("font-semibold text-[15px]", isDoctor ? "text-[#0A1A3D]" : "text-[#172033]")}>{link.label}</span>
            </div>
            <ChevronRight className={cn("w-4 h-4", isDoctor ? "text-gray-400" : "text-[#98A2B3]")} />
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={cn("flex flex-col min-h-full pb-[120px]", isDoctor ? "bg-gray-50/30" : "bg-background")}>
      
      {/* Sticky Top Controls */}
      <div className={cn("sticky top-0 z-30 pt-4 pb-3 px-4 flex justify-between items-center", isDoctor ? "bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]" : "bg-background/95 backdrop-blur-md border-b border-gray-100/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]")}>
        <h1 className={cn("text-[22px]", isDoctor ? "font-black text-[#0A1A3D] tracking-tight" : "font-semibold text-[#172033]")}>Profile</h1>
      </div>

      <div className="flex flex-col px-4 pt-5">
        
        {/* Profile Header */}
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/profile/edit')}
          className={cn("w-full text-left bg-white rounded-2xl p-5 mb-6 flex items-center justify-between interactive-element active:bg-gray-50/50", isDoctor ? "shadow-md border border-gray-100" : "shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/60")}
        >
          <div className="flex items-center gap-4">
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden", isDoctor ? "bg-[#1B5DF1] text-white border-2 border-[#0A1A3D] shadow-lg text-xl font-black" : "bg-blue-50 text-primary border border-blue-100")}>
              {isDoctor ? "J" : <User className="w-7 h-7" />}
            </div>
            <div className="flex flex-col">
              <h2 className={cn("text-[18px]", isDoctor ? "font-black text-[#0A1A3D] tracking-tight" : "font-bold text-[#172033]")}>
                {isDoctor ? "Dr. Jane Smith" : "Admin User"}
              </h2>
              <p className={cn("text-[13px] font-medium", isDoctor ? "text-gray-500" : "text-[#667085]")}>
                {isDoctor ? "jane.smith@mediquee.com" : "user@mediquee.com"}
              </p>
              <div className="mt-1.5 flex items-center">
                {isDoctor ? (
                  <span className="bg-[#EBF5FF] text-[#1B5DF1] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-[#1B5DF1]/20 flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> Senior Cardiologist
                  </span>
                ) : role === 'nurse' ? (
                  <span className="bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-orange-100 flex items-center gap-1">
                    Home Care Nurse
                  </span>
                ) : role === 'receptionist' ? (
                  <span className="bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-purple-100 flex items-center gap-1">
                    Front Desk Receptionist
                  </span>
                ) : (
                  <span className="bg-blue-50 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-blue-100">
                    Hospital Administrator
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className={cn("w-5 h-5", isDoctor ? "text-gray-400" : "text-[#98A2B3]")} />
        </motion.button>

        {/* Menu Sections */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col"
        >
          {renderSection("Account", accountLinks)}
          {professionalLinks.length > 0 && renderSection("Professional", professionalLinks)}
          {operationLinks.length > 0 && renderSection("Operations", operationLinks)}
          {renderSection("App", appLinks)}
          {renderSection("Support", supportLinks)}
        </motion.div>

        {/* Logout */}
        <div className="mt-2 pt-4 pb-8">
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-red-200 text-red-600 font-bold shadow-[0_2px_8px_rgba(220,38,38,0.05)] active:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </motion.button>
        </div>
      </div>

      <ConfirmationSheet 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Logout?"
        description="Are you sure you want to log out of your account?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleLogout}
      />
    </div>
  )
}
