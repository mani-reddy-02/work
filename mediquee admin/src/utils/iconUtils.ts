// Icon mapping utilities and preset icons for Mediquee Admin

export interface IconPreset {
  name: string;
  url: string;
  category: 'Conditions' | 'Specializations' | 'Tests & Scans' | 'General';
}

export const PRESET_ICONS: IconPreset[] = [
  // Specializations
  { name: 'Cardiology', url: '/icons/specializations/cardiology.jpg', category: 'Specializations' },
  { name: 'Dermatology', url: '/icons/specializations/dermatology.jpg', category: 'Specializations' },
  { name: 'Nephrology', url: '/icons/specializations/nephrology.jpg', category: 'Specializations' },
  { name: 'Neurology', url: '/icons/specializations/neurology.jpg', category: 'Specializations' },
  { name: 'Ophthalmology', url: '/icons/specializations/ophthalmology.jpg', category: 'Specializations' },
  { name: 'Pulmonology', url: '/icons/specializations/pulmonology.jpg', category: 'Specializations' },

  // Common Conditions & Symptoms
  { name: 'Fever', url: '/optimized/Fever.webp', category: 'Conditions' },
  { name: 'Common Cold', url: '/optimized/Common Cold.webp', category: 'Conditions' },
  { name: 'Flu', url: '/optimized/Flu.webp', category: 'Conditions' },
  { name: 'Headache / Migraine', url: '/optimized/Migraine.webp', category: 'Conditions' },
  { name: 'Back Pain', url: '/optimized/Back Pain.webp', category: 'Conditions' },
  { name: 'Joint Pain', url: '/optimized/Joint Pain.webp', category: 'Conditions' },
  { name: 'Arthritis', url: '/optimized/Arthritis.webp', category: 'Conditions' },
  { name: 'Heart Attack', url: '/optimized/Heart Attack.webp', category: 'Conditions' },
  { name: 'Heart Disease', url: '/optimized/Heart Disease.webp', category: 'Conditions' },
  { name: 'Hypertension', url: '/optimized/Hypertension.webp', category: 'Conditions' },
  { name: 'Asthma', url: '/optimized/Asthma.webp', category: 'Conditions' },
  { name: 'Bronchitis', url: '/optimized/Bronchitis.webp', category: 'Conditions' },
  { name: 'Pneumonia', url: '/optimized/Pneumonia.webp', category: 'Conditions' },
  { name: 'COPD', url: '/optimized/COPD.webp', category: 'Conditions' },
  { name: 'Diabetes', url: '/optimized/Diabetes.webp', category: 'Conditions' },
  { name: 'Gastritis / Acidity', url: '/optimized/Gastritis.webp', category: 'Conditions' },
  { name: 'GERD / Reflux', url: '/optimized/GERD.webp', category: 'Conditions' },
  { name: 'Peptic Ulcer', url: '/optimized/Peptic Ulcer.webp', category: 'Conditions' },
  { name: 'Kidney Disease', url: '/optimized/Kidney Disease.webp', category: 'Conditions' },
  { name: 'Kidney Stones', url: '/optimized/Kidney Stones.webp', category: 'Conditions' },
  { name: 'Skin Infection', url: '/optimized/Skin Infection.webp', category: 'Conditions' },
  { name: 'Acne', url: '/optimized/Acne.webp', category: 'Conditions' },
  { name: 'Eczema', url: '/optimized/Eczema.webp', category: 'Conditions' },
  { name: 'Psoriasis', url: '/optimized/Psoriasis.webp', category: 'Conditions' },
  { name: 'Ear Infection', url: '/optimized/Ear Infection.webp', category: 'Conditions' },
  { name: 'Sinusitis', url: '/optimized/Sinusitis.webp', category: 'Conditions' },
  { name: 'Dental / Sore Throat', url: '/optimized/Pharyngitis.webp', category: 'Conditions' },
  { name: 'Dry Eye / Cataract', url: '/optimized/Dry Eye.webp', category: 'Conditions' },
  { name: 'Stroke', url: '/optimized/Stroke.webp', category: 'Conditions' },
  { name: 'Epilepsy', url: '/optimized/Epilepsy.webp', category: 'Conditions' },
  { name: 'Thyroid Disorder', url: '/optimized/Thyroid Disorder.webp', category: 'Conditions' },
  { name: 'PCOS / PCOD', url: '/optimized/PCOS.webp', category: 'Conditions' },
  { name: 'Bone Fracture', url: '/optimized/Bone Fracture.webp', category: 'Conditions' },
  { name: 'Viral Infection', url: '/optimized/Viral Infection.webp', category: 'Conditions' },
  { name: 'Allergy', url: '/optimized/Allergy.webp', category: 'Conditions' },
  { name: 'Cancer', url: '/optimized/Cancer.webp', category: 'Conditions' },
  { name: 'Vitamin Deficiency', url: '/optimized/Vitamin Deficiency.webp', category: 'Conditions' },
  { name: 'Erectile Dysfunction', url: '/optimized/Erectile Dysfunction.webp', category: 'Conditions' },
  { name: 'Fatty Liver Disease', url: '/optimized/Fatty Liver Disease.webp', category: 'Conditions' },

  // Tests & Scans
  { name: 'Blood Test', url: '/optimized/Blood Test.webp', category: 'Tests & Scans' },
  { name: 'Blood Group Test', url: '/optimized/Blood Group Test.webp', category: 'Tests & Scans' },
  { name: 'Blood Sugar Test', url: '/optimized/Blood Sugar Test.webp', category: 'Tests & Scans' },
  { name: 'Cholesterol Test', url: '/optimized/Cholesterol Test.webp', category: 'Tests & Scans' },
  { name: 'ECG', url: '/optimized/ECG.webp', category: 'Tests & Scans' },
  { name: 'Echocardiogram', url: '/optimized/Echocardiogram.webp', category: 'Tests & Scans' },
  { name: 'X-Ray', url: '/optimized/X-Ray.webp', category: 'Tests & Scans' },
  { name: 'Ultrasound Scan', url: '/optimized/Ultrasound Scan.webp', category: 'Tests & Scans' },
  { name: 'CT Scan', url: '/optimized/CT Scan.webp', category: 'Tests & Scans' },
  { name: 'MRI Scan', url: '/optimized/MRI Scan.webp', category: 'Tests & Scans' },
  { name: 'PET Scan', url: '/optimized/PET Scan.webp', category: 'Tests & Scans' },
  { name: 'Mammogram', url: '/optimized/Mammogram.webp', category: 'Tests & Scans' },
  { name: 'Endoscopy', url: '/optimized/Endoscopy.webp', category: 'Tests & Scans' },
  { name: 'Colonoscopy', url: '/optimized/Colonoscopy.webp', category: 'Tests & Scans' },
  { name: 'Pregnancy Test', url: '/optimized/Pregnancy Test.webp', category: 'Tests & Scans' },
  { name: 'Liver Function Test', url: '/optimized/Liver Function Test.webp', category: 'Tests & Scans' },
  { name: 'Kidney Function Test', url: '/optimized/Kidney Function Test.webp', category: 'Tests & Scans' },
  { name: 'Urine Test', url: '/optimized/Urine Test.webp', category: 'Tests & Scans' },
  { name: 'Stool Test', url: '/optimized/Stool Test.webp', category: 'Tests & Scans' },
  { name: 'Dengue Test', url: '/optimized/Dengue Test.webp', category: 'Tests & Scans' },
  { name: 'Malaria Test', url: '/optimized/Malaria Test.webp', category: 'Tests & Scans' },
  { name: 'Typhoid Test', url: '/optimized/Typhoid Test.webp', category: 'Tests & Scans' },
  { name: 'Hepatitis B-C Test', url: '/optimized/Hepatitis B-C Test.webp', category: 'Tests & Scans' },
  { name: 'HIV Test', url: '/optimized/HIV Test.webp', category: 'Tests & Scans' },
  { name: 'Vitamin D Test', url: '/optimized/Vitamin D Test.webp', category: 'Tests & Scans' },
  { name: 'Vitamin B12 Test', url: '/optimized/Vitamin B12 Test.webp', category: 'Tests & Scans' }
];

