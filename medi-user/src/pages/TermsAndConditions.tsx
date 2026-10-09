import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, PhoneCall, Bell, CheckCircle2 } from 'lucide-react';

export default function TermsAndConditions() {
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
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Terms and Conditions</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Last updated: October 2026 • MediQuee Healthcare Services
              </p>
            </div>
          </div>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-600">
            {/* Section 1 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account, accessing, or using the MediQuee platform and its mobile/web applications, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                2. Healthcare & Medical Disclaimer
              </h2>
              <p>
                MediQuee connects patients with accredited hospitals, qualified medical practitioners, diagnostic laboratories, and home nursing professionals. MediQuee is a digital health coordination platform:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-600">
                <li>Teleconsultations and digital bookings complement but do not replace direct emergency hospital care.</li>
                <li>In life-threatening medical emergencies, please call your local emergency ambulance services (108/112) or visit the nearest emergency facility immediately.</li>
                <li>Medical advice, diagnoses, and prescriptions are provided solely by certified clinicians and medical facilities.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-blue-600 shrink-0" />
                3. User Account & Mobile Number Authentication
              </h2>
              <p>
                Your mobile phone number serves as your primary account identifier on MediQuee:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-600">
                <li>You agree to provide accurate, current, and verifiable phone number information.</li>
                <li>Account registration requires one-time password (OTP) verification sent to your registered mobile phone.</li>
                <li>You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600 shrink-0" />
                4. WhatsApp Communications & Notifications Consent
              </h2>
              <p>
                By opting in to WhatsApp notifications during registration or in your profile preferences, you authorize MediQuee to send you:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-600">
                <li>Account verification codes (OTPs) and security alerts.</li>
                <li>Real-time appointment confirmations, queue tokens, and doctor consultation reminders.</li>
                <li>Diagnostic laboratory test status, phlebotomist tracking, and report readiness alerts.</li>
                <li>Home nursing service scheduling updates and important platform notifications.</li>
              </ul>
              <p className="mt-2 text-slate-500 text-xs">
                You may manage or revoke your messaging preferences at any time in your Account Preferences settings.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                5. Appointments, Lab Tests & Cancellations
              </h2>
              <p>
                Appointments, diagnostic tests, and home care visits booked through MediQuee are subject to provider availability and standard facility cancellation guidelines. Cancellation and reschedule terms are outlined during the booking confirmation process.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                6. Contact Information
              </h2>
              <p>
                If you have questions regarding these Terms and Conditions, please contact us at support@mediquee.com or through our Help & Support center.
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
