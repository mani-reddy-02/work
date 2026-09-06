import { Moon, Sun, Globe, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { useTheme } from "@/context/ThemeContext"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

export function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'te' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 min-h-[calc(100vh-80px)] pb-24 transition-colors">
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 pt-4 pb-3 px-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">App Settings</h1>
      </div>
      <div className="p-4 flex flex-col gap-6">
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">

          <div className="flex flex-col gap-4">
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">Dark Mode</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Toggle dark theme</span>
                </div>
              </div>
              
              <button 
                onClick={toggleTheme}
                className={`w-14 h-8 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-gray-200'}`}
              >
                <motion.div 
                  className="w-6 h-6 bg-white rounded-full shadow-sm"
                  animate={{ x: theme === 'dark' ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">Language</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">English / Telugu</span>
                </div>
              </div>
              
              <button 
                onClick={toggleLanguage}
                className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                {i18n.language === 'te' ? 'తెలుగు' : 'English'}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
