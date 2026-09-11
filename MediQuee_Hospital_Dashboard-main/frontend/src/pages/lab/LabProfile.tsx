import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronRight, FlaskConical, Settings, Bell, Shield, HelpCircle, Phone, LogOut, Info, Home, Book } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"

export function LabProfile() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showLogout, setShowLogout] = useState(false)

  const MenuRow = ({ icon: Icon, label, color = 'text-[#667085]', iconBg = 'bg-gray-50', onClick }: {
    icon: typeof FlaskConical; label: string; color?: string; iconBg?: string; onClick: () => void
  }) => (
    <button onClick={onClick} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left w-full">
      <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-4.5 h-4.5 ${color}`} strokeWidth={1.8} />
      </div>
      <span className="flex-1 text-[15px] font-medium text-[#172033]">{label}</span>
      <ChevronRight className="w-4 h-4 text-[#98A2B3]" />
    </button>
  )

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <p className="text-[12px] font-bold text-[#98A2B3] uppercase tracking-widest px-4 pt-4 pb-2">{title}</p>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  )

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-4 md:px-6 pt-5 md:pt-6 pb-3 md:pb-4 border-b border-gray-100/50">
        <h1 className="text-[22px] md:text-[28px] font-bold text-[#172033]">Profile</h1>
      </div>

      <div className="flex flex-col gap-4 md:gap-6 px-4 md:px-6 pt-5 md:pt-8 pb-6 max-w-2xl mx-auto w-full">
        {/* Lab Avatar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 md:gap-4 py-5 md:py-8">
          <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-blue-500 to-primary rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20">
            <FlaskConical className="w-10 h-10 md:w-14 md:h-14 text-white" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-[18px] md:text-[22px] font-bold text-[#172033]">City Care Diagnostics</p>
            <p className="text-[14px] md:text-[16px] text-[#667085]">Lab Owner</p>
            <p className="text-[13px] md:text-[15px] text-[#98A2B3] mt-0.5 md:mt-1">admin@citycarediag.com</p>
          </div>
        </motion.div>

        {/* Laboratory Section */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Section title="Laboratory">
            <MenuRow icon={Info} label="Lab Information" iconBg="bg-blue-50" color="text-primary" onClick={() => navigate('/lab/info')} />
            <MenuRow icon={FlaskConical} label="Test Catalog" iconBg="bg-purple-50" color="text-purple-600" onClick={() => navigate('/lab/test-catalog')} />
            <MenuRow icon={Book} label="Test Packages" iconBg="bg-emerald-50" color="text-emerald-600" onClick={() => navigate('/lab/packages')} />
            <MenuRow icon={Home} label="Home Collection Settings" iconBg="bg-amber-50" color="text-amber-600" onClick={() => navigate('/lab/home-collection')} />
          </Section>
        </motion.div>

        {/* App Section */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Section title="App">
            <MenuRow icon={Bell} label="Notifications" iconBg="bg-blue-50" color="text-primary" onClick={() => navigate('/lab/notifications')} />
            <MenuRow icon={Shield} label="Security & Privacy" iconBg="bg-red-50" color="text-red-500" onClick={() => navigate('/lab/security')} />
            <MenuRow icon={Settings} label="App Settings" iconBg="bg-gray-100" color="text-[#667085]" onClick={() => navigate('/lab/settings')} />
          </Section>
        </motion.div>

        {/* Support Section */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <Section title="Support">
            <MenuRow icon={HelpCircle} label="Help & Support" iconBg="bg-teal-50" color="text-teal-600" onClick={() => {}} />
            <MenuRow icon={Phone} label="Contact Support" iconBg="bg-green-50" color="text-green-600" onClick={() => {}} />
          </Section>
        </motion.div>

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onClick={() => setShowLogout(true)}
            className="w-full bg-red-50 border border-red-100 rounded-2xl md:rounded-3xl py-3.5 md:py-4 flex items-center justify-center gap-2 md:gap-3 text-red-600 font-semibold text-[15px] md:text-[16px] hover:bg-red-100 active:bg-red-200 transition-colors"
          >
            <LogOut className="w-5 h-5 md:w-6 md:h-6" />
            Logout
          </button>
        </motion.div>

        <p className="text-center text-[12px] md:text-[14px] text-[#98A2B3] mt-4">MediQuee Laboratory v1.0.0</p>
      </div>

      <ConfirmationSheet
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        title="Logout?"
        description="You will be returned to the login screen."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => { logout(); navigate('/login') }}
      />
    </div>
  )
}
