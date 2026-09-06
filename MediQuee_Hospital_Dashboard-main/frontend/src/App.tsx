import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import { ToastProvider } from "./context/ToastContext"
import "./i18n"

// Role Dashboards
import { DoctorDashboard } from "./pages/doctor/DoctorDashboard"
import { DoctorOPs } from "./pages/doctor/DoctorOPs"
import { VideoConsultations } from "./pages/doctor/VideoConsultations"
import { Availability } from "./pages/doctor/Availability"
import { NurseDashboard } from "./pages/nurse/NurseDashboard"
import { NurseVisits } from "./pages/nurse/NurseVisits"
import { NurseCalendar } from "./pages/nurse/NurseCalendar"
import { ReceptionistDashboard } from "./pages/receptionist/ReceptionistDashboard"
import { CheckIn } from "./pages/receptionist/CheckIn"
import { BookAppointment } from "./pages/receptionist/BookAppointment"
import { QueueScreen } from "./pages/receptionist/QueueScreen"
import { ReceptionistAppointments } from "./pages/receptionist/ReceptionistAppointments"

// Hospital layout & pages
import { AppLayout } from "./components/layout/AppLayout"
import { RoleProtectedRoute } from "./components/auth/RoleProtectedRoute"
import { Dashboard } from "./pages/Dashboard"
import { Appointments } from "./pages/Appointments"
import { Payouts } from "./pages/Payouts"
import { Patients } from "./pages/Patients"
import { Profile } from "./pages/Profile"
import { AddDepartment } from "./pages/AddDepartment"
import { AddDoctor } from "./pages/AddDoctor"
import { AddLab } from "./pages/AddLab"
import { AddNurse } from "./pages/AddNurse"
import { AddReceptionist } from "./pages/AddReceptionist"
import { PatientDetail } from "./pages/PatientDetail"
import { Settings } from "./pages/Settings"
import { Notifications } from "./pages/Notifications"
import { Security } from "./pages/Security"
import { HospitalInfo } from "./pages/profile/HospitalInfo"
import { StaffManagement } from "./pages/profile/StaffManagement"
import { StaffList } from "./pages/profile/StaffList"
import { DepartmentsList } from "./pages/profile/DepartmentsList"
import { PermissionsList } from "./pages/profile/PermissionsList"
import { HelpSupport } from "./pages/profile/HelpSupport"
import { ContactSupport } from "./pages/profile/ContactSupport"
import { ProfileEdit } from "./pages/profile/ProfileEdit"
import { PersonalInformation } from "./pages/profile/PersonalInformation"
import { EPrescriptionSettings } from "./pages/profile/EPrescriptionSettings"
import { ClinicSchedule } from "./pages/profile/ClinicSchedule"
import { ConsultationHistory } from "./pages/profile/ConsultationHistory"
import { AboutMediQuee } from "./pages/marketing/AboutMediQuee"
import { BookMedicalCamp } from "./pages/marketing/BookMedicalCamp"
import { BookMarketing } from "./pages/marketing/BookMarketing"

// Lab layout & pages
import { LabLayout } from "./components/lab/LabLayout"
import { LabDashboard } from "./pages/lab/LabDashboard"
import { LabOrders } from "./pages/lab/LabOrders"
import { LabOrderDetail } from "./pages/lab/LabOrderDetail"
import { LabReports } from "./pages/lab/LabReports"
import { UploadReport } from "./pages/lab/UploadReport"
import { ReportView } from "./pages/lab/ReportView"
import { AddTest } from "./pages/lab/AddTest"
import { CreateOrder } from "./pages/lab/CreateOrder"
import { TestPackages } from "./pages/lab/TestPackages"
import { HomeCollection } from "./pages/lab/HomeCollection"
import { CreateHomeCollection } from "./pages/lab/CreateHomeCollection"
import { LabProfile } from "./pages/lab/LabProfile"
import { LabInfo } from "./pages/lab/LabInfo"
import { TestCatalog } from "./pages/lab/TestCatalog"
import { LabNotifications } from "./pages/lab/LabNotifications"

// Auth pages
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import './index.css'

import { type ReactNode } from "react"

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