const specialtyIconMap: Record<string, string> = {
  'cardiology': '/icons/specializations/cardiology.jpg',
  'dermatology': '/icons/specializations/dermatology.jpg',
  'nephrology': '/icons/specializations/nephrology.jpg',
  'neurology': '/icons/specializations/neurology.jpg',
  'ophthalmology': '/icons/specializations/ophthalmology.jpg',
  'pulmonology': '/icons/specializations/pulmonology.jpg',
  'andrology': '/optimized/Erectile Dysfunction.webp',
  'audiology': '/optimized/Ear Infection.webp',
  'cardiothoracic surgery': '/optimized/Heart Disease.webp',
  'dentistry': '/optimized/Pharyngitis.webp',
  'dietetics & nutrition': '/optimized/Metabolic Syndrome.webp',
  'endocrinology': '/optimized/Diabetes.webp',
  'ent (otorhinolaryngology)': '/optimized/Sinusitis.webp',
  'ent': '/optimized/Sinusitis.webp',
  'family medicine': '/optimized/Common Cold.webp',
  'gastroenterology': '/optimized/Gastritis.webp',
  'gastrointestinal surgery': '/optimized/Colonoscopy.webp',
  'general medicine': '/optimized/Blood Test.webp',
  'general surgery': '/optimized/Endoscopy.webp',
  'genetics': '/optimized/Blood Test.webp',
  'geriatrics': "/optimized/Alzheimer's Disease.webp",
  'gynecology': '/optimized/PCOS.webp',
  'hematology': '/optimized/Anemia.webp',
  'hepatology': '/optimized/Hepatitis.webp',
  'immunology & allergy': '/optimized/Allergy.webp',
  'infectious diseases': '/optimized/Viral Infection.webp',
  'maxillofacial surgery': '/optimized/Sinusitis.webp',
  'neonatology': '/optimized/Pregnancy Test.webp',
  'neurosurgery': '/optimized/Stroke.webp',
  'obstetrics': '/optimized/Pregnancy Test.webp',
  'oncology (medical)': '/optimized/Cancer.webp',
  'oncology': '/optimized/Cancer.webp',
  'orthodontics': '/optimized/Pharyngitis.webp',
  'orthopedics': '/optimized/Arthritis.webp',
  'pain management': '/optimized/Back Pain.webp',
  'pediatric surgery': '/optimized/Ultrasound Scan.webp',
  'pediatrics': '/optimized/Common Cold.webp',
  'physiotherapy & rehabilitation': '/optimized/Joint Pain.webp',
  'plastic & reconstructive surgery': '/optimized/Skin Infection.webp',
  'podiatry': '/optimized/Joint Pain.webp',
  'psychiatry': "/optimized/Alzheimer's Disease.webp",
  'psychology': '/optimized/Metabolic Syndrome.webp',
  'rheumatology': '/optimized/Arthritis.webp',
  'sleep medicine': '/optimized/COPD.webp',
  'sports medicine': '/optimized/Bone Fracture.webp',
  'surgical oncology': '/optimized/Cancer.webp',
  'urology': '/optimized/Kidney Stones.webp',
  'vascular surgery': '/optimized/Coronary Artery Disease.webp'
};

