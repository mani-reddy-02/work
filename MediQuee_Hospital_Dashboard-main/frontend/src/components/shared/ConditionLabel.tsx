
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

const basePath = import.meta.env.BASE_URL;

export const conditionIconMap: Record<string, string[]> = {
  'Acne.webp': ['acne', 'pimple', 'skin breakout'],
  'Allergy.webp': ['allergy', 'allergic', 'allergies'],
  'Alzheimer\'s Disease.webp': ['alzheimer', 'dementia'],
  'Anemia.webp': ['anemia', 'haemoglobin', 'iron deficiency'],
  'Arrhythmia.webp': ['arrhythmia', 'palpitation'],
  'Arthritis.webp': ['arthritis', 'joint pain'],
  'Asthma.webp': ['asthma', 'breathing problem', 'wheezing', 'pulmonology'],
  'Back Pain.webp': ['back pain', 'spine pain'],
  'Blood Group Test.webp': ['blood group', 'abo', 'blood type'],
  'Blood Sugar Test.webp': ['sugar', 'glucose', 'hba1c', 'fbs', 'ppbs'],
  'Blood Test.webp': ['blood test', 'cbc', 'lipid', 'blood', 'haematology'],
  'Bone Fracture.webp': ['fracture', 'broken bone', 'orthopedics'],
  'Bronchitis.webp': ['bronchitis'],
  'Cancer.webp': ['cancer', 'tumor', 'oncology', 'malignancy'],
  'Cataract.webp': ['cataract'],
  'Cholesterol Test.webp': ['cholesterol', 'lipid profile'],
  'Colonoscopy.webp': ['colonoscopy', 'colon'],
  'Common Cold.webp': ['cold', 'runny nose'],
  'Conjunctivitis.webp': ['conjunctivitis', 'pink eye'],
  'Constipation.webp': ['constipation'],
  'COPD.webp': ['copd'],
  'Coronary Artery Disease.webp': ['coronary', 'cad'],
  'COVID-19.webp': ['covid', 'corona', 'sars'],
  'CT Scan.webp': ['ct scan', 'computed tomography'],
  'Dengue Test.webp': ['dengue test'],
  'Dengue.webp': ['dengue'],
  'Diabetes.webp': ['diabetes', 'diabetic'],
  'Diarrhea.webp': ['diarrhea', 'loose motion'],
  'Dry Eye.webp': ['dry eye'],
  'Ear Infection.webp': ['ear infection', 'otitis'],
  'ECG.webp': ['ecg', 'electrocardiogram', 'ekg'],
  'Echocardiogram.webp': ['echocardiogram', 'echo'],
  'Eczema.webp': ['eczema', 'dermatitis'],
  'Endoscopy.webp': ['endoscopy', 'gi endoscopy'],
  'Epilepsy.webp': ['epilepsy', 'seizure', 'neurology', 'psychiatry'],
  'Erectile Dysfunction.webp': ['erectile dysfunction', 'ed'],
  'Farsightedness (Hypermetropia).webp': ['farsightedness', 'hypermetropia'],
  'Fatty Liver Disease.webp': ['fatty liver'],
  'Fever.webp': ['fever', 'pyrexia', 'viral fever', 'general physician', 'pediatrics'],
  'Flu.webp': ['flu', 'influenza'],
  'Gastritis.webp': ['gastritis', 'acidity', 'gastroenterology'],
  'GERD.webp': ['gerd', 'acid reflux'],
  'Glaucoma.webp': ['glaucoma', 'ophthalmology'],
  'Gonorrhea.webp': ['gonorrhea'],
  'Heart Attack.webp': ['heart attack', 'myocardial infarction'],
  'Heart Disease.webp': ['heart disease', 'cardio', 'heart', 'cardiology'],
  'Hepatitis B-C Test.webp': ['hepatitis test'],
  'Hepatitis.webp': ['hepatitis', 'jaundice', 'hepatology'],
  'HIV Infection.webp': ['hiv', 'aids'],
  'HIV Test.webp': ['hiv test'],
  'Hypertension.webp': ['hypertension', 'high bp', 'blood pressure'],
  'Infertility.webp': ['infertility'],
  'Joint Pain.webp': ['joint pain', 'knee pain'],
  'Kidney Disease.webp': ['kidney disease', 'renal', 'nephrology'],
  'Kidney Function Test.webp': ['kidney function', 'kft', 'creatinine', 'urea'],
  'Kidney Stones.webp': ['kidney stone', 'renal calculus'],
  'Laryngitis.webp': ['laryngitis', 'hoarseness'],
  'Liver Function Test.webp': ['liver function', 'lft', 'sgot', 'sgpt', 'bilirubin'],
  'Malaria Test.webp': ['malaria test'],
  'Mammogram.webp': ['mammogram'],
  'Metabolic Syndrome.webp': ['metabolic syndrome'],
  'Migraine.webp': ['migraine', 'headache'],
  'MRI Scan.webp': ['mri scan', 'magnetic resonance'],
  'Nearsightedness (Myopia).webp': ['nearsightedness', 'myopia'],
  'Obesity.webp': ['obesity', 'overweight'],
  'Osteoporosis.webp': ['osteoporosis'],
  'Parkinson\'s Disease.webp': ['parkinson'],
  'PCOS.webp': ['pcos', 'pcod'],
  'Peptic Ulcer.webp': ['peptic ulcer', 'stomach ulcer'],
  'PET Scan.webp': ['pet scan'],
  'Pharyngitis.webp': ['pharyngitis', 'sore throat'],
  'Pneumonia.webp': ['pneumonia'],
  'Pregnancy Test.webp': ['pregnancy test', 'hcg'],
  'Psoriasis.webp': ['psoriasis'],
  'Sinusitis.webp': ['sinusitis', 'sinus'],
  'Skin Cancer.webp': ['skin cancer', 'melanoma', 'dermatology'],
  'Skin Infection.webp': ['skin infection', 'rash', 'dermatology'],
  'Stool Test.webp': ['stool', 'feces', 'occult blood'],
  'Stroke.webp': ['stroke', 'paralysis'],
  'Thyroid Disorder.webp': ['thyroid', 'tsh', 't3', 't4', 'hypothyroidism', 'hyperthyroidism'],
  'Tonsillitis.webp': ['tonsillitis'],
  'Tuberculosis.webp': ['tuberculosis', 'tb'],
  'Typhoid Test.webp': ['typhoid test', 'widal'],
  'Ultrasound Scan.webp': ['ultrasound', 'usg', 'sonography'],
  'Urinary Incontinence.webp': ['incontinence'],
  'Urinary Tract Infection.webp': ['uti', 'urinary tract infection'],
  'Urine Test.webp': ['urine', 'urinalysis', 'urine culture'],
  'Viral Infection.webp': ['viral infection', 'virus'],
  'Vitamin B12 Test.webp': ['vitamin b12', 'b12'],
  'Vitamin D Test.webp': ['vitamin d', 'd3'],
  'Vitamin Deficiency.webp': ['vitamin deficiency', 'vitamin'],
  'Vitiligo.webp': ['vitiligo'],
  'X-Ray.webp': ['x-ray', 'xray', 'radiography', 'chest', 'radiology'],
};

