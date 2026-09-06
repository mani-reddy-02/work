import { useState } from 'react';
import { ChevronLeft, Globe, Type, Maximize } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../lib/PreferencesContext';
import { cn } from '../lib/utils';

const ProfilePreferences = () => {
  const navigate = useNavigate();
  const { language, setLanguage, fontSize, setFontSize, fontStyle, setFontStyle } = usePreferences();

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-theme-gradient pt-4 pb-6 px-4 text-white rounded-b-3xl shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Language & Appearance</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        
        {/* Language Section */}
        <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-blue-500" />
            <h2 className="text-[15px] font-bold text-slate-800">Language</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setLanguage('en')}
              className={cn("p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1", language === 'en' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200')}
            >
              <span className={cn("text-base font-bold", language === 'en' ? 'text-primary' : 'text-slate-700')}>English</span>
              <span className="text-[10px] text-slate-400">English</span>
            </button>
            <button 
              onClick={() => setLanguage('te')}
              className={cn("p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1", language === 'te' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200')}
            >
              <span className={cn("text-base font-bold", language === 'te' ? 'text-primary' : 'text-slate-700')}>తెలుగు</span>
              <span className="text-[10px] text-slate-400">Telugu</span>
            </button>
          </div>
        </section>

        {/* Font Style Section */}
        <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-5 h-5 text-purple-500" />
            <h2 className="text-[15px] font-bold text-slate-800">Font Style</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setFontStyle('default')}
              className={cn("py-2 px-1 rounded-xl border-2 transition-all text-[12px] font-medium font-default", fontStyle === 'default' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-100 text-slate-600 hover:border-slate-200')}
            >
              Default
            </button>
            <button 
              onClick={() => setFontStyle('sans')}
              className={cn("py-2 px-1 rounded-xl border-2 transition-all text-[12px] font-medium font-sans", fontStyle === 'sans' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-100 text-slate-600 hover:border-slate-200')}
            >
              Sans Serif
            </button>
            <button 
              onClick={() => setFontStyle('serif')}
              className={cn("py-2 px-1 rounded-xl border-2 transition-all text-[12px] font-medium font-serif", fontStyle === 'serif' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-100 text-slate-600 hover:border-slate-200')}
            >
              Serif
            </button>
          </div>
        </section>

        {/* Font Size Section */}
        <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Maximize className="w-5 h-5 text-emerald-500" />
            <h2 className="text-[15px] font-bold text-slate-800">Font Size</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setFontSize('small')}
              className={cn("py-2 px-1 rounded-xl border-2 transition-all text-[11px] font-medium", fontSize === 'small' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-600 hover:border-slate-200')}
            >
              Small
            </button>
            <button 
              onClick={() => setFontSize('medium')}
              className={cn("py-2 px-1 rounded-xl border-2 transition-all text-[13px] font-medium", fontSize === 'medium' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-600 hover:border-slate-200')}
            >
              Medium
            </button>
            <button 
              onClick={() => setFontSize('large')}
              className={cn("py-2 px-1 rounded-xl border-2 transition-all text-[15px] font-medium", fontSize === 'large' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-600 hover:border-slate-200')}
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
