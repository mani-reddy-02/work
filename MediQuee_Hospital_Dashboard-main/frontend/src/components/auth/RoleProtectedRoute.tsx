import { type ReactNode } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAuth, type Role } from "@/context/AuthContext"

type Props = {
  children?: ReactNode
  allowedRoles: Role[]
}

export function RoleProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(role)) {
    // Redirect to the user's correct dashboard
    if (role === 'lab') return <Navigate to="/lab" replace />
    if (role === 'doctor') return <Navigate to="/doctor" replace />
    if (role === 'nurse') return <Navigate to="/nurse" replace />
    if (role === 'receptionist') return <Navigate to="/receptionist" replace />
    
    // Fallback for unknown/invalid roles to prevent infinite redirect loop
    return <Navigate to="/login" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
