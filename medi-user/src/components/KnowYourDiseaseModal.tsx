import React, { useState } from 'react';
import { Bot, Sparkles, X, ChevronRight, AlertCircle, ArrowRight, MessageSquare, Check } from 'lucide-react';

interface HealthConcernCategory {
  id: string;
  name: string;
  specialty: string;
  description: string;
  symptoms: string[];
  recommendedType: 'hospital-op' | 'doctor';
  diseaseSearchTerm?: string;
}

const HEALTH_CATEGORIES: HealthConcernCategory[] = [
  {
    id: 'fever-cold',
    name: 'Fever, Cold & Respiratory Infections',
    specialty: 'General Medicine / Pulmonology',
    description: 'Flu, cough, viral fever, throat soreness or breathing congestion.',
    symptoms: ['Fever / Chills', 'Persistent Cough', 'Sore Throat', 'Runny / Stuffy Nose', 'Body Aches'],
    recommendedType: 'doctor',
    diseaseSearchTerm: 'Fever'
  },
  {
    id: 'headache-migraine',
    name: 'Headache & Neurological Concerns',
    specialty: 'Neurology',
    description: 'Severe headache, migraine, dizziness, or throbbing tension.',
    symptoms: ['Throbbing Headache', 'Sensitivity to Light', 'Dizziness / Vertigo', 'Migraine attacks'],
    recommendedType: 'doctor',
    diseaseSearchTerm: 'Headache'
  },
  {
    id: 'digestion-stomach',
    name: 'Digestive & Stomach Issues',
    specialty: 'Gastroenterology',
    description: 'Acidity, gastritis, constipation, nausea or abdominal discomfort.',
    symptoms: ['Acid Reflux / Heartburn', 'Stomach Pain / Cramps', 'Nausea / Vomiting', 'Bloating / Indigestion'],
    recommendedType: 'hospital-op',
    diseaseSearchTerm: 'Acidity'
  },
  {
    id: 'skin-hair',
    name: 'Skin, Hair & Allergy Problems',
    specialty: 'Dermatology',
    description: 'Skin rash, itching, acne, hair loss or allergic reactions.',
    symptoms: ['Red Itchy Rash', 'Acne / Breakouts', 'Dry Flaky Skin', 'Allergic Hives'],
    recommendedType: 'doctor',
    diseaseSearchTerm: 'Skin Rash'
  },
  {
    id: 'bone-joint',
    name: 'Bone, Joint & Muscle Pain',
    specialty: 'Orthopedics',
    description: 'Back pain, neck stiffness, knee or joint swelling and arthritis.',
    symptoms: ['Lower Back Pain', 'Knee / Joint Stiffness', 'Muscle Sprain', 'Swollen Joints'],
    recommendedType: 'hospital-op',
    diseaseSearchTerm: 'Back Pain'
  },
  {
    id: 'heart-bp',
    name: 'Heart & Blood Pressure Assessment',
    specialty: 'Cardiology',
    description: 'Chest discomfort, high BP, palpitations or shortness of breath.',
    symptoms: ['Chest Tightness', 'Irregular Heartbeat', 'High BP Readings', 'Breathlessness on Exertion'],
    recommendedType: 'hospital-op',
    diseaseSearchTerm: 'Heart Disease'
  },
  {
    id: 'pediatric',
    name: 'Child & Infant Health',
    specialty: 'Pediatrics',
    description: 'Fever, cough, poor appetite, vaccination or general pediatric consultation.',
    symptoms: ['Child Fever / Cold', 'Loss of Appetite', 'Tummy Ache in Children', 'Skin rashes in kids'],
    recommendedType: 'doctor',
    diseaseSearchTerm: 'Pediatrics'
  }
];

interface KnowYourDiseaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConcern: (concern: HealthConcernCategory) => void;
  consultationType: 'hospital-op' | 'doctor';
}

