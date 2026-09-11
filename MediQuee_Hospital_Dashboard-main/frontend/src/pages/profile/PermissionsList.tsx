import { ArrowLeft, Key, ShieldAlert } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export function PermissionsList() {
  const navigate = useNavigate();

  const roles = [
    { name: "Doctor", access: "High", users: 45 },
    { name: "Nurse", access: "Medium", users: 120 },
    { name: "Receptionist", access: "Medium", users: 15 },
    { name: "Laboratory", access: "Medium", users: 8 },
  ];

  return (
    <div className="flex flex-col bg-gray-50 min-h-[calc(100vh-80px)]">
      <div className="sticky top-0 z-30 bg-white pt-4 pb-3 px-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Permissions</h1>
      </div>

      <div className="p-4 flex flex-col gap-4">
        
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Role permissions control what each user can see and do. Be careful when modifying global access levels.
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 mt-2">
          {roles.map((role, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center shrink-0 border border-gray-200">
                  <Key className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">{role.name} Role</span>
                  <span className="text-xs text-gray-500">{role.users} Active Users</span>
                </div>
              </div>
              <button className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                Manage
              </button>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