const keywordRules = [
  { regex: /\b(ache|back|spine|sciatica|lumbar)\b/i, icon: 'Back Pain.webp' },
  { regex: /\b(joint|arthritis|gout|knee|rheumatoid)\b/i, icon: 'Arthritis.webp' },
  { regex: /\b(bone|fracture|trauma|sprain|injur|dislocation)\b/i, icon: 'Bone Fracture.webp' },
  { regex: /\b(fever|pyrexia|typhoid|dengue|malaria)\b/i, icon: 'Fever.webp' },
  { regex: /\b(cold|flu|influenza|coryza|sneezing|runny nose|congestion)\b/i, icon: 'Common Cold.webp' },
  { regex: /\b(cough|bronchitis)\b/i, icon: 'Bronchitis.webp' },
  { regex: /\b(asthma|breath|wheezing|shortness of breath|respiratory|dyspnea)\b/i, icon: 'Asthma.webp' },
  { regex: /\b(pneumonia|fibrosis)\b/i, icon: 'Pneumonia.webp' },
  { regex: /\b(copd|tuberculosis|tb)\b/i, icon: 'COPD.webp' },
  { regex: /\b(headache|migraine|cephalea)\b/i, icon: 'Migraine.webp' },
  { regex: /\b(heart|cardio|coronary|angina|palpitation|murmur|bypass|valve|aortic|arrhythmia|infarction)\b/i, icon: 'Heart Disease.webp' },
  { regex: /\b(hypertension|blood pressure|bp)\b/i, icon: 'Hypertension.webp' },
  { regex: /\b(cholesterol|lipid)\b/i, icon: 'Cholesterol Test.webp' },
  { regex: /\b(diabetes|sugar|glucose|insulin)\b/i, icon: 'Diabetes.webp' },
  { regex: /\b(kidney|renal|nephro|dialysis|creatinine|urinary|urine|uti|incontinence|bladder)\b/i, icon: 'Kidney Disease.webp' },
  { regex: /\b(stone|calculus)\b/i, icon: 'Kidney Stones.webp' },
  { regex: /\b(liver|hepatic|hepatitis|jaundice|cirrhosis)\b/i, icon: 'Fatty Liver Disease.webp' },
  { regex: /\b(stomach|gastric|gastritis|gerd|reflux|acid|ulcer|peptic|gastro|colorectal|colon|bowel|constipation|diarrhea)\b/i, icon: 'Gastritis.webp' },
  { regex: /\b(skin|derma|acne|eczema|psoriasis|rash|allergy|allergic|vitiligo|melanoma|itch|mole|wart)\b/i, icon: 'Skin Infection.webp' },
  { regex: /\b(eye|vision|cataract|glaucoma|ophthalm|sight|myopia|conjunctivitis)\b/i, icon: 'Dry Eye.webp' },
  { regex: /\b(ear|audio|hearing|deaf|tinnitus|vertigo)\b/i, icon: 'Ear Infection.webp' },
  { regex: /\b(throat|tonsil|pharyngitis|laryngitis|voice|sinus|ent)\b/i, icon: 'Sinusitis.webp' },
  { regex: /\b(tooth|teeth|dental|dentist|gum|cavity|cavities|canal|oral)\b/i, icon: 'Pharyngitis.webp' },
  { regex: /\b(cancer|tumor|chemo|biopsy|lymphoma|leukemia|oncology)\b/i, icon: 'Cancer.webp' },
  { regex: /\b(brain|neuro|stroke|seizure|epilepsy|parkinson|alzheimer|tremor|numbness|tingling|dementia|memory)\b/i, icon: 'Stroke.webp' },
  { regex: /\b(blood|anemia|bleed|platelet|hemophilia)\b/i, icon: 'Blood Test.webp' },
  { regex: /\b(thyroid|hormone|endocrine|pcos|pcod|obesity|bariatric|weight loss|metabolic)\b/i, icon: 'Thyroid Disorder.webp' },
  { regex: /\b(pregnant|pregnancy|maternity|gynec|obstetric|fertility|infertility|pelvic|menopause|period)\b/i, icon: 'Pregnancy Test.webp' },
  { regex: /\b(erectile|andrology|prostate|semen|testosterone|varicocele)\b/i, icon: 'Erectile Dysfunction.webp' },
  { regex: /\b(virus|viral|infect|covid|dengue|malaria|hiv)\b/i, icon: 'Viral Infection.webp' },
  { regex: /\b(vitamin|deficiency|nutrition|fatigue|weakness|malnutrition)\b/i, icon: 'Vitamin Deficiency.webp' },
  { regex: /\b(checkup|screen|test|exam|prevent|routine|annual|scan)\b/i, icon: 'Blood Test.webp' },
  { regex: /\b(sleep|insomnia|apnea|snoring)\b/i, icon: 'COPD.webp' },
  { regex: /\b(child|pediatric|infant|baby|neonatal|colic|teething)\b/i, icon: 'Common Cold.webp' },
  { regex: /\b(mental|psych|depress|anxiety|stress|panic|bipolar|phobia)\b/i, icon: "Alzheimer's Disease.webp" }
];

export function resolveIconUrl(icon?: string | null, fallbackName?: string | null): string {
  // 1. Direct valid icon URL check
  if (icon && typeof icon === 'string' && icon.trim().length > 0) {
    const clean = icon.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:') || clean.startsWith('/uploads/')) {
      return clean;
    }
    if (clean.startsWith('/icons/') || clean.startsWith('/optimized/')) {
      return clean;
    }
    if (clean.endsWith('.webp') || clean.endsWith('.jpg') || clean.endsWith('.png')) {
      return `/optimized/${clean}`;
    }
  }

  // 2. Fallback to name matching
  if (fallbackName && typeof fallbackName === 'string') {
    const lower = fallbackName.trim().toLowerCase();
    
    // Check specialty match
    if (specialtyIconMap[lower]) {
      return specialtyIconMap[lower];
    }

    // Check keyword rules
    for (const rule of keywordRules) {
      if (rule.regex.test(lower)) {
        return `/optimized/${rule.icon}`;
      }
    }
  }

  // Default fallback
  return '/optimized/Blood Test.webp';
}
