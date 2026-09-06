import { ArrowLeft, User, ChevronRight, TestTube2, HeartPulse } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export function StaffManagement() {
  const navigate = useNavigate();

  const categories = [
    { title: "Doctors", icon: User, path: "/profile/staff/doctors", color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Nurses", icon: HeartPulse, path: "/profile/staff/nurses", color: "text-green-600", bg: "bg-green-50" },
    { title: "Labs", icon: TestTube2, path: "/profile/staff/labs", color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="flex flex-col bg-gray-50 min-h-[calc(100vh-80px)]">
      <div className="sticky top-0 z-30 bg-white pt-4 pb-3 px-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Staff Management</h1>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {categories.map((cat, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(cat.path)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.bg} ${cat.color}`}>
                <cat.icon className="w-6 h-6" />
              </div>
              <span className="text-lg font-bold text-gray-900">{cat.title}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
