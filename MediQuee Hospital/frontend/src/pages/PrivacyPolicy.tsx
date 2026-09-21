import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PrivacyPolicy() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)] pb-24 transition-colors">
      <div className="sticky top-0 z-30 bg-background pt-4 pb-3 px-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t('privacy_policy')}</h1>
        </div>
      </div>
      
      <div className="p-4 max-w-3xl mx-auto w-full mt-4">
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="w-12 h-12 rounded-full bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Data Privacy & Security</h2>
              <p className="text-sm text-muted">Last updated: Sept 2026</p>
            </div>
          </div>
          
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h3>
              <p>We collect information you provide directly to us, such as when you create or modify your account, request services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, medical history, and transaction details.</p>
            </section>
            
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Information</h3>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Provide, maintain, and improve our services.</li>
                <li>Process healthcare transactions and send related information.</li>
                <li>Send you technical notices, updates, and security alerts.</li>
                <li>Respond to your comments, questions, and customer service requests.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-2">3. HIPAA & Medical Privacy Compliance</h3>
              <p>Your health information is protected in accordance with national healthcare compliance standards (including HIPAA where applicable). We employ end-to-end encryption for all diagnostic reports and consultation records.</p>
            </section>
            
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-2">4. Sharing of Information</h3>
              <p>We may share the information we collect about you with third parties such as laboratories, clinics, or specialist doctors only to facilitate your requested healthcare services. We do not sell your personal data to marketers.</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-2">5. Contact Us</h3>
              <p>If you have any questions about this Privacy Policy, please contact our Data Protection Officer at privacy@mediquee.com.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
