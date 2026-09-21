import { User, Bell, Shield, Settings, LogOut, ChevronRight, Building2, Users, LayoutGrid, Key, HelpCircle, MessageSquare, FileSignature, Calendar, History, Stethoscope } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { cn } from "@/lib/utils"

export function Profile() {
  const navigate = useNavigate();
  const { logout, role, user } = useAuth();
  const { t } = useTranslation();
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
    { icon: Bell, label: t('notifications', 'Notifications'), path: "/notifications" },
    { icon: Shield, label: t('security', 'Security & Privacy'), path: "/security" },
    { icon: Settings, label: t('app_settings', 'App Settings'), path: "/settings" },
  ];

  const supportLinks = [
    { icon: HelpCircle, label: t('help_support', 'Help & Support'), path: "/support" },
    { icon: MessageSquare, label: t('contact_support', 'Contact Support'), path: "/contact" },
  ];

  const accountLinks = (role === 'doctor' || role === 'nurse' || role === 'receptionist') ? [
    { icon: User, label: t('personal_info', 'Personal Information'), path: "/profile/personal" },
  ] : [
    { icon: Building2, label: t('hospital_info', 'Hospital Information'), path: "/profile/hospital" },
  ];

  const professionalLinks = role === 'doctor' ? [
    { icon: FileSignature, label: t('eprescription_settings', 'E-Prescription Settings'), path: "/profile/erx" },
    { icon: Calendar, label: t('clinic_schedule', 'Clinic Schedule'), path: "/profile/schedule" },
    { icon: History, label: t('consultation_history', 'Consultation History'), path: "/profile/history" },
  ] : [];

  const operationLinks = ((role as string) === 'admin' || (role as string) === 'superadmin') ? [
    { icon: Users, label: t('staff_management', 'Staff Management'), path: "/profile/staff" },
    { icon: LayoutGrid, label: t('departments_list', 'Departments'), path: "/profile/departments" },
    { icon: Key, label: "Permissions", path: "/profile/permissions" },
  ] : [];

  const isDoctor = role === 'doctor';

  const renderSection = (title: string, links: any[]) => (
    <div className="flex flex-col gap-2 mb-6">
      <h3 className="text-[14px] font-semibold px-1 uppercase tracking-wider text-muted">{title}</h3>
      <div className="bg-surface rounded-2xl overflow-hidden border border-border shadow-sm">
        {links.map((link, index) => (
          <motion.button 
            key={index}
            variants={item}
            onClick={() => navigate(link.path)} 
            className="w-full flex items-center justify-between p-4 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", isDoctor ? "bg-blue-50/50 dark:bg-blue-900/20 text-primary border-blue-100 dark:border-blue-900/30" : "bg-gray-50 dark:bg-gray-800 text-muted border-border")}>
                <link.icon className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[15px] text-foreground">{link.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted/70" />
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full pb-[120px] bg-background">
      
      {/* Sticky Top Controls */}
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex justify-between items-center bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <h1 className="text-[22px] font-semibold text-foreground">{t('profile', 'Profile')}</h1>
      </div>

      <div className="flex flex-col px-4 pt-5">
        
        {/* Profile Header */}
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/profile/edit')}
          className="w-full text-left bg-surface rounded-2xl p-5 mb-6 flex items-center justify-between interactive-element active:bg-gray-50/50 dark:active:bg-gray-800/50 shadow-sm border border-border"
        >
          <div className="flex items-center gap-4">
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden", isDoctor ? "bg-primary text-white border-2 border-foreground shadow-lg text-xl font-black" : "bg-blue-50/50 dark:bg-blue-900/20 text-primary border border-blue-100 dark:border-blue-900/30")}>
              <User className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[18px] font-bold text-foreground">
                {user?.name || "—"}
              </h2>
              <p className="text-[13px] font-medium text-muted">
                {user?.email || "—"}
              </p>
              <div className="mt-1.5 flex items-center">
                {isDoctor ? (
                  <span className="bg-[#EBF5FF] text-[#1B5DF1] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-[#1B5DF1]/20 flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> Doctor
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
          <ChevronRight className="w-5 h-5 text-muted/70" />
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
            className="w-full flex items-center justify-center gap-2 p-4 bg-surface rounded-2xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold shadow-sm hover:bg-red-50 dark:hover:bg-red-900/10 active:scale-95 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>{t('logout')}</span>
          </motion.button>
        </div>
      </div>

      <ConfirmationSheet 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={t('logout') + "?"}
        description="Are you sure you want to log out of your account?"
        confirmLabel={t('logout')}
        cancelLabel={t('cancel')}
        isDestructive={true}
        onConfirm={handleLogout}
      />
    </div>
  )
}
