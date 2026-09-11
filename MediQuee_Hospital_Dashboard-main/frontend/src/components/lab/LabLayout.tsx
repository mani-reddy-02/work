import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { LabHeader } from "./LabHeader"
import { LabBottomNav } from "./LabBottomNav"
import { LabQuickAddMenu } from "./LabQuickAddMenu"
import { LabSideNav } from "./LabSideNav"

const LAB_HEADER_HIDDEN = ['/lab/add-test', '/lab/create-order', '/lab/upload-report', '/lab/add-package', '/lab/home-collection/create', '/lab/order/', '/lab/report/']

export function LabLayout() {
  const location = useLocation()
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const hideHeader = LAB_HEADER_HIDDEN.some(r => location.pathname.startsWith(r))

  return (
    <div className="h-screen bg-background flex font-sans relative overflow-hidden selection:bg-primary/20">
      
      {/* Desktop Sidebar */}
      <LabSideNav onQuickAdd={() => setIsQuickAddOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full max-w-[100vw]">
        {!hideHeader && <LabHeader />}

        <main className="flex-1 w-full max-w-7xl mx-auto md:p-6 relative overflow-y-auto pb-[100px] md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <LabBottomNav onQuickAdd={() => setIsQuickAddOpen(true)} />
      </div>

      <LabQuickAddMenu isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
    </div>
  )
}