/** Redirect root "/" based on role */
function RoleRedirect() {
  const { role } = useAuth()
  if (role === 'lab') return <Navigate to="/lab" replace />
  if (role === 'doctor') return <Navigate to="/doctor" replace />
  if (role === 'nurse') return <Navigate to="/nurse" replace />
  if (role === 'receptionist') return <Navigate to="/receptionist" replace />
  return <Navigate to="/dashboard" replace /> // admin
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth Routes */}
        <Route path="/login" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Login />
          </motion.div>
        } />
        <Route path="/register" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Register />
          </motion.div>
        } />

        {/* Role-aware root redirect */}
        <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

        {/* ── HOSPITAL ROUTES ─────────────────────────────── */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          
          {/* Admin Routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/payouts" element={<Payouts />} />
            <Route path="/add-department" element={<AddDepartment />} />
            <Route path="/add-doctor" element={<AddDoctor />} />
            <Route path="/add-lab" element={<AddLab />} />
            <Route path="/add-nurse" element={<AddNurse />} />
            <Route path="/add-receptionist" element={<AddReceptionist />} />
          </Route>

          {/* Shared / Marketing Routes */}
          <Route path="/about" element={<AboutMediQuee />} />
          <Route path="/book-camp" element={<BookMedicalCamp />} />
          <Route path="/book-marketing" element={<BookMarketing />} />

          {/* Doctor Routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['doctor']} />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/ops" element={<DoctorOPs />} />
            <Route path="/doctor/video-consultations" element={<VideoConsultations />} />
            <Route path="/doctor/availability" element={<Availability />} />
          </Route>

          {/* Nurse Routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['nurse']} />}>
            <Route path="/nurse" element={<NurseDashboard />} />
            <Route path="/nurse/visits" element={<NurseVisits />} />
            <Route path="/nurse/calendar" element={<NurseCalendar />} />
          </Route>

          {/* Receptionist Routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['receptionist']} />}>
            <Route path="/receptionist" element={<ReceptionistDashboard />} />
            <Route path="/receptionist/queue" element={<QueueScreen />} />
            <Route path="/receptionist/check-in" element={<CheckIn />} />
            <Route path="/receptionist/book-appointment" element={<BookAppointment />} />
            <Route path="/receptionist/appointments" element={<ReceptionistAppointments />} />
          </Route>

          {/* Shared routes (require authentication, content is role-aware) */}
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/profile/hospital" element={<HospitalInfo />} />
          <Route path="/profile/staff" element={<StaffManagement />} />
          <Route path="/profile/staff/:type" element={<StaffList />} />
          <Route path="/profile/departments" element={<DepartmentsList />} />
          <Route path="/profile/permissions" element={<PermissionsList />} />
          <Route path="/profile/personal" element={<PersonalInformation />} />
          <Route path="/profile/erx" element={<EPrescriptionSettings />} />
          <Route path="/profile/schedule" element={<ClinicSchedule />} />
          <Route path="/profile/history" element={<ConsultationHistory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/security" element={<Security />} />
          <Route path="/support" element={<HelpSupport />} />
          <Route path="/contact" element={<ContactSupport />} />
        </Route>

        {/* ── LAB ROUTES ──────────────────────────────────── */}
        <Route element={<RoleProtectedRoute allowedRoles={['lab']}><LabLayout /></RoleProtectedRoute>}>
          <Route path="/lab" element={<LabDashboard />} />
          <Route path="/lab/orders" element={<LabOrders />} />
          <Route path="/lab/order/:id" element={<LabOrderDetail />} />
          <Route path="/lab/reports" element={<LabReports />} />
          <Route path="/lab/upload-report" element={<UploadReport />} />
          <Route path="/lab/report/:id" element={<ReportView />} />
          <Route path="/lab/add-test" element={<AddTest />} />
          <Route path="/lab/create-order" element={<CreateOrder />} />
          <Route path="/lab/add-package" element={<TestPackages />} />
          <Route path="/lab/packages" element={<TestPackages />} />
          <Route path="/lab/home-collection" element={<HomeCollection />} />
          <Route path="/lab/home-collection/create" element={<CreateHomeCollection />} />
          <Route path="/lab/profile" element={<LabProfile />} />
          <Route path="/lab/info" element={<LabInfo />} />
          <Route path="/lab/test-catalog" element={<TestCatalog />} />
          <Route path="/lab/notifications" element={<LabNotifications />} />
          <Route path="/lab/security" element={<Security />} />
          <Route path="/lab/settings" element={<Settings />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AnimatedRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
