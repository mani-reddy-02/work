import { ArrowLeft, User, Bell, Shield, Settings, LogOut, ChevronRight, Building2, Users, LayoutGrid, FileSignature, Calendar, History, Stethoscope, Send, Headphones, HeartHandshake, Home, Activity, Sparkles, CheckCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { nurseApi } from "@/services/nurseApi"
import { cn } from "@/lib/utils"

export function Profile() {
  const navigate = useNavigate();
  const { logout, role, user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [liveStats, setLiveStats] = useState<{
    visitsToday: number;
    upcoming: number;
    inProgress: number;
    completed: number;
  } | null>(null);

  useEffect(() => {
    refreshUser();
    if (role === 'nurse') {
      nurseApi.getDashboard().then(dash => {
        if (dash?.stats) {
          setLiveStats(dash.stats);
        }
      }).catch(() => {});
    }
  }, [role]);

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
    { icon: Settings, label: t('app_settings', 'App Settings'), path: "/settings", subtitle: "Preferences & system settings" },
  ];

  const supportLinks = [
    { icon: Headphones, label: t('contact_support', 'Contact Support'), path: "/contact", subtitle: "Priority partner desk, phone, email & FAQs" },
  ];

  const accountLinks = role === 'doctor' ? [
    { icon: User, label: t('personal_info', 'Personal Information'), path: "/profile/personal", subtitle: "Clinical credentials, license & contact details" },
    { icon: Send, label: "My Requests", path: "/requests", subtitle: "Doctor branding & marketing requests" },
  ] : (role === 'nurse' || role === 'receptionist') ? [
    { icon: User, label: t('personal_info', 'Personal Information'), path: "/profile/personal", subtitle: "Credentials, license, contact & hospital details" },
  ] : [
    { icon: Building2, label: t('hospital_info', 'Hospital Information'), path: "/profile/hospital", subtitle: "Facility metadata, contacts & licenses" },
    { icon: Send, label: "My Requests", path: "/requests", subtitle: "Marketing campaigns & platform requests" },
  ];

  const professionalLinks = role === 'doctor' ? [
    { icon: FileSignature, label: t('eprescription_settings', 'E-Prescription Settings'), path: "/profile/erx" },
    { icon: Calendar, label: t('clinic_schedule', 'Clinic Schedule'), path: "/profile/schedule" },
    { icon: History, label: t('consultation_history', 'Consultation History'), path: "/profile/history" },
  ] : role === 'nurse' ? [
    { icon: Home, label: "Assigned Home Visits", path: "/nurse/visits", subtitle: "Active patient visits & care updates" },
    { icon: Calendar, label: "Duty & Shift Calendar", path: "/nurse/calendar", subtitle: "Daily schedule & appointments" },
  ] : [];

  const operationLinks = ((role as string) === 'admin' || (role as string) === 'superadmin') ? [
    { icon: Users, label: t('staff_management', 'Staff Management'), path: "/profile/staff", subtitle: "Manage doctors, nurses, reception & lab" },
    { icon: LayoutGrid, label: t('departments_list', 'Departments'), path: "/profile/departments", subtitle: "Clinical specialties and units" },
    { icon: HeartHandshake, label: t('nursing_services', 'Nursing Services'), path: "/profile/nursing-services", subtitle: "View offered services & manage offerings" },
  ] : [];

  const isDoctor = role === 'doctor';
  const isNurse = role === 'nurse';

  const renderSection = (title: string, links: any[]) => (
    <div className="flex flex-col gap-2 mb-6">
      <h3 className="text-[13px] font-black px-1 uppercase tracking-wider text-muted">{title}</h3>
      <div className="bg-surface rounded-2xl overflow-hidden border border-border shadow-sm">
        {links.map((link, index) => (
          <motion.button 
            key={index}
            variants={item}
            onClick={() => navigate(link.path)} 
            className="w-full flex items-center justify-between p-4 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", isDoctor ? "bg-blue-50 text-[#1769E0] border-blue-100" : isNurse ? "bg-blue-50 text-[#1769E0] border-blue-100" : "bg-gray-50 text-muted border-border")}>
                <link.icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[15px] text-foreground">{link.label}</span>
                {link.subtitle && (
                  <span className="text-[12px] text-muted font-medium mt-0.5">{link.subtitle}</span>
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

  const profileHeaderTarget = (role === 'doctor' || role === 'nurse' || role === 'receptionist') 
    ? '/profile/personal' 
    : '/profile/hospital';

  return (
    <div className="flex flex-col min-h-full pb-[120px] bg-background">
      
      {/* Sticky Top Controls */}
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex items-center justify-between bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(homeDashboardPath)} 
            className="p-2 -ml-2 text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-[#0A1A3D]" />
          </button>
          <div>
            <h1 className="text-[20px] font-black text-[#0A1A3D]">{t('profile', 'Profile')}</h1>
            <p className="text-[11px] text-muted font-medium">Real-time account & credentials</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/profile/personal')}
          className="text-xs font-bold text-[#1769E0] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors cursor-pointer"
        >
          View Details
        </button>
      </div>

      <div className="flex flex-col px-4 pt-5">
        
        {/* Profile Header */}
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(profileHeaderTarget)}
          className="w-full text-left bg-surface rounded-2xl p-5 mb-4 flex items-center justify-between interactive-element active:bg-gray-50/50 shadow-sm border border-border group hover:border-[#1769E0]/40 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden font-black text-2xl shadow-sm transition-transform group-hover:scale-105",
              "bg-gradient-to-br from-[#1769E0] to-blue-700 text-white"
            )}>
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[18px] font-black text-[#0A1A3D] truncate">
                  {user?.name || "—"}
                </h2>
                <CheckCircle2 className="w-4 h-4 text-[#1769E0] shrink-0" />
              </div>
              <p className="text-[13px] font-medium text-muted truncate">
                {user?.email || "—"}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                {isDoctor ? (
                  <>
                    <span className="bg-[#EBF5FF] text-[#1769E0] text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border border-[#1769E0]/20 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" /> Doctor
                    </span>
                    {(user?.designation || user?.specialization) && (
                      <span className="text-[11px] font-semibold text-muted truncate">
                        • {user?.designation || user?.specialization}
                      </span>
                    )}
                  </>
                ) : isNurse ? (
                  <>
                    <span className="bg-blue-50 text-[#1769E0] text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                      <HeartHandshake className="w-3 h-3" /> Nurse
                    </span>
                    {(user?.designation || user?.specialization) && (
                      <span className="text-[11px] font-bold text-muted truncate">
                        • {user?.designation || user?.specialization}
                      </span>
                    )}
                    {user?.active !== false && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    )}
                  </>
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
                  <span className="bg-blue-50 text-[#1769E0] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-blue-100">
                    Hospital Administrator
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted/70 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </motion.button>

        {/* Real-time Activity Card for Nurse */}
        {isNurse && liveStats && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-2xl p-4 mb-6 border border-border shadow-sm flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#1769E0]" />
                Live Visits Summary
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                Real-Time
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => navigate('/nurse/visits', { state: { tab: 'today' } })}
                className="p-2 rounded-xl bg-blue-50/60 border border-blue-100 text-center hover:bg-blue-100/60 transition-colors"
              >
                <span className="text-[17px] font-black text-[#1769E0] block leading-tight">{liveStats.visitsToday}</span>
                <span className="text-[9px] font-bold text-muted uppercase">Today</span>
              </button>
              <button
                onClick={() => navigate('/nurse/visits', { state: { tab: 'in_progress' } })}
                className="p-2 rounded-xl bg-amber-50/60 border border-amber-200 text-center hover:bg-amber-100/60 transition-colors"
              >
                <span className="text-[17px] font-black text-amber-600 block leading-tight">{liveStats.inProgress}</span>
                <span className="text-[9px] font-bold text-muted uppercase">Active</span>
              </button>
              <button
                onClick={() => navigate('/nurse/visits', { state: { tab: 'upcoming' } })}
                className="p-2 rounded-xl bg-indigo-50/60 border border-indigo-100 text-center hover:bg-indigo-100/60 transition-colors"
              >
                <span className="text-[17px] font-black text-indigo-600 block leading-tight">{liveStats.upcoming}</span>
                <span className="text-[9px] font-bold text-muted uppercase">Upcoming</span>
              </button>
              <button
                onClick={() => navigate('/nurse/visits', { state: { tab: 'history' } })}
                className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center hover:bg-emerald-100/60 transition-colors"
              >
                <span className="text-[17px] font-black text-emerald-600 block leading-tight">{liveStats.completed}</span>
                <span className="text-[9px] font-bold text-muted uppercase">Finished</span>
              </button>
            </div>
          </motion.div>
        )}

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
