import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, PhoneCall, Bell, CheckCircle2, CreditCard } from 'lucide-react';
import SEOHead from '../components/SEOHead';

export default function TermsAndConditions() {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50 text-slate-800 overflow-x-hidden">
      <SEOHead
        title="Terms and Conditions"
        description="Terms and Conditions governing healthcare bookings, teleconsultations, and INR payments on MediQuee (https://mediquee.in)."
        canonicalUrl="https://mediquee.in/terms"
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors mb-5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Terms and Conditions</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Last updated: October 2026 • MediQuee Healthcare Services (<span className="text-slate-700">https://mediquee.in</span>)
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
                By creating an account, accessing, or using the MediQuee platform (<a href="https://mediquee.in" className="text-blue-600 hover:underline font-medium">https://mediquee.in</a>) and its mobile/web applications, you agree to be bound by these Terms and Conditions, our <Link to="/privacy" className="text-blue-600 hover:underline font-medium">Privacy Policy</Link>, and our <Link to="/refund-policy" className="text-blue-600 hover:underline font-medium">Refund &amp; Cancellation Policy</Link>. If you do not agree to these terms, please do not use our services.
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
                <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                5. Payments, Billing &amp; Authorized Payment Gateways
              </h2>
              <p>
                All service bookings, consultation fees, diagnostic test orders, and home nursing packages on <a href="https://mediquee.in" className="text-blue-600 hover:underline font-medium">https://mediquee.in</a> are billed in Indian Rupees (INR / ₹), as detailed on our <Link to="/pricing" className="text-blue-600 hover:underline font-medium">Service Pricing</Link> page.
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-600">
                <li>Online payments are securely processed through authorized, RBI-regulated, PCI-DSS Level 1 compliant Indian payment gateways (including Razorpay) supporting UPI, Credit/Debit Cards, NetBanking, and Wallets.</li>
                <li>MediQuee does not store sensitive card numbers, CVVs, or UPI PINs on its servers.</li>
                <li>All applicable platform fees and taxes are displayed transparently prior to checkout.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                6. Appointments, Lab Tests, Cancellations &amp; Refunds
              </h2>
              <p>
                Appointments, diagnostic tests, and home care visits booked through MediQuee are subject to provider availability and facility cancellation windows. Eligible cancellations and approved refunds are processed back to the original payment method within 5–7 business days as described in our <Link to="/refund-policy" className="text-blue-600 hover:underline font-medium">Refund &amp; Cancellation Policy</Link>.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                7. Contact Information
              </h2>
              <p>
                If you have questions regarding these Terms and Conditions, billing, or support, please contact us at <a href="mailto:support@mediquee.in" className="text-blue-600 hover:underline font-semibold">support@mediquee.in</a>, call <a href="tel:+919014535199" className="text-blue-600 hover:underline font-semibold">+91-9014535199</a>, or visit our <Link to="/contact" className="text-blue-600 hover:underline font-medium">Contact Us</Link> page.
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
