import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { BottomNav } from "./BottomNav"
import { SideNav } from "./SideNav"
import { Header } from "./Header"
import { QuickAddMenu } from "./QuickAddMenu"

export function AppLayout() {
  const location = useLocation();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  return (
    <div className="h-screen bg-background flex font-sans relative overflow-hidden selection:bg-primary/20">
      {/* Desktop Sidebar */}
      <SideNav onQuickAdd={() => setIsQuickAddOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full max-w-[100vw]">
        <Header />
        
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
              <Outlet />
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




