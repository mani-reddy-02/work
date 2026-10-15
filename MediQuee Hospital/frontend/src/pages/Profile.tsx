import { ArrowLeft, User, Bell, Shield, Settings, LogOut, ChevronRight, Building2, Users, LayoutGrid, FileSignature, Calendar, History, Stethoscope, Send, Headphones, HeartHandshake } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { cn } from "@/lib/utils"

export function Profile() {
  const navigate = useNavigate();
  const { logout, role, user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    refreshUser();
  }, []);

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
    { icon: Bell, label: t('notifications', 'Notifications'), path: "/notifications", subtitle: "Alerts & appointment updates" },
    { icon: Shield, label: t('security', 'Security & Privacy'), path: "/security", subtitle: "Credentials & account safety" },
    { icon: Settings, label: t('app_settings', 'App Settings'), path: "/settings", subtitle: "Preferences & preferences" },
  ];

  const supportLinks = [
    { icon: Headphones, label: t('contact_support', 'Contact Support'), path: "/contact", subtitle: "Priority partner desk, phone, email & FAQs" },
  ];

  const accountLinks = role === 'doctor' ? [
    { icon: User, label: t('personal_info', 'Personal Information'), path: "/profile/personal", subtitle: "Profile and contact details" },
    { icon: Send, label: "My Requests", path: "/requests", subtitle: "Doctor branding & marketing requests" },
  ] : (role === 'nurse' || role === 'receptionist') ? [
    { icon: User, label: t('personal_info', 'Personal Information'), path: "/profile/personal", subtitle: "Profile and contact details" },
  ] : [
    { icon: Building2, label: t('hospital_info', 'Hospital Information'), path: "/profile/hospital", subtitle: "Facility metadata, contacts & licenses" },
    { icon: Send, label: "My Requests", path: "/requests", subtitle: "Marketing campaigns & platform requests" },
  ];

  const professionalLinks = role === 'doctor' ? [
    { icon: FileSignature, label: t('eprescription_settings', 'E-Prescription Settings'), path: "/profile/erx" },
    { icon: Calendar, label: t('clinic_schedule', 'Clinic Schedule'), path: "/profile/schedule" },
    { icon: History, label: t('consultation_history', 'Consultation History'), path: "/profile/history" },
  ] : [];

  const operationLinks = ((role as string) === 'admin' || (role as string) === 'superadmin') ? [
    { icon: Users, label: t('staff_management', 'Staff Management'), path: "/profile/staff", subtitle: "Manage doctors, nurses, reception & lab" },
    { icon: LayoutGrid, label: t('departments_list', 'Departments'), path: "/profile/departments", subtitle: "Clinical specialties and units" },
    { icon: HeartHandshake, label: 'Home Nursing Services', path: "/home-nursing", subtitle: "Select and configure offered nursing services" },
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
            className="w-full flex items-center justify-between p-4 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", isDoctor ? "bg-blue-50/50 dark:bg-blue-900/20 text-primary border-blue-100 dark:border-blue-900/30" : "bg-gray-50 dark:bg-gray-800 text-muted border-border")}>
                <link.icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[15px] text-foreground">{link.label}</span>
                {link.subtitle && (
                  <span className="text-[12px] text-muted font-normal mt-0.5">{link.subtitle}</span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted/70 shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );

  const homeDashboardPath = (() => {
    switch (role) {
      case 'doctor':
        return '/doctor';
      case 'nurse':
        return '/nurse';
      case 'receptionist':
        return '/receptionist';
      case 'lab':
        return '/lab';
      default:
        return '/dashboard';
    }
  })();

  return (
    <div className="flex flex-col min-h-full pb-[120px] bg-background">
      
      {/* Sticky Top Controls */}
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex items-center gap-3 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <button 
          onClick={() => navigate(homeDashboardPath)} 
          className="p-2 -ml-2 text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[20px] font-bold text-foreground">{t('profile', 'Profile')}</h1>
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
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                {isDoctor ? (
                  <>
                    <span className="bg-[#EBF5FF] text-[#1B5DF1] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-[#1B5DF1]/20 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" /> Doctor
                    </span>
                    {(user?.designation || user?.specialization) && (
                      <span className="text-[11px] font-semibold text-muted">
                        • {user?.designation || user?.specialization}
                      </span>
                    )}
                  </>
                ) : role === 'nurse' ? (
                  <span className="bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-orange-100 flex items-center gap-1">
                    Home Care Nurse
                  </span>
                ) : role === 'receptionist' ? (
                  <>
                    <span className="bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-purple-100 flex items-center gap-1">
                      Front Desk Receptionist
                    </span>
                    {user?.designation && (
                      <span className="text-[11px] font-semibold text-muted">
                        • {user.designation}
                      </span>
                    )}
                    {user?.active !== undefined && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1",
                        user.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </>
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
