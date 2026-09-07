import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdminProtectedRoute, AdminAuthRoute } from './components/layout/AdminProtectedRoute';

// Pages
import AdminLogin from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Hospitals from './pages/Hospitals';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Verification from './pages/Verification';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

// Advanced Pages
import Transactions from './pages/Transactions';
import Settlements from './pages/Settlements';
import Providers from './pages/Providers';
import LabTests from './pages/LabTests';
import {
  OPBookings,
  VideoConsultations,
  HomeSample,
  HomeNursing,
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
              <Route path="users" element={<Users />} />
              <Route path="hospitals" element={<Hospitals />} />
              <Route path="doctors" element={<Doctors />} />
              <Route path="providers" element={<Providers />} />
              
              <Route path="appointments" element={<Appointments />} />
              <Route path="services/op" element={<OPBookings />} />
              <Route path="services/video-consultation" element={<VideoConsultations />} />
              <Route path="services/lab-tests" element={<LabTests />} />
              <Route path="services/home-sample-collection" element={<HomeSample />} />
              <Route path="services/home-nursing" element={<HomeNursing />} />
              
              <Route path="transactions" element={<Transactions />} />
              <Route path="settlements" element={<Settlements />} />
              
              <Route path="verification" element={<Verification />} />
              <Route path="reports" element={<Reports />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="activity" element={<ActivityLog />} />
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
