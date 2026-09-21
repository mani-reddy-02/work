import { ArrowLeft, Key, ShieldAlert } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useState } from "react"
import { ManagePermissionsSheet } from "../../components/permissions/ManagePermissionsSheet"
import { usePermissions } from "../../hooks/usePermissions"

export function PermissionsList() {
  const navigate = useNavigate();
  const { refetch } = usePermissions();

  const [selectedRole, setSelectedRole] = useState<{ id: string, name: string } | null>(null);

  // Role names and access levels are static role definitions.
  // Active user counts come from the backend and are unavailable until connected.
  const roles = [
    { id: "DOCTOR", name: "Doctor", access: "High", users: "—" },
    { id: "NURSE", name: "Nurse", access: "Medium", users: "—" },
    { id: "RECEPTIONIST", name: "Receptionist", access: "Medium", users: "—" },
    { id: "LAB_ADMIN", name: "Laboratory", access: "Medium", users: "—" },
  ];

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)]">
      <div className="sticky top-0 z-30 bg-surface pt-4 pb-3 px-4 border-b border-border flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Permissions</h1>
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
            <div key={i} className="bg-surface p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-background text-gray-600 rounded-xl flex items-center justify-center shrink-0 border border-border">
                  <Key className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-foreground">{role.name} Role</span>
                  <span className="text-xs text-muted">{role.users} Active Users</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRole({ id: role.id, name: role.name })}
                className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Manage
              </button>
            </div>
          ))}
        </motion.div>
      </div>

      <ManagePermissionsSheet
        isOpen={!!selectedRole}
        onClose={() => setSelectedRole(null)}
        role={selectedRole?.id || null}
        roleName={selectedRole?.name || null}
        onSuccess={() => {
          // If you wanted to refresh active counts, you could do it here
          refetch(); // Refreshes the currently logged in user's permissions, but since we are admin managing others, this is just for safety
        }}
      />
    </div>
  )
}
