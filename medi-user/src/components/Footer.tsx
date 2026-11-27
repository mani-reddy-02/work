import { Link } from 'react-router-dom';
import { Mail, Phone, ShieldCheck, MapPin } from 'lucide-react';

const complianceLinks = [
  { label: 'Pricing', to: '/pricing' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Refund & Cancellation Policy', to: '/refund-policy' },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-600 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-6 border-b border-slate-100">
          {/* Brand & Trust */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/logo.png" alt="MediQuee" className="h-7 w-auto object-contain" />
            </Link>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
              MediQuee (<a href="https://mediquee.in" className="text-blue-600 hover:underline font-medium">https://mediquee.in</a>) connects patients with verified hospitals, doctors, diagnostic labs, and home nursing professionals across India.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Secure INR Payments via RBI-Regulated Gateways</span>
            </div>
          </div>

          {/* Compliance & Policy Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Policies &amp; Billing
            </h3>
            <nav aria-label="Compliance and policy links" className="flex flex-col space-y-2 text-xs sm:text-sm">
              {complianceLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-slate-600 hover:text-blue-600 font-medium transition-colors w-fit"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Official Contact Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Customer Support
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <a
                href="mailto:support@mediquee.in"
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors w-fit"
              >
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span>support@mediquee.in</span>
              </a>
              <a
                href="tel:+919014535199"
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors w-fit"
              >
                <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                <span>+91-9014535199</span>
              </a>
              <div className="flex items-start gap-2 text-slate-500">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Andhra Pradesh &amp; Telangana, India</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} MediQuee Healthcare Solutions. All rights reserved.</p>
          <p>All service fees &amp; consultations are billed transparently in INR (₹).</p>
        </div>
      </div>
    </footer>
  );
}
