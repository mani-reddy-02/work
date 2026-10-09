import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, Smartphone } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MediQuee" className="h-6 w-auto object-contain" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Last updated: October 2026 • MediQuee Healthcare Services
              </p>
            </div>
          </div>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-600">
            {/* Section 1 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600 shrink-0" />
                1. Commitment to Health Data Privacy
              </h2>
              <p>
                At MediQuee, your personal information and electronic health data are treated with the highest degree of confidentiality and technical safeguards. This Privacy Policy describes how we collect, handle, protect, and process your information across our healthcare platform.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600 shrink-0" />
                2. Information We Collect
              </h2>
              <p>We collect only the information necessary to deliver quality healthcare coordination:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-600">
                <li><strong className="text-slate-800">Account Credentials:</strong> Full name, primary mobile phone number, and encrypted password credentials.</li>
                <li><strong className="text-slate-800">Medical Booking Details:</strong> Appointments, requested clinical specialties, doctor visits, diagnostic tests, and home healthcare appointments.</li>
                <li><strong className="text-slate-800">Laboratory & Diagnostic Records:</strong> Lab reports, test results, and health vitals uploaded by accredited providers or you.</li>
                <li><strong className="text-slate-800">Communication Preferences:</strong> WhatsApp notification opt-in status, SMS preferences, and push notification tokens.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600 shrink-0" />
                3. How We Use Your Information
              </h2>
              <p>Your data is used strictly for legitimate healthcare services:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-600">
                <li>Authenticating user sessions and verifying accounts via secure OTPs.</li>
                <li>Facilitating scheduled appointments with doctors, clinics, and hospital departments.</li>
                <li>Enabling phlebotomist home sample collection and securely delivering lab results.</li>
                <li>Dispatching real-time transactional WhatsApp updates, appointment alerts, and digital receipts.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />
                4. WhatsApp Messaging & Security
              </h2>
              <p>
                When you consent to WhatsApp updates, MediQuee sends transactional notifications through Meta's secure WhatsApp Business Cloud API. We do not sell your contact information to third-party marketers or advertisers. All message transmissions are encrypted in transit.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600 shrink-0" />
                5. Data Protection & Encryption
              </h2>
              <p>
                We employ industry-standard encryption protocols (TLS/SSL) for all network traffic, salted password hashing (bcrypt), and role-based access control. Only authorized healthcare personnel directly involved in your care have access to your clinical records.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600 shrink-0" />
                6. Your Rights & Control
              </h2>
              <p>
                You retain complete control over your health profile. You may review, modify, or download your diagnostic records anytime. If you wish to delete your account or change communication preferences, please visit your Profile settings or contact support@mediquee.com.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm transition-colors cursor-pointer"
            >
              I Understand
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
