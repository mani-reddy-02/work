import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Language = 'en' | 'te';
type FontSize = 'small' | 'medium' | 'large';
type FontStyle = 'default' | 'serif' | 'sans';

interface Preferences {
  language: Language;
  fontSize: FontSize;
  fontStyle: FontStyle;
}

interface PreferencesContextType extends Preferences {
  setLanguage: (lang: Language) => void;
  setFontSize: (size: FontSize) => void;
  setFontStyle: (style: FontStyle) => void;
}

const defaultPreferences: Preferences = {
  language: 'en',
  fontSize: 'medium',
  fontStyle: 'default',
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferencesState] = useState<Preferences>(() => {
    const saved = localStorage.getItem('mediquee_preferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem('mediquee_preferences', JSON.stringify(preferences));

    // Apply font size
    const html = document.documentElement;
    if (preferences.fontSize === 'small') {
      html.style.fontSize = '14px';
    } else if (preferences.fontSize === 'large') {
      html.style.fontSize = '18px';
    } else {
      html.style.fontSize = '16px';
    }

    // Apply font style
    html.classList.remove('font-sans', 'font-serif', 'font-default');
    if (preferences.fontStyle === 'sans') {
      html.classList.add('font-sans');
    } else if (preferences.fontStyle === 'serif') {
      html.classList.add('font-serif');
    } else {
      html.classList.add('font-default');
    }

    // Sync initial language with i18next
    import('./i18n').then(m => {
      if (m.default.language !== preferences.language) {
        m.default.changeLanguage(preferences.language);
      }
    });

  }, [preferences]);

  const setLanguage = (language: Language) => {
    setPreferencesState(prev => ({ ...prev, language }));
  };
  const setFontSize = (fontSize: FontSize) => setPreferencesState(prev => ({ ...prev, fontSize }));
  const setFontStyle = (fontStyle: FontStyle) => setPreferencesState(prev => ({ ...prev, fontStyle }));

  return (
    <PreferencesContext.Provider value={{ ...preferences, setLanguage, setFontSize, setFontStyle }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
