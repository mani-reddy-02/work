import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  ArrowLeft, Shield, Lock, Eye, Database, Smartphone, 
  Trash2, FileText, CheckCircle2, AlertTriangle, UserCheck, 
  HardDrive, Clock, Mail, Phone, ExternalLink, HelpCircle 
} from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#deletion' || location.pathname.includes('deletion')) {
      const el = document.getElementById('deletion');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Top Sticky Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MediQuee" className="h-6 w-auto object-contain" />
            <span className="hidden sm:inline-block text-xs font-bold text-slate-400 border-l border-slate-200 pl-3">
              Trust & Security
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10 md:p-12">
          
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-8 border-b border-slate-100">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-xs">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  DPDPA 2023 Compliant
                </span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  NMC Health Guidelines
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                MediQuee Privacy Policy & Data Charter
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Last updated & effective: October 2026 • MediQuee Healthcare Solutions Pvt. Ltd.
              </p>
            </div>
          </div>

          {/* Quick Summary Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-8">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-emerald-100/70 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Zero Commercial Data Sale</h4>
                <p className="text-[11px] text-slate-600 leading-normal mt-0.5">
                  We never sell, rent, monetize, or trade your medical or personal information to third-party advertisers or data brokers.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-blue-100/70 text-blue-700 rounded-xl shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">256-Bit SSL & Encryption</h4>
                <p className="text-[11px] text-slate-600 leading-normal mt-0.5">
                  All clinical records, prescriptions, and lab reports are encrypted in transit (TLS 1.3) and at rest (AES-256).
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-rose-100/70 text-rose-700 rounded-xl shrink-0 mt-0.5">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Right to Complete Deletion</h4>
                <p className="text-[11px] text-slate-600 leading-normal mt-0.5">
                  You can request full account erasure and data deletion at any time via in-app settings or verified email.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-indigo-100/70 text-indigo-700 rounded-xl shrink-0 mt-0.5">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Strict Clinical Confidentiality</h4>
                <p className="text-[11px] text-slate-600 leading-normal mt-0.5">
                  Only your treating doctors, assigned hospitals, and certified laboratory phlebotomists have access to your health details.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Policy Sections */}
          <div className="space-y-10 text-sm sm:text-base leading-relaxed text-slate-600 divide-y divide-slate-100">
            
            {/* Section 1 */}
            <section className="pt-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-blue-600 shrink-0" />
                <span>1. Introduction & Regulatory Commitment</span>
              </h2>
              <p>
                MediQuee Healthcare Solutions Pvt. Ltd. ("MediQuee", "we", "us", or "our") operates the MediQuee platform, mobile applications, and digital healthcare coordination services. We recognize the profoundly sensitive nature of personal health data and are steadfast in upholding the highest global security and confidentiality standards.
              </p>
              <p className="mt-3">
                This Privacy Policy is formulated in strict compliance with:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-700">
                <li><strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong> of India.</li>
                <li><strong>Information Technology Act, 2000</strong> and the <em>Reasonable Security Practices and Procedures and Sensitive Personal Data or Information Rules, 2011</em>.</li>
                <li><strong>Telemedicine Practice Guidelines (2020)</strong> issued by the National Medical Commission (NMC) and Ministry of Health & Family Welfare (MoHFW).</li>
                <li><strong>Clinical Establishments (Registration and Regulation) Act</strong>.</li>
              </ul>
              <p className="mt-3">
                By downloading, accessing, registering, or scheduling healthcare services on the MediQuee platform, you confirm your understanding of and consent to the data practices described in this Charter.
              </p>
            </section>

            {/* Section 2 */}
            <section className="pt-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2.5">
                <Database className="w-5 h-5 text-blue-600 shrink-0" />
                <span>2. Categories of User Data We Collect (In Detail)</span>
              </h2>
              <p>
                To provide safe, accurate, and seamless healthcare booking, doctor consultations, diagnostics, and home sample collections, we collect the following categories of data:
              </p>

              <div className="mt-4 space-y-4">
                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    A. Identity & Contact Information
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Your full name, primary verified mobile phone number, secondary contact numbers, email address, biological gender, date of birth / age, profile avatar, and emergency contact details.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    B. Address & Geolocation Data
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Saved delivery and collection addresses (including house/apartment number, street, landmark, city, and pincode). With your explicit browser/device permission, precise GPS coordinates are utilized solely to dispatch home phlebotomists, route home nursing professionals, or direct emergency ambulance services to your location.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    C. Family Members & Dependent Records
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    When you use the "Family Members" feature to book healthcare for your parents, children, or spouse, we collect their names, ages, gender, and relevant medical history that you voluntarily provide to facilitate their care.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    D. Clinical & Consultation Data
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Chief medical complaints, symptoms described during booking, selected departments and clinical specialties, doctor appointment records (in-hospital OP or secure video consultations), digital prescriptions generated by your doctor, drug names and dosages, clinical follow-up dates, and physician clinical notes.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    E. Laboratory, Pathology & Diagnostic Records
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Diagnostic packages booked, biological specimen details (blood, urine, swabs), home sample collection timestamps, phlebotomist tracking logs, test reference ranges, vital sign records, and certified digital laboratory test reports (PDFs) uploaded by authorized labs.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-600" />
                    F. Financial & Billing Metadata
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Transaction reference IDs, invoice amounts, billing timestamps, and payment statuses. <strong>Important:</strong> MediQuee does <em>NOT</em> store or process credit/debit card numbers, CVVs, or UPI PINs. All payment transactions are executed directly through RBI-regulated, PCI-DSS Level 1 compliant payment gateways.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                    G. Device, Technical & Communications Telemetry
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    IP address, device model, operating system, browser type, app version, network connectivity logs, push notification tokens, and WhatsApp communication delivery timestamps.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="pt-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-blue-600 shrink-0" />
                <span>3. How We Use & Process Your Information</span>
              </h2>
              <p>
                Your personal and medical information is used solely for legitimate, authorized healthcare coordination:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-700">
                <li><strong>Identity Verification:</strong> Authenticating account access and verifying mobile OTPs to prevent unauthorized account access.</li>
                <li><strong>Appointment Coordination:</strong> Scheduling, rescheduling, and confirming visits with doctors, hospital OPDs, and clinical specialists.</li>
                <li><strong>Diagnostic Logistics:</strong> Routing licensed phlebotomists to your doorstep for sample collection and delivering verified test results.</li>
                <li><strong>Secure Telemedicine:</strong> Establishing encrypted peer-to-peer WebRTC video consultation sessions between you and certified doctors.</li>
                <li><strong>Service Notifications:</strong> Dispatching real-time appointment tokens, queue status updates, lab readiness alerts, and receipts via SMS and WhatsApp.</li>
                <li><strong>Clinical Record Archiving:</strong> Providing you with a continuous, centralized health history accessible in your patient profile.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="pt-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>4. WhatsApp Notifications & Privacy</span>
              </h2>
              <p>
                When you consent to WhatsApp notifications, MediQuee sends transactional notifications through Meta's secure WhatsApp Business Cloud API.
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-700">
                <li>Messages are strictly transactional (e.g. appointment confirmations, OTPs, lab report links).</li>
                <li>We do not send unsolicited marketing blasts or spam.</li>
                <li>WhatsApp communications are protected by end-to-end transport encryption.</li>
                <li>You may revoke WhatsApp notification consent at any time from your Account Preferences or by replying STOP.</li>
              </ul>
            </section>

            {/* Section 5: USER DATA DELETION (IN DETAIL) */}
            <section id="deletion" className="pt-8 scroll-mt-24">
              <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-5 sm:p-6 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-rose-950 mb-2 flex items-center gap-2.5">
                  <Trash2 className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>5. User Data Deletion & Account Erasure (In Detail)</span>
                </h2>
                <p className="text-xs sm:text-sm text-rose-900/90 leading-relaxed">
                  Under India's Digital Personal Data Protection Act (DPDPA 2023) and MediQuee's Data Protection Charter, you have the absolute right to request the complete deletion of your account and erasure of your personal data.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">A. How You Can Request Data Deletion</h3>
                <p>
                  You may request the deletion of your account and personal data through any of the following verified channels:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Method 1: Email Request
                    </span>
                    <p className="text-xs text-slate-700 mt-2 font-medium">
                      Send an email from your registered email address to:
                    </p>
                    <a href="mailto:privacy@mediquee.com" className="text-sm font-bold text-blue-600 hover:underline block mt-1">
                      privacy@mediquee.com
                    </a>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Subject: "Account Deletion Request" with your registered phone number.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Method 2: Support Helpline
                    </span>
                    <p className="text-xs text-slate-700 mt-2 font-medium">
                      Call our dedicated patient data support desk:
                    </p>
                    <a href="tel:8331045500" className="text-sm font-bold text-emerald-700 hover:underline block mt-1">
                      +91 8331045500
                    </a>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Available Monday to Saturday, 9:00 AM – 7:00 PM IST.
                    </p>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm pt-2">B. Identity Verification for Deletion</h3>
                <p>
                  To protect your account from unauthorized, accidental, or malicious deletion, all deletion requests require identity verification via a secure one-time password (OTP) delivered to your registered mobile phone number. Once verified, the deletion procedure begins immediately.
                </p>

                <h3 className="font-bold text-slate-900 text-sm pt-2">C. Deletion Timeline & What Gets Erased</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Data Category</th>
                        <th className="p-3">Deletion Action</th>
                        <th className="p-3">Timeline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 font-semibold text-slate-800">Account Credentials & Profile</td>
                        <td className="p-3 text-slate-600">Password hash, session tokens, profile photo, bio, email, and preferences purged.</td>
                        <td className="p-3 font-bold text-emerald-700">Immediate (&lt; 24h)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-800">Saved Addresses & Location</td>
                        <td className="p-3 text-slate-600">All home, work, and saved pickup addresses permanently erased from database.</td>
                        <td className="p-3 font-bold text-emerald-700">Immediate</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-800">Device & Telemetry Logs</td>
                        <td className="p-3 text-slate-600">FCM push tokens, IP logs, and browser identifiers cleared.</td>
                        <td className="p-3 text-slate-700">Within 7 days</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-800">Active Database Purge</td>
                        <td className="p-3 text-slate-600">User account record permanently anonymized and unlinked across all operational nodes.</td>
                        <td className="p-3 text-slate-700">Within 30 days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 mt-3">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Statutory Medical & Legal Retention Exceptions
                  </h4>
                  <p className="text-xs text-amber-900/90 leading-relaxed mt-1">
                    Under Indian medical and legal regulations (including National Medical Commission Telemedicine Guidelines, Clinical Establishments Act, and GST/Tax regulations), licensed doctors, hospitals, and diagnostic laboratories are legally required to archive consultation summaries, official prescriptions, and diagnostic test reports for a minimum statutory period (typically 3 to 7 years). 
                  </p>
                  <p className="text-xs text-amber-900/90 leading-relaxed mt-2">
                    When you request account deletion, your personal login profile, contact details, and marketing records are completely deleted from active platforms. Clinical consultation records mandated by law are moved to a cold, restricted-access encrypted regulatory archive accessible only if subpoenaed by a court of law or medical regulatory board. Once the statutory retention period expires, these archives are permanently destroyed.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section className="pt-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-blue-600 shrink-0" />
                <span>6. Your Rights Under DPDPA 2023</span>
              </h2>
              <p>As a MediQuee user, you hold statutory rights regarding your personal health data:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <h4 className="font-bold text-slate-900 text-xs">Right to Access & Summary</h4>
                  <p className="text-xs text-slate-600 mt-1">View all past bookings, digital prescriptions, and diagnostic reports anytime inside your account.</p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <h4 className="font-bold text-slate-900 text-xs">Right to Correction & Rectification</h4>
                  <p className="text-xs text-slate-600 mt-1">Update or correct inaccurate demographic details, phone numbers, or addresses in your Profile.</p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <h4 className="font-bold text-slate-900 text-xs">Right to Data Portability</h4>
                  <p className="text-xs text-slate-600 mt-1">Download and export digital PDF copies of your medical reports and prescriptions for external consultation.</p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <h4 className="font-bold text-slate-900 text-xs">Right to Withdraw Consent</h4>
                  <p className="text-xs text-slate-600 mt-1">Revoke optional communication channels (WhatsApp, push notifications) without losing access to core care.</p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section className="pt-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2.5">
                <HardDrive className="w-5 h-5 text-blue-600 shrink-0" />
                <span>7. Technical Security Safeguards & Encryption</span>
              </h2>
              <p>
                MediQuee implements rigorous physical, organizational, and electronic safeguards to ensure your health information is invulnerable to breaches:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-1.5 text-slate-700">
                <li><strong>Transport Security:</strong> 256-bit TLS 1.3 encryption on all web and API transmissions.</li>
                <li><strong>Database Encryption:</strong> Supabase PostgreSQL databases encrypted at rest utilizing AES-256 standards.</li>
                <li><strong>Password Protection:</strong> Cryptographic password hashing using salted Bcrypt algorithms.</li>
                <li><strong>Role-Based Access Control (RBAC):</strong> Hospital administrative staff cannot view private clinical diagnostic notes; only assigned treating clinicians possess viewing permissions.</li>
                <li><strong>Indian Cloud Sovereignty:</strong> Primary databases and digital storage instances are hosted on secure, MeitY-empanelled enterprise cloud infrastructure located within India.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="pt-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-blue-600 shrink-0" />
                <span>8. Data Protection Officer (DPO) & Grievance Redressal</span>
              </h2>
              <p>
                In accordance with the Information Technology Act 2000 and DPDPA 2023, MediQuee has designated a Grievance Redressal & Data Protection Officer:
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mt-4 text-xs sm:text-sm space-y-2">
                <p><strong>Officer Name:</strong> Grievance & Data Protection Officer</p>
                <p><strong>Designation:</strong> Head of Compliance & Data Privacy</p>
                <p><strong>Entity:</strong> MediQuee Healthcare Solutions Pvt. Ltd.</p>
                <p><strong>Email Address:</strong> <a href="mailto:privacy@mediquee.com" className="text-blue-600 font-bold hover:underline">privacy@mediquee.com</a> / <a href="mailto:support@mediquee.com" className="text-blue-600 font-bold hover:underline">support@mediquee.com</a></p>
                <p><strong>Support Telephone:</strong> <a href="tel:8331045500" className="text-blue-600 font-bold hover:underline">+91 8331045500</a></p>
                <p><strong>Headquarters:</strong> Hyderabad, Telangana, India</p>
                <div className="pt-2 border-t border-slate-200 text-slate-500 text-xs">
                  SLA Commitment: All grievances, deletion requests, or privacy inquiries are acknowledged within 24–48 hours and resolved within a maximum of 30 days.
                </div>
              </div>
            </section>
          </div>

          {/* Bottom Actions */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              © 2026 MediQuee Healthcare Solutions Pvt. Ltd. All rights reserved.
            </span>
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm transition-all cursor-pointer active:scale-98"
            >
              I Understand & Accept
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
