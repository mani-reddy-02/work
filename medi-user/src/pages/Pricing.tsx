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

const PRICING_TIERS = [
  {
    name: 'Hospital Outpatient (OP) Slot Booking',
    priceRange: 'Starting from ₹99',
    unit: 'per consultation slot (varies by hospital & specialist)',
    icon: Stethoscope,
    badge: 'In-Hospital Visit',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    ctaLabel: 'Browse Hospitals',
    ctaTo: '/specialties?type=hospital-op',
    features: [
      'Confirmed priority OP queue token',
      'Instant WhatsApp & SMS slot confirmation',
      'Exact doctor/hospital fee displayed prior to checkout',
    ],
  },
  {
    name: 'Online Video Telemedicine Consultation',
    priceRange: '₹199 – ₹499',
    unit: 'per video session',
    icon: Video,
    badge: 'HD Video Call',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ctaLabel: 'Consult Online',
    ctaTo: '/specialties?type=doctor',
    features: [
      'Live encrypted 1-on-1 video consultation with verified doctors',
      'Digital prescription available immediately after session',
      '100% refund if doctor fails to join scheduled slot',
    ],
  },
  {
    name: 'Diagnostic Lab Tests & Home Sample Collection',
    priceRange: 'Starting from ₹299',
    unit: 'per test or preventive health package',
    icon: FlaskConical,
    badge: 'Lab & Home Collection',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ctaLabel: 'Book Lab Tests',
    ctaTo: '/services/lab-tests',
    features: [
      'Certified NABL/accredited diagnostic laboratories',
      'Doorstep phlebotomist sample pickup option',
      'Digital PDF lab reports stored in Health Records',
    ],
  },
  {
    name: 'Home Nursing Care Packages',
    priceRange: 'Starting from ₹799',
    unit: 'per visit / nursing shift',
    icon: HeartHandshake,
    badge: 'At-Home Care',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    ctaLabel: 'Book Home Nursing',
    ctaTo: '/services/home-nursing',
    features: [
      'Trained & background-verified nursing professionals',
      'Post-operative care, vitals monitoring, injections & wound dressing',
      'Transparent upfront package breakdown before payment',
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50 text-slate-800">
      <SEOHead
        title="Service Pricing (INR)"
        description="Transparent INR pricing for MediQuee Hospital OP bookings, Online Video Consultations, Diagnostic Lab Tests, and Home Nursing packages."
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

        {/* Hero / Header Card */}
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
                  All prices are listed and billed directly by MediQuee in <strong>Indian Rupees (INR / ₹)</strong>.
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

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-8">
            {PRICING_TIERS.map((tier) => {
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
                    <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl font-extrabold text-blue-600">
                        {tier.priceRange}
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
                Direct INR Billing &amp; Checkout Transparency
              </h3>
              <p>
                All payments on <a href="https://mediquee.in" className="text-blue-600 font-semibold hover:underline">https://mediquee.in</a> are collected directly by <strong>MediQuee</strong> in <strong>Indian Rupees (INR)</strong> through authorized, RBI-regulated PCI-DSS Level 1 payment gateways (Razorpay — supporting UPI, Credit/Debit Cards, NetBanking, and Wallets).
              </p>
              <p>
                Exact consultation, lab test, or nursing fees — along with any applicable taxes (GST) and platform charges — are itemized and displayed clearly prior to checkout so there are no hidden fees. For billing questions, contact <a href="mailto:support@mediquee.in" className="text-blue-600 font-semibold hover:underline">support@mediquee.in</a> or call <a href="tel:+919014535199" className="text-blue-600 font-semibold hover:underline">+91-9014535199</a>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
