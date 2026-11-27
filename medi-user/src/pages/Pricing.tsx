import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  IndianRupee,
  Stethoscope,
  Video,
  FlaskConical,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import SEOHead from '../components/SEOHead';

const PRICING_MODELS = [
  {
    name: 'Hospital Outpatient (OP) Slot Booking',
    priceDisplay: 'Set by Hospital & Doctor',
    unit: 'Shown in INR (₹) on each hospital & specialist listing',
    icon: Stethoscope,
    badge: 'Platform Fee: ₹0 (FREE)',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    ctaLabel: 'Browse Hospitals',
    ctaTo: '/specialties?type=hospital-op',
    features: [
      'Consultation fees are set directly by each partner hospital and specialist',
      'Confirmed priority OP queue token with instant WhatsApp & SMS updates',
      'Exact payable amount in INR (₹) displayed clearly before checkout',
    ],
  },
  {
    name: 'Online Video Telemedicine Consultation',
    priceDisplay: 'Set by Consulting Doctor',
    unit: 'Varies by specialty, hospital & doctor experience',
    icon: Video,
    badge: 'Platform Fee: ₹0 (FREE)',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ctaLabel: 'Consult Online',
    ctaTo: '/specialties?type=doctor',
    features: [
      'Session fee is determined by the selected doctor or hospital',
      'Live encrypted 1-on-1 video consultation and instant digital prescription',
      '100% refund if the doctor fails to join the scheduled consultation slot',
    ],
  },
  {
    name: 'Diagnostic Lab Tests & Home Sample Collection',
    priceDisplay: 'Set by Diagnostic Laboratory',
    unit: 'Test rate + applicable lab home collection fee (if any)',
    icon: FlaskConical,
    badge: 'Transparent INR Billing',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ctaLabel: 'Book Lab Tests',
    ctaTo: '/services/lab-tests',
    features: [
      'Test & package rates are set directly by partner diagnostic laboratories',
      'Any doorstep sample collection fee is itemized separately before payment',
      'Digital PDF reports delivered straight to your Health Records',
    ],
  },
  {
    name: 'Home Nursing Care Packages',
    priceDisplay: 'Set by Care Provider / Hospital',
    unit: 'Based on selected nursing service, shift & care duration',
    icon: HeartHandshake,
    badge: 'Upfront Quote in INR',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    ctaLabel: 'Book Home Nursing',
    ctaTo: '/services/home-nursing',
    features: [
      'Package rates are set by partner hospitals and verified nursing agencies',
      'Calculated transparently based on care type and visit/shift duration',
      'Full itemized total displayed in INR (₹) prior to booking confirmation',
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50 text-slate-800">
      <SEOHead
        title="Service Pricing (INR)"
        description="Transparent hospital-determined INR pricing for MediQuee Outpatient bookings, Video Consultations, Diagnostic Lab Tests, and Home Nursing."
        canonicalUrl="https://mediquee.in/pricing"
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors mb-5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                <IndianRupee className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Transparent Healthcare Service Pricing
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Fees are set directly by each partner hospital, doctor, or diagnostic lab and billed in <strong>Indian Rupees (INR / ₹)</strong> with <strong>₹0 platform booking fee</strong>.
                </p>
              </div>
            </div>
            <Link
              to="/refund-policy"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors shrink-0"
            >
              Cancellation &amp; Refund Rules
            </Link>
          </div>

          {/* Hospital-Determined Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-8">
            {PRICING_MODELS.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-200 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-2xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${tier.badgeClass}`}>
                        {tier.badge}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {tier.name}
                    </h2>
                    <div className="mt-2">
                      <span className="text-xl font-extrabold text-blue-600 block">
                        {tier.priceDisplay}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {tier.unit}
                      </span>
                    </div>

                    <ul className="mt-4 space-y-2 text-xs sm:text-sm text-slate-600">
                      {tier.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to={tier.ctaTo}
                    className="mt-6 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>{tier.ctaLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Razorpay Billing & Tax Transparency Note */}
          <div className="mt-8 bg-blue-50/70 border border-blue-100 rounded-2xl p-5 flex items-start gap-3.5">
            <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-700 space-y-1.5 leading-relaxed">
              <h3 className="font-bold text-slate-900">
                Hospital-Defined Pricing &amp; Direct INR Checkout
              </h3>
              <p>
                MediQuee does not fix or mark up hospital or clinician fees. Every consultation, diagnostic test, and home nursing fee is configured directly by the respective hospital, doctor, or laboratory and shown on their listing page and booking summary prior to payment.
              </p>
              <p>
                All online payments on <a href="https://mediquee.in" className="text-blue-600 font-semibold hover:underline">https://mediquee.in</a> are collected in <strong>Indian Rupees (INR)</strong> through authorized, RBI-regulated PCI-DSS Level 1 payment gateways (Razorpay — supporting UPI, Credit/Debit Cards, NetBanking, and Wallets), with any applicable taxes displayed before checkout. For billing questions, contact <a href="mailto:mediqueetech@gmail.com" className="text-blue-600 font-semibold hover:underline">mediqueetech@gmail.com</a> or call <a href="tel:+919014535199" className="text-blue-600 font-semibold hover:underline">+91-9014535199</a>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
