import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { BottomNav } from "./BottomNav"
import { SideNav } from "./SideNav"
import { Header } from "./Header"
import { QuickAddMenu } from "./QuickAddMenu"
import { useAuth } from "@/context/AuthContext"
import { ShieldAlert, PhoneCall } from "lucide-react"

export function AppLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const vStatus = user?.hospital?.verificationStatus;
  const isPending = Boolean(
    user?.hospital &&
    vStatus !== 'APPROVED' &&
    vStatus !== 'VERIFIED'
  );

  return (
    <div className="h-screen bg-background flex font-sans relative overflow-hidden selection:bg-primary/20">
      {/* Desktop Sidebar */}
      <SideNav 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onQuickAdd={() => setIsQuickAddOpen(true)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full max-w-[100vw]">
        <Header 
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />

        {/* Global Verification Pending Alert Strip */}
        {isPending && (
          <div className="bg-amber-500/15 border-b border-amber-400/40 px-4 py-2 text-xs font-medium text-amber-950 flex items-center justify-between gap-3 shrink-0 z-30">
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Account Verification Pending:</strong> Operations are restricted until approved by MediQuee Administration.
              </span>
            </div>
            <a
              href="tel:8331045500"
              className="shrink-0 text-amber-900 font-bold hover:underline inline-flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
              <span>Helpline: 8331045500</span>
            </a>
          </div>
        )}
        
        <main className="flex-1 w-full max-w-7xl mx-auto md:p-6 relative overflow-y-auto pb-[100px] md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet context={{ onToggleSidebar: () => setIsSidebarOpen(prev => !prev), isSidebarOpen }} />
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <BottomNav onQuickAdd={() => setIsQuickAddOpen(true)} />
      </div>

      {/* Modals */}
      <QuickAddMenu isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
    </div>
  )
}