export function getConditionIconPath(name: string): string | null {
  if (!name) return null;
  const lowerName = name.toLowerCase();
  
  // Try exact matches first
  for (const [file, keywords] of Object.entries(conditionIconMap)) {
    if (keywords.some(k => lowerName === k)) {
      return `${basePath}icons/conditions/${file}`;
    }
  }

  // Try partial matches
  for (const [file, keywords] of Object.entries(conditionIconMap)) {
    if (keywords.some(k => lowerName.includes(k))) {
      return `${basePath}icons/conditions/${file}`;
    }
  }

  // Check if filename itself loosely matches
  const iconFiles = Object.keys(conditionIconMap);
  const matchedFile = iconFiles.find(file => 
    lowerName.includes(file.toLowerCase().replace('.webp', ''))
  );

  if (matchedFile) {
    return `${basePath}icons/conditions/${matchedFile}`;
  }

  return null;
}

interface ConditionLabelProps {
  name: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export function ConditionLabel({ 
  name, 
  className, 
  iconClassName, 
  textClassName,
  showText = true 
}: ConditionLabelProps) {
  const iconPath = getConditionIconPath(name);

  return (
    <div className={cn("flex items-center gap-2 min-w-0 shrink-0", className)}>
      {iconPath ? (
        <img 
          src={iconPath} 
          alt={name} 
          className={cn("w-6 h-6 object-contain shrink-0", iconClassName)} 
        />
      ) : (
        <div className={cn("w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-400 shrink-0", iconClassName)}>
          <Activity className="w-4 h-4" />
        </div>
      )}
      {showText && (
        <span className={cn("text-sm font-medium text-gray-800 truncate", textClassName)}>
          {name}
        </span>
      )}
    </div>
  );
}
