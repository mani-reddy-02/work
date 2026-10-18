import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  ChevronRight, FlaskConical, Settings, Bell, Shield, 
  Phone, LogOut, Info, Home, Book, CheckCircle2, 
  ArrowLeft, Edit3, MapPin, Mail, PhoneCall, Package, CheckCircle
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { labApi } from "@/services/labApi"

interface LabProfileData {
  id: string;
  name: string;
  labName: string;
  hospitalName: string;
  businessType: string;
  inChargeName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  roleBadge: string;
  verificationBadge: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  formattedAddress: string;
  labLicenseNumber: string;
  operationalHours: string;
  homeCollectionAvailable: boolean;
  stats: {
    activeTestsCount: number;
    packagesCount: number;
    completedOrdersCount: number;
    totalTestsCount: number;
  };
}

export function LabProfile() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [showLogout, setShowLogout] = useState(false)
  const [profile, setProfile] = useState<LabProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loadProfile = async () => {
      try {
        const data = await labApi.getLabProfile()
        if (isMounted && data) {
          setProfile(data)
        }
      } catch (err) {
        console.error("Failed to load lab profile:", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadProfile()
    return () => { isMounted = false }
  }, [])

  const MenuRow = ({ 
    icon: Icon, 
    label, 
    subtitle,
    color = 'text-[#667085]', 
    iconBg = 'bg-gray-50', 
    badge,
    onClick 
  }: {
    icon: typeof FlaskConical; 
    label: string; 
    subtitle?: string;
    color?: string; 
    iconBg?: string; 
    badge?: string | number;
    onClick: () => void
  }) => (
    <button 
      onClick={onClick} 
      className="flex items-center gap-3.5 px-4 md:px-5 py-3.5 md:py-4 hover:bg-gray-50/80 active:bg-gray-100/80 transition-colors text-left w-full cursor-pointer group"
    >
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0 border border-black/5 group-hover:scale-105 transition-transform`}>
        <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] md:text-[15px] font-semibold text-[#172033] dark:text-white leading-tight truncate">{label}</p>
        {subtitle && <p className="text-[12px] text-[#667085] mt-0.5 truncate">{subtitle}</p>}
      </div>
      {badge !== undefined && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
          {badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-[#98A2B3] group-hover:text-primary transition-colors shrink-0" />
    </button>
  )

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-surface rounded-2xl md:rounded-3xl border border-border shadow-xs overflow-hidden">
      <p className="text-[11px] md:text-[12px] font-bold text-[#98A2B3] uppercase tracking-wider px-4 md:px-5 pt-4 pb-2">{title}</p>
      <div className="divide-y divide-gray-100/80 dark:divide-gray-800">{children}</div>
    </div>
  )

  const effectiveLabName = profile?.labName || profile?.name || user?.hospital?.name || 'MediQuee Diagnostic Laboratory'
  const effectiveInCharge = profile?.inChargeName || profile?.ownerName || user?.name || 'Lab In-Charge'
  const effectiveEmail = profile?.email || profile?.ownerEmail || user?.email || 'lab@mediquee.com'
  const effectivePhone = profile?.phone || profile?.ownerPhone || user?.phone || 'Contact registered'
  const effectiveLocation = profile?.city 
    ? `${profile.city}${profile.state ? `, ${profile.state}` : ''}`
    : (user?.hospital?.city ? `${user.hospital.city}, ${user.hospital.state || 'India'}` : 'Location on file')

  return (
    <div className="flex flex-col bg-background min-h-screen w-full relative">
      {/* Solid Non-Overlapping Header */}
      <header className="sticky top-0 z-30 bg-surface/98 backdrop-blur-md border-b border-border shadow-xs px-4 md:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/lab')} 
            className="p-2 -ml-2 text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-[#0A1A3D] dark:text-white" />
          </button>
          <div>
            <h1 className="text-[18px] md:text-[22px] font-black text-[#0A1A3D] dark:text-white">Profile</h1>
            <p className="text-[11px] text-muted font-medium">Real-time facility & diagnostic credentials</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/lab/info')}
          className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-xl border border-primary/20 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </header>

      {/* Main Profile Content */}
      <div className="flex flex-col gap-5 md:gap-6 px-4 md:px-6 pt-5 md:pt-6 pb-20 max-w-3xl mx-auto w-full">
        
        {/* Lab Profile Hero Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl md:rounded-3xl border border-border p-5 md:p-7 shadow-xs relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6 text-center sm:text-left">
            {/* Lab Icon with Live Verified Ring */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#1769E0] to-blue-700 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-md shadow-primary/25 border-2 border-white dark:border-gray-800">
                <FlaskConical className="w-10 h-10 md:w-12 md:h-12 text-white" strokeWidth={1.8} />
              </div>
              <div 
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-surface flex items-center justify-center shadow-xs" 
                title="Verified & Active Diagnostic Partner"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            </div>

            {/* Profile Meta Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  DIAGNOSTIC LAB
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Verified & Active
                </span>
              </div>

              <h2 className="text-[20px] md:text-[24px] font-black text-[#172033] dark:text-white leading-tight">
                {effectiveLabName}
              </h2>
              
              <p className="text-[14px] md:text-[15px] font-medium text-[#667085] mt-1">
                In-Charge: <strong className="text-[#172033] dark:text-gray-200 font-semibold">{effectiveInCharge}</strong>
              </p>

              {/* Direct Info Pills */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-[12px] md:text-[13px] text-[#667085]">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>{effectiveEmail}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{effectivePhone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{effectiveLocation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Quick-Stats Counters Grid */}
          <div className="grid grid-cols-3 gap-2.5 md:gap-4 mt-6 pt-5 border-t border-border/70">
            <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-xl md:rounded-2xl p-3 md:p-3.5 text-center border border-border/50">
              <div className="flex items-center justify-center gap-1 text-[11px] md:text-[12px] font-semibold text-[#667085] mb-0.5">
                <FlaskConical className="w-3.5 h-3.5 text-primary" />
                <span className="truncate">Active Tests</span>
              </div>
              <p className="text-[18px] md:text-[22px] font-black text-[#172033] dark:text-white">
                {isLoading ? "…" : (profile?.stats?.activeTestsCount ?? 0)}
              </p>
            </div>

            <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-xl md:rounded-2xl p-3 md:p-3.5 text-center border border-border/50">
              <div className="flex items-center justify-center gap-1 text-[11px] md:text-[12px] font-semibold text-[#667085] mb-0.5">
                <Package className="w-3.5 h-3.5 text-purple-600" />
                <span className="truncate">Test Packages</span>
              </div>
              <p className="text-[18px] md:text-[22px] font-black text-purple-600">
                {isLoading ? "…" : (profile?.stats?.packagesCount ?? 0)}
              </p>
            </div>

            <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-xl md:rounded-2xl p-3 md:p-3.5 text-center border border-border/50">
              <div className="flex items-center justify-center gap-1 text-[11px] md:text-[12px] font-semibold text-[#667085] mb-0.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate">Completed</span>
              </div>
              <p className="text-[18px] md:text-[22px] font-black text-emerald-600">
                {isLoading ? "…" : (profile?.stats?.completedOrdersCount ?? 0)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Laboratory Sub-Screens Section */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Section title="Laboratory Management">
            <MenuRow 
              icon={Info} 
              label="Lab Information & Documents" 
              subtitle="Facility metadata, license numbers & certificates"
              iconBg="bg-blue-50 dark:bg-blue-900/30" 
              color="text-primary" 
              onClick={() => navigate('/lab/info')} 
            />
            <MenuRow 
              icon={FlaskConical} 
              label="Test Catalog" 
              subtitle="Manage live diagnostic test offerings & prices"
              badge={profile?.stats?.activeTestsCount}
              iconBg="bg-purple-50 dark:bg-purple-900/30" 
              color="text-purple-600" 
              onClick={() => navigate('/lab/test-catalog')} 
            />
            <MenuRow 
              icon={Book} 
              label="Test Packages" 
              subtitle="Multi-test health checkup packages & discounts"
              badge={profile?.stats?.packagesCount}
              iconBg="bg-emerald-50 dark:bg-emerald-900/30" 
              color="text-emerald-600" 
              onClick={() => navigate('/lab/packages')} 
            />
            <MenuRow 
              icon={Home} 
              label="Home Collection Settings" 
              subtitle="Timings, phlebotomist slots & collection fees"
              iconBg="bg-amber-50 dark:bg-amber-900/30" 
              color="text-amber-600" 
              onClick={() => navigate('/lab/home-collection')} 
            />
          </Section>
        </motion.div>

        {/* App & Preferences Section */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Section title="System & Security">
            <MenuRow 
              icon={Bell} 
              label="Notifications" 
              subtitle="Order alerts, collection reminders & reports"
              iconBg="bg-blue-50 dark:bg-blue-900/30" 
              color="text-primary" 
              onClick={() => navigate('/lab/notifications')} 
            />
            <MenuRow 
              icon={Shield} 
              label="Security & Privacy" 
              subtitle="Password, session credentials & access control"
              iconBg="bg-red-50 dark:bg-red-900/30" 
              color="text-red-500" 
              onClick={() => navigate('/lab/security')} 
            />
            <MenuRow 
              icon={Settings} 
              label="App Settings" 
              subtitle="Operational preferences & system sound alerts"
              iconBg="bg-gray-100 dark:bg-gray-800" 
              color="text-[#667085]" 
              onClick={() => navigate('/lab/settings')} 
            />
          </Section>
        </motion.div>

        {/* Partner Support Desk (Cleaned up, redundant Help & Support removed) */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Section title="Partner Support">
            <MenuRow 
              icon={Phone} 
              label="Contact Support (8331045500)" 
              subtitle="Dedicated priority partner desk, WhatsApp & FAQs"
              iconBg="bg-emerald-50 dark:bg-emerald-900/30" 
              color="text-emerald-600" 
              onClick={() => navigate('/contact')} 
            />
          </Section>
        </motion.div>

        {/* Logout Button */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            type="button"
            onClick={() => setShowLogout(true)}
            className="w-full bg-red-50/90 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 rounded-2xl md:rounded-3xl py-3.5 md:py-4 flex items-center justify-center gap-2 md:gap-3 text-red-600 dark:text-red-400 font-bold text-[15px] md:text-[16px] hover:bg-red-100/90 active:bg-red-200 transition-colors cursor-pointer shadow-xs"
          >
            <LogOut className="w-5 h-5 md:w-5 md:h-5" />
            Logout from Laboratory
          </button>
        </motion.div>

        <p className="text-center text-[12px] md:text-[13px] text-[#98A2B3] mt-2 pb-4">
          MediQuee Partner Portal • Diagnostic Laboratory Suite v2.4
        </p>
      </div>

      <ConfirmationSheet
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        title="Logout from Laboratory?"
        description="Are you sure you want to end your current session? You will be returned to the partner login screen."
        confirmLabel="Logout"
        cancelLabel="Stay Logged In"
        isDestructive
        onConfirm={() => { logout(); navigate('/login') }}
      />
    </div>
  )
}
