import { motion, AnimatePresence } from "framer-motion"
import { X, FlaskConical, Package, Upload, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface LabQuickAddMenuProps {
  isOpen: boolean
  onClose: () => void
}

const options = [
  {
    icon: FlaskConical,
    title: "Add Test",
    description: "Add a new test to your catalog",
    route: "/lab/add-test",
    iconBg: "bg-blue-50",
    iconColor: "text-primary",
  },
  {
    icon: Package,
    title: "Add Test Package",
    description: "Bundle tests into a package",
    route: "/lab/add-package",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    icon: Upload,
    title: "Upload Report",
    description: "Attach a completed report to an order",
    route: "/lab/upload-report",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
]

export function LabQuickAddMenu({ isOpen, onClose }: LabQuickAddMenuProps) {
  const navigate = useNavigate()

  const handleSelect = (route: string) => {
    onClose()
    navigate(route)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-lg mx-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="px-5 pb-2 pt-3 flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-bold text-[#172033]">Quick Add</h2>
                <p className="text-[13px] text-[#667085] mt-0.5">What would you like to do?</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-[#667085] hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 pb-8 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col gap-2 mt-1">
              {options.map((opt) => (
                <button
                  key={opt.route}
                  onClick={() => handleSelect(opt.route)}
                  className="flex items-center gap-4 p-4 bg-[#F7F8FA] rounded-2xl hover:bg-gray-100 active:scale-[0.98] transition-all text-left"
                >
                  <div className={`w-11 h-11 ${opt.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                    <opt.icon className={`w-5 h-5 ${opt.iconColor}`} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#172033]">{opt.title}</p>
                    <p className="text-[12px] text-[#667085] mt-0.5">{opt.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#98A2B3] shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