export const KnowYourDiseaseModal: React.FC<KnowYourDiseaseModalProps> = ({
  isOpen,
  onClose,
  onSelectConcern,
  consultationType
}) => {
  const [symptomText, setSymptomText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HealthConcernCategory | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  if (!isOpen) return null;

  // Frontend rule-based AI matcher
  const handleAnalyze = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!symptomText.trim()) return;

    const lower = symptomText.toLowerCase();
    
    // Match based on keywords
    let match = HEALTH_CATEGORIES.find(cat => {
      if (cat.name.toLowerCase().includes(lower)) return true;
      return cat.symptoms.some(s => lower.includes(s.toLowerCase().split(' ')[0]) || s.toLowerCase().includes(lower));
    });

    if (!match) {
      if (lower.includes('head') || lower.includes('brain') || lower.includes('migraine') || lower.includes('dizz')) {
        match = HEALTH_CATEGORIES.find(c => c.id === 'headache-migraine');
      } else if (lower.includes('stomach') || lower.includes('acid') || lower.includes('belly') || lower.includes('gas') || lower.includes('vomit')) {
        match = HEALTH_CATEGORIES.find(c => c.id === 'digestion-stomach');
      } else if (lower.includes('skin') || lower.includes('rash') || lower.includes('itch') || lower.includes('acne')) {
        match = HEALTH_CATEGORIES.find(c => c.id === 'skin-hair');
      } else if (lower.includes('bone') || lower.includes('joint') || lower.includes('knee') || lower.includes('back') || lower.includes('neck')) {
        match = HEALTH_CATEGORIES.find(c => c.id === 'bone-joint');
      } else if (lower.includes('heart') || lower.includes('chest') || lower.includes('bp') || lower.includes('pressure')) {
        match = HEALTH_CATEGORIES.find(c => c.id === 'heart-bp');
      } else if (lower.includes('baby') || lower.includes('child') || lower.includes('kid')) {
        match = HEALTH_CATEGORIES.find(c => c.id === 'pediatric');
      } else {
        match = HEALTH_CATEGORIES.find(c => c.id === 'fever-cold');
      }
    }

    setSelectedCategory(match || HEALTH_CATEGORIES[0]);
    setHasAnalyzed(true);
  };

  const handleSelectPredefined = (cat: HealthConcernCategory) => {
    setSelectedCategory(cat);
    setHasAnalyzed(true);
  };

  const handleContinue = () => {
    if (selectedCategory) {
      onSelectConcern(selectedCategory);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-5 text-white flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-lg text-white">Know Your Disease</h3>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/25 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" /> AI Guide
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">Understand your symptoms before booking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Banner */}
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-start gap-2.5 text-amber-800 text-[11px] leading-relaxed">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Medical Disclaimer:</strong> This AI tool provides educational guidance only and is not a medical diagnosis. Please consult a certified doctor for medical evaluation.
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Symptom Input Form */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              Describe what you are experiencing:
            </label>
            <form onSubmit={handleAnalyze} className="relative">
              <input
                type="text"
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                placeholder="e.g., severe headache on one side, throat ache with fever..."
                className="w-full pl-3.5 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                type="submit"
                disabled={!symptomText.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                Analyze <Sparkles className="w-3 h-3" />
              </button>
            </form>
          </div>

          {/* Quick Selection Pills */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 mb-2">Or select a common health concern:</span>
            <div className="flex flex-wrap gap-1.5">
              {HEALTH_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectPredefined(cat)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-full border font-medium transition-all ${
                    selectedCategory?.id === cat.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  {cat.name.split(' ')[0]} {cat.name.split(' ')[1] || ''}
                </button>
              ))}
            </div>
          </div>

          {/* AI Recommended Concern Result */}
          {hasAnalyzed && selectedCategory && (
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-2xl p-4 border border-blue-100 shadow-sm space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  AI Recommendation
                </span>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Health Category
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedCategory.name}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{selectedCategory.description}</p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-blue-100/70">
                <div className="text-[11px] font-bold text-slate-700 mb-1">Recommended Specialty:</div>
                <div className="text-xs font-semibold text-blue-600">{selectedCategory.specialty}</div>
                
                <div className="mt-2 text-[10px] text-slate-500">Related symptoms:</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedCategory.symptoms.map(s => (
                    <span key={s} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            disabled={!selectedCategory}
            onClick={handleContinue}
            className="flex-1 max-w-[240px] py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-1.5"
          >
            Continue with this Concern <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default KnowYourDiseaseModal;
