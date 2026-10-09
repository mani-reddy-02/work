import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdminProtectedRoute, AdminAuthRoute } from './components/layout/AdminProtectedRoute';

// Pages
import AdminLogin from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import Hospitals from './pages/Hospitals';
import Labs from './pages/Labs';
import LabDetails from './pages/LabDetails';
import HospitalDetails from './pages/HospitalDetails';
import Departments from './pages/Departments';
import DepartmentDetails from './pages/DepartmentDetails';
import Doctors from './pages/Doctors';
import DoctorDetails from './pages/DoctorDetails';
import Appointments from './pages/Appointments';
import AppointmentDetails from './pages/AppointmentDetails';
import OPBookings from './pages/OPBookings';
import Verification from './pages/Verification';
import Reports from './pages/Reports';
import RequestsHistory from './pages/RequestsHistory';
import Notifications from './pages/Notifications';
import Requests from './pages/Requests';
import Settings from './pages/Settings';
import HomePosters from './pages/HomePosters';

// Advanced Pages
import Transactions from './pages/Transactions';
import TransactionDetails from './pages/TransactionDetails';
import Revenue from './pages/Revenue';
import Settlements from './pages/Settlements';
import SettlementDetails from './pages/SettlementDetails';
import LabTests from './pages/LabTests';
import LabBookingDetails from './pages/LabBookingDetails';
import HomeSample from './pages/HomeSample';
import HomeSampleDetails from './pages/HomeSampleDetails';
import HomeNursing from './pages/HomeNursing';
import HomeNursingDetails from './pages/HomeNursingDetails';
import {
  VideoConsultations,
  ActivityLog
} from './pages/AdvancedPlaceholders';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Unauthenticated Admin Login */}
            <Route 
              path="/admin/login" 
              element={
                <AdminAuthRoute>
                  <AdminLogin />
                </AdminAuthRoute>
              } 
            />
            
            {/* Protected Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patients/:id" element={<PatientDetails />} />
              <Route path="hospitals" element={<Hospitals />} />
              <Route path="hospitals/:id" element={<HospitalDetails />} />
              <Route path="departments" element={<Departments />} />
              <Route path="departments/:id" element={<DepartmentDetails />} />
              <Route path="labs" element={<Labs />} />
              <Route path="labs/:id" element={<LabDetails />} />
              <Route path="doctors" element={<Doctors />} />
              <Route path="doctors/:id" element={<DoctorDetails />} />
              
              <Route path="op-bookings" element={<OPBookings />} />
              <Route path="op-bookings/:id" element={<AppointmentDetails />} />
              <Route path="services/video-consultation" element={<VideoConsultations />} />
              <Route path="services/lab-tests" element={<LabTests />} />
              <Route path="lab-tests/:id" element={<LabBookingDetails />} />
              <Route path="services/home-sample-collection" element={<HomeSample />} />
              <Route path="home-sample/:id" element={<HomeSampleDetails />} />
              <Route path="services/home-nursing" element={<HomeNursing />} />
              <Route path="home-nursing/:id" element={<HomeNursingDetails />} />
              
              <Route path="transactions" element={<Transactions />} />
              <Route path="transactions/:id" element={<TransactionDetails />} />
              <Route path="revenue" element={<Revenue />} />
              <Route path="settlements" element={<Settlements />} />
              <Route path="settlements/:id" element={<SettlementDetails />} />
              <Route path="verification" element={<Verification />} />
              <Route path="reports" element={<Reports />} />
                <Route path="reports/requests-history" element={<RequestsHistory />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="requests" element={<Requests />} />
              <Route path="activity" element={<ActivityLog />} />
              <Route path="home-posters" element={<HomePosters />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  );
}

export default App;
