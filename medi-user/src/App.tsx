import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { PreferencesProvider } from './lib/PreferencesContext';
import Translator from './components/Translator';
import Layout from './components/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import Specialties from './pages/Specialties';
import InsuranceList from './pages/InsuranceList';
import HomeNursingList from './pages/HomeNursingList';
import LabTestList from './pages/LabTestList';
import HomeSampleList from './pages/HomeSampleList';
import Reports from './pages/Reports';
import CheckMyBMI from './pages/CheckMyBMI';
import ServiceDetails from './pages/ServiceDetails';
import BookingDetails from './pages/BookingDetails';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Ambulance from './pages/Ambulance';
import Medicines from './pages/Medicines';
import ProfilePersonal from './pages/ProfilePersonal';
import ProfileAddresses from './pages/ProfileAddresses';
import ProfilePayment from './pages/ProfilePayment';
import ProfilePreferences from './pages/ProfilePreferences';
import FamilyMembers from './pages/FamilyMembers';
import HelpSupport from './pages/HelpSupport';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import MediQueeAI from './pages/MediQueeAI';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <PreferencesProvider>
      <Translator />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
          <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="specialties" element={<Specialties />} />
            <Route path="services/insurance" element={<InsuranceList />} />
            <Route path="services/home-nursing" element={<HomeNursingList />} />
            <Route path="services/lab-tests" element={<LabTestList />} />
            <Route path="services/home-sample" element={<HomeSampleList />} />
            <Route path="services/reports" element={<Reports />} />
            <Route path="reports" element={<Reports />} />
            <Route path="health-records" element={<Reports />} />
            <Route path="services/bmi" element={<CheckMyBMI />} />
            <Route path="services/:id" element={<ServiceDetails />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="booking/:id" element={<BookingDetails />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="ambulance" element={<Ambulance />} />
            <Route path="medicines" element={<Medicines />} />
            <Route path="profile/personal" element={<ProfilePersonal />} />
            <Route path="profile/addresses" element={<ProfileAddresses />} />
            <Route path="profile/payment" element={<ProfilePayment />} />
            <Route path="profile/preferences" element={<ProfilePreferences />} />
            <Route path="family" element={<FamilyMembers />} />
            <Route path="help" element={<HelpSupport />} />
            <Route path="ai" element={<MediQueeAI />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PreferencesProvider>
  );
}

export default App;
