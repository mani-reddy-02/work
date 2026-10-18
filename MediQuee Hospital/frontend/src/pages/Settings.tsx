import { useState } from "react"
import { Moon, Sun, Globe, ArrowLeft, Volume2, VolumeX, RefreshCw, BellRing } from "lucide-react"
import { motion } from "framer-motion"
import { useTheme } from "@/context/ThemeContext"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"

export function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('mediquee_sound_alerts') !== 'false';
  });

  const [autoRefreshInterval, setAutoRefreshInterval] = useState(() => {
    return localStorage.getItem('mediquee_refresh_interval') || '30';
  });

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'te' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('mediquee_sound_alerts', String(nextVal));
    toast(nextVal ? "Sound alerts enabled for orders and bookings" : "Sound alerts muted", "success");
  };

  const handleIntervalChange = (val: string) => {
    setAutoRefreshInterval(val);
    localStorage.setItem('mediquee_refresh_interval', val);
    toast(`Live dashboard refresh interval set to ${val}s`, "success");
  };

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)] pb-24 transition-colors">
      <div className="sticky top-0 z-30 bg-surface/98 backdrop-blur-md pt-4 pb-3 px-4 flex items-center justify-between border-b border-border shadow-xs">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-foreground transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('app_settings', 'App Settings')}</h1>
            <p className="text-xs text-muted">Theme, audio alerts & operational preferences</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto w-full flex flex-col gap-6">
        
        {/* Appearance & Locale */}
        <div className="bg-surface rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-xs border border-border transition-colors">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Display & Regional</p>
          <div className="flex flex-col gap-3.5">
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-background rounded-2xl shadow-xs border border-border transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground text-sm">{t('dark_mode', 'Dark Mode')}</span>
                  <span className="text-xs text-muted">Toggle sleek dark appearance</span>
                </div>
              </div>
              
              <button 
                onClick={toggleTheme}
                className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${theme === 'dark' ? 'bg-indigo-500' : 'bg-gray-200'}`}
              >
                <motion.div 
                  className="w-6 h-6 bg-surface rounded-full shadow-sm"
                  animate={{ x: theme === 'dark' ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center justify-between p-4 bg-background rounded-2xl shadow-xs border border-border transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground text-sm">{t('change_language', 'Change Language')}</span>
                  <span className="text-xs text-muted">English / తెలుగు</span>
                </div>
              </div>
              
              <button 
                onClick={toggleLanguage}
                className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
              >
                {i18n.language === 'te' ? 'తెలుగు' : 'English'}
              </button>
            </div>

          </div>
        </div>

        {/* Operational & Sound Preferences */}
        <div className="bg-surface rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-xs border border-border transition-colors">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Operations & Alerts</p>
          <div className="flex flex-col gap-3.5">
            
            {/* Sound Chimes */}
            <div className="flex items-center justify-between p-4 bg-background rounded-2xl shadow-xs border border-border transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground text-sm">Order Audio Chimes</span>
                  <span className="text-xs text-muted">Play sound alert upon new sample collection request</span>
                </div>
              </div>

              <button 
                onClick={toggleSound}
                className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${soundEnabled ? 'bg-amber-500' : 'bg-gray-200'}`}
              >
                <motion.div 
                  className="w-6 h-6 bg-surface rounded-full shadow-sm"
                  animate={{ x: soundEnabled ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Auto-Refresh Interval */}
            <div className="flex items-center justify-between p-4 bg-background rounded-2xl shadow-xs border border-border transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground text-sm">Dashboard Auto-Sync</span>
                  <span className="text-xs text-muted">Polling frequency for live booking updates</span>
                </div>
              </div>

              <select
                value={autoRefreshInterval}
                onChange={e => handleIntervalChange(e.target.value)}
                className="px-3 py-1.5 bg-surface border border-border rounded-xl text-xs font-bold text-foreground outline-none cursor-pointer"
              >
                <option value="15">Every 15s</option>
                <option value="30">Every 30s</option>
                <option value="60">Every 60s</option>
              </select>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
