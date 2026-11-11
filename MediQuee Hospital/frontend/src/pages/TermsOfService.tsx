import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-background min-h-screen pb-24 transition-colors">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-3 px-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3 max-w-4xl mx-auto w-full">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-muted hover:text-foreground transition-colors rounded-full hover:bg-muted/10"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Terms of Service</h1>
        </div>
      </div>
      
      <div className="p-4 max-w-4xl mx-auto w-full mt-4">
        <div className="bg-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-border">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">MediQuee Partner Terms of Service</h2>
              <p className="text-xs text-muted mt-0.5">Last updated: October 2026 • MediQuee Healthcare Solutions Pvt. Ltd.</p>
            </div>
          </div>
          
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 space-y-6 text-sm leading-relaxed">
            <section>
              <h3 className="text-base font-bold text-foreground mb-1.5">1. Acceptance of Terms</h3>
              <p>
                By registering your hospital, diagnostic laboratory, clinic, or healthcare facility on the MediQuee platform, you agree to comply with and be bound by these Terms of Service, our Privacy Policy, and applicable healthcare statutory regulations.
              </p>
            </section>
            
            <section>
              <h3 className="text-base font-bold text-foreground mb-1.5">2. Facility & Practitioner Verification</h3>
              <p>
                Healthcare facilities and independent medical practitioners must submit valid state/national accreditation licenses, establishment registrations, and clinical qualifications. MediQuee reserves the right to verify all documentation before granting full operational platform permissions.
              </p>
            </section>

            <section>
              <h3 className="text-base font-bold text-foreground mb-1.5">3. Patient Care & Medical Accountability</h3>
              <p>
                All medical consultations, diagnoses, prescription issuances, and surgical or nursing procedures are delivered under the direct professional discretion of the treating doctors and certified staff. The facility maintains ultimate responsibility for patient care quality, statutory consent records, and clinical protocols.
              </p>
            </section>

            <section>
              <h3 className="text-base font-bold text-foreground mb-1.5">4. Data Privacy & Health Records (HIPAA / DISHA)</h3>
              <p>
                Partner facilities agree to uphold strict patient confidentiality. All diagnostic reports, electronic health records (EHR), and patient vitals uploaded to MediQuee are encrypted in transit and at rest. Access is strictly governed by Row-Level Security (RLS) policies and authorized clinician privileges.
              </p>
            </section>

            <section>
              <h3 className="text-base font-bold text-foreground mb-1.5">5. Financial Settlements & Payouts</h3>
              <p>
                Fees collected for outpatient consultations, diagnostic lab tests, and home healthcare nursing visits are audited and settled in accordance with agreed disbursement cycles into the verified institutional bank account provided during registration.
              </p>
            </section>

            <section>
              <h3 className="text-base font-bold text-foreground mb-1.5">6. Termination & Compliance</h3>
              <p>
                MediQuee may suspend or terminate facility access in the event of persistent license lapses, unverified practitioner credentials, fraudulent activity, or severe patient safety violations.
              </p>
            </section>

            <section className="pt-4 border-t border-border">
              <h3 className="text-base font-bold text-foreground mb-1.5">7. Contact & Support</h3>
              <p>
                For questions regarding onboarding, legal agreements, or operational compliance:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li><strong>Helpline:</strong> <a href="tel:8331045500" className="text-primary font-semibold hover:underline">+91 8331045500</a></li>
                <li><strong>Email:</strong> support@mediquee.com | legal@mediquee.com</li>
                <li><strong>Headquarters:</strong> MediQuee Healthcare Solutions Pvt. Ltd., Hyderabad, Telangana, India</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

