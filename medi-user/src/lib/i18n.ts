import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { enToTe } from './translations';

// Create a reverse mapping for English if necessary, 
// but since English is our base text in the source code, 
// we only need the Telugu translations.
const resources = {
  en: {
    translation: {} // Fallback to source string
  },
  te: {
    translation: enToTe
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'te'],
    
    // We are passing strings directly as keys in our dictionary, so we disable key separator
    keySeparator: false,
    
    interpolation: {
      escapeValue: false // React already safes from xss
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng' // standard key
    }
  });

export default i18n;
