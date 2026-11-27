import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  Clock,
  CheckCircle2,
  Mail,
  Phone,
  Stethoscope,
  Video,
  FlaskConical,
  HeartHandshake,
  AlertCircle,
} from 'lucide-react';
import SEOHead from '../components/SEOHead';

const SERVICE_POLICIES = [
  {
    title: 'Hospital Outpatient (OP) Slot Bookings',
    icon: Stethoscope,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    rules: [
      'Full refund (100%) if cancelled at least 4 hours prior to the scheduled appointment slot.',
      'Free one-time slot rescheduling up to 2 hours before the appointment, subject to hospital availability.',
      'No-show or cancellations made less than 4 hours before the scheduled slot are non-refundable unless the hospital/doctor cancels.',
      '100% automatic refund if the hospital or treating doctor cancels or reschedules and you opt out.',
    ],
  },
  {
    title: 'Online Video Telemedicine Consultations',
    icon: Video,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rules: [
      'Full refund (100%) if cancelled at least 2 hours before the scheduled video consultation start time.',
      'If the doctor does not join within 15 minutes of the slot time or technical failure occurs on MediQuee’s end, you are eligible for a 100% refund or instant free reschedule.',
      'Patient no-shows or cancellations within 2 hours of the session are not eligible for a refund.',
    ],
  },
  {
    title: 'Diagnostic Lab Tests & Home Sample Collection',
    icon: FlaskConical,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rules: [
      'Full refund (100%) if cancelled at least 4 hours before the scheduled sample collection or walk-in lab slot.',
      'If cancelled after a phlebotomist has been dispatched to your address, a nominal conveyance fee (up to ₹100) may be deducted and the remaining balance refunded.',
      'Once biological sample collection is completed and laboratory processing begins, orders cannot be cancelled or refunded.',
    ],
  },
  {
    title: 'Home Nursing Care Packages',
    icon: HeartHandshake,
    color: 'bg-rose-50 text-rose-600 border-rose-100',
    rules: [
      'Full refund (100%) if cancelled at least 12 hours prior to the scheduled nursing visit.',
      'Cancellations made between 4 and 12 hours before the visit are eligible for a 50% refund or one free reschedule.',
      'If MediQuee or the partner facility cannot assign a qualified nurse for your confirmed slot, a 100% refund is issued immediately.',
    ],
  },
];

export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50 text-slate-800">
      <SEOHead
        title="Refund & Cancellation Policy"
        description="MediQuee Refund and Cancellation Policy for Outpatient appointments, Video Consultations, Lab Tests, and Home Nursing in INR."
        canonicalUrl="https://mediquee.in/refund-policy"
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors mb-5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
              <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Refund &amp; Cancellation Policy
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Effective: October 2026 • MediQuee Healthcare Solutions (<span className="text-slate-700">https://mediquee.in</span>)
              </p>
            </div>
          </div>

          {/* Razorpay-Compliant Refund Timeline Highlight */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3.5">
            <Clock className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-emerald-950">
                Standard Refund Processing Timeline: 5–7 Business Days
              </h2>
              <p className="text-xs sm:text-sm text-emerald-900/90 mt-1 leading-relaxed">
                <strong>Approved refunds are processed back to the original payment method within 5–7 business days</strong> (UPI, Debit/Credit Card, NetBanking, or Wallet) via our RBI-regulated payment gateway partner (Razorpay). Bank settlement times may vary slightly depending on your issuing bank.
              </p>
            </div>
          </div>

          {/* Service-Wise Cancellation Windows */}
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              1. Service-Wise Cancellation &amp; Refund Eligibility
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {SERVICE_POLICIES.map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.title}
                    className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${service.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {service.title}
                      </h3>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                      {service.rules.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* How to Request a Cancellation or Dispute */}
          <section className="space-y-3 pt-2 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              2. How to Request a Cancellation or Payment Dispute
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              You can cancel eligible bookings directly from the <strong>My Bookings</strong> section of your MediQuee account, or reach out to our billing support team with your <strong>Booking Reference ID</strong>, <strong>Registered Mobile Number</strong>, and <strong>Razorpay Payment ID</strong>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <a
                href="mailto:mediqueetech@gmail.com?subject=Refund%20%2F%20Cancellation%20Request"
                className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/70 border border-blue-100 hover:border-blue-300 transition-colors"
              >
                <Mail className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                    Email Billing &amp; Refund Desk
                  </span>
                  <span className="text-sm font-bold text-slate-900">mediqueetech@gmail.com</span>
                </div>
              </a>
              <a
                href="tel:+919014535199"
                className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors"
              >
                <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Support Helpline (Mon–Sat, 8 AM – 8 PM IST)
                  </span>
                  <span className="text-sm font-bold text-slate-900">+91-9014535199</span>
                </div>
              </a>
            </div>
          </section>

          {/* Failed / Duplicate Transactions */}
          <section className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-950 space-y-1">
              <h3 className="font-bold">Failed or Duplicate Payment Deductions</h3>
              <p className="text-amber-900/90 leading-relaxed">
                If money was debited from your bank/UPI account for a failed or duplicate booking, it is automatically reversed by Razorpay and your bank within <strong>5–7 business days</strong>. If not credited after 7 business days, email <a href="mailto:mediqueetech@gmail.com" className="font-bold underline">mediqueetech@gmail.com</a> with your transaction screenshot for immediate reconciliation.
              </p>
            </div>
          </section>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/pricing" className="text-blue-600 hover:underline">View Service Pricing</Link>
              <Link to="/contact" className="text-blue-600 hover:underline">Contact Support</Link>
              <Link to="/terms" className="text-blue-600 hover:underline">Terms &amp; Conditions</Link>
            </div>
            <span>All amounts in INR (₹)</span>
          </div>
        </div>
      </main>
    </div>
  );
}
