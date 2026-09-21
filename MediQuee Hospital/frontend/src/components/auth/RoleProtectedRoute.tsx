import { type ReactNode } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAuth, type Role } from "@/context/AuthContext"

type Props = {
  children?: ReactNode
  allowedRoles: Role[]
}

export function RoleProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, role, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!role || !allowedRoles.includes(role)) {
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
