import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Building2,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import SEOHead from '../components/SEOHead';

export default function ContactUs() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [topic, setTopic] = useState('Booking & Appointment Support');
  const [bookingRef, setBookingRef] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !contact.trim() || !message.trim()) {
      setFormError('Please fill in your name, email or mobile number, and inquiry message.');
      return;
    }

    setSubmitted(true);
  };

  const mailtoHref = `mailto:mediqueetech@gmail.com?subject=${encodeURIComponent(
    `[MediQuee Support] ${topic}${bookingRef ? ` (${bookingRef})` : ''}`
  )}&body=${encodeURIComponent(
    `Name: ${name || '-'}\nPhone/Email: ${contact || '-'}\nBooking Reference: ${bookingRef || 'N/A'}\n\nMessage:\n${message || ''}`
  )}`;

  return (
    <div className="bg-slate-50 text-slate-800">
      <SEOHead
        title="Contact Us"
        description="Contact MediQuee Healthcare Solutions for booking help, payment support, or refund inquiries at mediqueetech@gmail.com or +91-9014535199."
        canonicalUrl="https://mediquee.in/contact"
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
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Official Support &amp; Grievance Desk
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Contact MediQuee
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Reach our team for appointment assistance, Razorpay payment queries, cancellations, or partner onboarding.
              </p>
            </div>
            <Link
              to="/refund-policy"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors shrink-0"
            >
              View Refund Policy
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pt-8">
            {/* Business Identity & Direct Contact Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Business Identity
                  </h2>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    MediQuee (MediQuee Healthcare Solutions)
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Website: <a href="https://mediquee.in" className="text-blue-600 hover:underline font-medium">https://mediquee.in</a>
                  </p>
                </div>
              </div>

              <a
                href="mailto:mediqueetech@gmail.com"
                className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 hover:border-blue-300 transition-colors flex items-start gap-3 block"
              >
                <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Customer Support Email
                  </h2>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">mediqueetech@gmail.com</p>
                  <p className="text-xs text-slate-500 mt-0.5">Response within 24 hours</p>
                </div>
              </a>

              <a
                href="tel:+919014535199"
                className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 hover:border-emerald-300 transition-colors flex items-start gap-3 block"
              >
                <Phone className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Support Phone Number
                  </h2>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">+91-9014535199</p>
                  <p className="text-xs text-slate-500 mt-0.5">Direct patient &amp; payment assistance</p>
                </div>
              </a>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Operating Hours
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                    Monday – Saturday: 8:00 AM – 8:00 PM IST
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Email &amp; urgent booking support monitored 7 days a week.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Registered Operational Address
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-slate-700 mt-0.5 leading-relaxed">
                    MediQuee Healthcare Solutions,<br />
                    Angallu, Madanapalle, Annamayya District, Andhra Pradesh – 517325, India<br />
                    Regional Office: Madhapur, Hyderabad, Telangana – 500081, India
                  </p>
                </div>
              </div>
            </div>

            {/* Inquiry Form */}
            <div className="lg:col-span-3">
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 sm:p-7">
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  Send Us a Support Inquiry
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-5">
                  Have a question about an appointment, payment transaction, or refund? Submit details below.
                </p>

                {submitted ? (
                  <div className="bg-white border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Inquiry Prepared for MediQuee Support
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Thank you, <strong>{name}</strong>. For fastest tracking, click below to send this directly via your email app to <strong>mediqueetech@gmail.com</strong>, or call <strong>+91-9014535199</strong>.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <a
                        href={mailtoHref}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Send via Email App</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitted(false);
                          setName('');
                          setContact('');
                          setBookingRef('');
                          setMessage('');
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Submit Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {formError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="contact-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                          Full Name *
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Username"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-info" className="block text-xs font-bold text-slate-700 mb-1.5">
                          Email or Mobile Number *
                        </label>
                        <input
                          id="contact-info"
                          type="text"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="9876543210 or user@example.com"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="contact-topic" className="block text-xs font-bold text-slate-700 mb-1.5">
                          Inquiry Category
                        </label>
                        <select
                          id="contact-topic"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option value="Booking & Appointment Support">Booking &amp; Appointment Support</option>
                          <option value="Payment & Refund Inquiry">Payment &amp; Refund Inquiry</option>
                          <option value="Diagnostic Lab / Home Nursing">Diagnostic Lab / Home Nursing</option>
                          <option value="Hospital Onboarding & Partnerships">Hospital Onboarding &amp; Partnerships</option>
                          <option value="Privacy & Data Grievance">Privacy &amp; Data Grievance</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="contact-booking" className="block text-xs font-bold text-slate-700 mb-1.5">
                          Booking / Payment ID (Optional)
                        </label>
                        <input
                          id="contact-booking"
                          type="text"
                          value={bookingRef}
                          onChange={(e) => setBookingRef(e.target.value)}
                          placeholder="e.g., pay_... or Booking ID"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contact-message" className="block text-xs font-bold text-slate-700 mb-1.5">
                        Message *
                      </label>
                      <textarea
                        id="contact-message"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Describe how our team can help you..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Submit Inquiry</span>
                      </button>
                      <a
                        href={mailtoHref}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span>Email mediqueetech@gmail.com Directly</span>
                      </a>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
