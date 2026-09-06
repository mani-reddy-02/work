import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "appointments": "Appointments",
      "patients": "Patients",
      "payout": "Payout",
      "profile": "Profile",
      "quick_add": "Quick Add",
      "add_patient": "Add Patient",
      "add_doctor": "Add Doctor",
      "add_department": "Add Department",
      "add_receptionist": "Add Receptionist",
      "add_nurse": "Add Nurse",
      "add_lab": "Add Lab",
      "logout": "Logout",
      "settings": "Settings",
      "change_language": "Change Language",
      "dark_mode": "Dark Mode",
      "notifications": "Notifications",
      "security": "Security & Privacy",
      "app_settings": "App Settings",
      "overview": "Overview",
      "recent_activity": "Recent Activity",
      "view_all": "View All",
    }
  },
  te: {
    translation: {
      "dashboard": "డాష్‌బోర్డ్",
      "appointments": "అపాయింట్‌మెంట్‌లు",
      "patients": "రోగులు",
      "payout": "చెల్లింపులు",
      "profile": "ప్రొఫైల్",
      "quick_add": "త్వరిత చేర్పు",
      "add_patient": "రోగిని చేర్చు",
      "add_doctor": "డాక్టర్‌ని చేర్చు",
      "add_department": "డిపార్ట్‌మెంట్‌ని చేర్చు",
      "add_receptionist": "రిసెప్షనిస్ట్‌ని చేర్చు",
      "add_nurse": "నర్స్‌ని చేర్చు",
      "add_lab": "ల్యాబ్‌ని చేర్చు",
      "logout": "లాగ్అవుట్",
      "settings": "సెట్టింగులు",
      "change_language": "భాషను మార్చండి",
      "dark_mode": "డార్క్ మోడ్",
      "notifications": "నోటిఫికేషన్‌లు",
      "security": "భద్రత & గోప్యత",
      "app_settings": "యాప్ సెట్టింగులు",
      "overview": "అవలోకనం",
      "recent_activity": "ఇటీవలి కార్యాచరణ",
      "view_all": "అన్నీ చూడండి",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
