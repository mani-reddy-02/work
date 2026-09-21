import { Shield, Key, Smartphone, ArrowRight, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

export function Security() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)] pb-24 transition-colors">
      <div className="sticky top-0 z-30 bg-background pt-4 pb-3 px-4 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t('security')}</h1>
      </div>
      <div className="p-4 flex flex-col gap-6">
        
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border transition-colors">

          <div className="flex flex-col gap-4">
            
            <div onClick={() => navigate('/security/change-password')} className="flex items-center justify-between p-4 bg-background rounded-2xl shadow-sm border border-border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Key className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{t('change_password')}</span>
                  <span className="text-xs text-muted">Update your login credentials</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
            </div>

            <div onClick={() => navigate('/security/privacy-policy')} className="flex items-center justify-between p-4 bg-background rounded-2xl shadow-sm border border-border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{t('privacy_policy')}</span>
                  <span className="text-xs text-muted">Review our data practices</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
