import { useState } from 'react';
import { ChevronLeft, Globe, Type, Maximize } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../lib/PreferencesContext';
import { cn } from '../lib/utils';

const ProfilePreferences = () => {
  const navigate = useNavigate();
  const { language, setLanguage, fontSize, setFontSize, fontStyle, setFontStyle } = usePreferences();

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-20 overflow-x-hidden">
      {/* Header */}
      <div className="bg-theme-gradient pt-4 pb-6 px-4 sm:px-6 lg:px-8 text-white rounded-b-3xl shrink-0">
        <div className="flex items-center gap-3 w-full max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer shrink-0">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Language & Appearance</h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto max-w-4xl mx-auto w-full">
        
        {/* Language Section */}
        <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-blue-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Language</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button 
              onClick={() => setLanguage('en')}
              className={cn("p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer", language === 'en' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200')}
            >
              <span className={cn("text-base sm:text-lg font-bold", language === 'en' ? 'text-primary' : 'text-slate-700')}>English</span>
              <span className="text-xs text-slate-400">English</span>
            </button>
            <button 
              onClick={() => setLanguage('te')}
              className={cn("p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer", language === 'te' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200')}
            >
              <span className={cn("text-base sm:text-lg font-bold", language === 'te' ? 'text-primary' : 'text-slate-700')}>తెలుగు</span>
              <span className="text-xs text-slate-400">Telugu</span>
            </button>
          </div>
        </section>

        {/* Font Style Section */}
        <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-5 h-5 text-purple-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Font Style</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button 
              onClick={() => setFontStyle('default')}
              className={cn("py-3 px-2 rounded-xl border-2 transition-all text-xs sm:text-sm font-medium font-default cursor-pointer", fontStyle === 'default' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-100 text-slate-600 hover:border-slate-200')}
            >
              Default
            </button>
            <button 
              onClick={() => setFontStyle('sans')}
              className={cn("py-3 px-2 rounded-xl border-2 transition-all text-xs sm:text-sm font-medium font-sans cursor-pointer", fontStyle === 'sans' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-100 text-slate-600 hover:border-slate-200')}
            >
              Sans Serif
            </button>
            <button 
              onClick={() => setFontStyle('serif')}
              className={cn("py-3 px-2 rounded-xl border-2 transition-all text-xs sm:text-sm font-medium font-serif cursor-pointer", fontStyle === 'serif' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-100 text-slate-600 hover:border-slate-200')}
            >
              Serif
            </button>
          </div>
        </section>

        {/* Font Size Section */}
        <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Maximize className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Font Size</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button 
              onClick={() => setFontSize('small')}
              className={cn("py-3 px-2 rounded-xl border-2 transition-all text-xs sm:text-sm font-medium cursor-pointer", fontSize === 'small' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-600 hover:border-slate-200')}
            >
              Small
            </button>
            <button 
              onClick={() => setFontSize('medium')}
              className={cn("py-3 px-2 rounded-xl border-2 transition-all text-sm sm:text-base font-medium cursor-pointer", fontSize === 'medium' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-600 hover:border-slate-200')}
            >
              Medium
            </button>
            <button 
              onClick={() => setFontSize('large')}
              className={cn("py-3 px-2 rounded-xl border-2 transition-all text-base sm:text-lg font-medium cursor-pointer", fontSize === 'large' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-600 hover:border-slate-200')}
            >
              Large
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ProfilePreferences;
