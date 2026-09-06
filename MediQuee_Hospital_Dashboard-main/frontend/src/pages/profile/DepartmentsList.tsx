import { ArrowLeft, Plus, LayoutGrid } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export function DepartmentsList() {
  const navigate = useNavigate();

  const departments = [
    { name: "Cardiology", head: "Dr. Sharma", count: 12 },
    { name: "Neurology", head: "Dr. Iyer", count: 8 },
    { name: "Pediatrics", head: "Dr. Singh", count: 15 },
    { name: "Orthopedics", head: "Dr. Verma", count: 10 },
  ];

  return (
    <div className="flex flex-col bg-gray-50 min-h-[calc(100vh-80px)]">
      <div className="sticky top-0 z-30 bg-white pt-4 pb-3 px-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Departments</h1>
        </div>
        <button className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
          {departments.map((dept, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">{dept.name}</span>
                  <span className="text-xs text-gray-500">Head: {dept.head}</span>
                </div>
              </div>
              <div className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                {dept.count} Staff
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
