import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { PreferencesProvider } from './lib/PreferencesContext';
import Translator from './components/Translator';
import Layout from './components/Layout';

// --- Code-Split Lazy Route Loading for Core Web Vitals (FCP, LCP & INP) ---
const Home = lazy(() => import('./pages/Home'));
const Services = lazy(() => import('./pages/Services'));
const Specialties = lazy(() => import('./pages/Specialties'));
const DepartmentBooking = lazy(() => import('./pages/DepartmentBooking'));
const InsuranceList = lazy(() => import('./pages/InsuranceList'));
const HomeNursingList = lazy(() => import('./pages/HomeNursingList'));
const LabTestList = lazy(() => import('./pages/LabTestList'));
const HomeSampleList = lazy(() => import('./pages/HomeSampleList'));
const CheckMyBMI = lazy(() => import('./pages/CheckMyBMI'));
const ServiceDetails = lazy(() => import('./pages/ServiceDetails'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const MediQueeAI = lazy(() => import('./pages/MediQueeAI'));
const Medicines = lazy(() => import('./pages/Medicines'));
const HelpSupport = lazy(() => import('./pages/HelpSupport'));

// Authenticated Patient Private Routes
const MyBookings = lazy(() => import('./pages/MyBookings'));
const BookingDetails = lazy(() => import('./pages/BookingDetails'));
const VideoConsultationPage = lazy(() => import('./pages/VideoConsultationPage'));
const Reports = lazy(() => import('./pages/Reports'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ProfilePersonal = lazy(() => import('./pages/ProfilePersonal'));
const ProfileAddresses = lazy(() => import('./pages/ProfileAddresses'));
const ProfilePreferences = lazy(() => import('./pages/ProfilePreferences'));
const FamilyMembers = lazy(() => import('./pages/FamilyMembers'));

// Auth Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

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
  return <>{children}</>;
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
  return <>{children}</>;
};

function App() {
  return (
    <PreferencesProvider>
      <Translator />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
            <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
            <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
            
            {/* Legal / Policy Public Routes */}
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/deletion" element={<PrivacyPolicy />} />
            <Route path="/data-deletion" element={<PrivacyPolicy />} />

            {/* Main Application Shell with Public Discovery */}
            <Route path="/" element={<Layout />}>
              {/* --- Public Discovery & Crawlable Routes (Indexable by Search Engines & AI Bots) --- */}
              <Route index element={<Home />} />
              <Route path="ai" element={<MediQueeAI />} />
              <Route path="services" element={<Services />} />
              <Route path="specialties" element={<Specialties />} />
              <Route path="departments" element={<DepartmentBooking />} />
              <Route path="services/insurance" element={<InsuranceList />} />
              <Route path="services/home-nursing" element={<HomeNursingList />} />
              <Route path="services/lab-tests" element={<LabTestList />} />
              <Route path="services/home-sample" element={<HomeSampleList />} />
              <Route path="services/bmi" element={<CheckMyBMI />} />
              <Route path="services/:id" element={<ServiceDetails />} />
              <Route path="ambulance" element={<Navigate to="/" replace />} />
              <Route path="medicines" element={<Medicines />} />
              <Route path="help" element={<HelpSupport />} />

              {/* --- Protected Patient Private Routes (Strictly Gated Behind Auth & Disallowed in robots.txt) --- */}
              <Route path="bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
              <Route path="my-bookings" element={<Navigate to="/bookings" replace />} />
              <Route path="booking/:id" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} />
              <Route path="video-consultation/:bookingId" element={<ProtectedRoute><VideoConsultationPage /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="health-records" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="services/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="profile/personal" element={<ProtectedRoute><ProfilePersonal /></ProtectedRoute>} />
              <Route path="profile/addresses" element={<ProtectedRoute><ProfileAddresses /></ProtectedRoute>} />
              <Route path="profile/preferences" element={<ProtectedRoute><ProfilePreferences /></ProtectedRoute>} />
              <Route path="family" element={<ProtectedRoute><FamilyMembers /></ProtectedRoute>} />
              <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </PreferencesProvider>
  );
}

export default App;
