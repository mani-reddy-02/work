export const departmentIcons: Record<string, string[]> = {
  "Hepatology": [
    "Hepatitis.webp"
  ],
  "Gastroenterology": [],
  "Nephrology": [],
  "Psychology": [],
  "Geriatrics": [],
  "Immunology & Allergy": [],
  "Hematology": [
    "Anemia.webp"
  ],
  "Vascular Surgery": [],
  "Cardiothoracic Surgery": [],
  "General Surgery": [],
  "Cardiology": [
    "Arrhythmia.webp"
  ],
  "Orthopedics": [
    "Arthritis.webp",
    "Joint Pain.webp"
  ],
  "Sports Medicine": [],
  "Rheumatology": [],
  "Physiotherapy & Rehabilitation": [],
  "Audiology": [],
  "Gastrointestinal Surgery": [],
  "Pediatrics": [],
  "Surgical Oncology": [],
  "Psychiatry": [],
  "Urology": [
    "Erectile Dysfunction.webp",
    "Kidney Stones.webp"
  ],
  "Dentistry": [],
  "Ophthalmology": [
    "Glaucoma.webp"
  ],
  "General Medicine": [],
  "Orthodontics": [],
  "Neurosurgery": [],
  "Genetics": [],
  "Plastic & Reconstructive Surgery": [],
  "Pulmonology": [
    "COPD.webp",
    "Pneumonia.webp",
    "Tuberculosis.webp"
  ],
  "Podiatry": [],
  "Oncology (Medical)": [],
  "Pain Management": [],
  "Neurology": [],
  "Dietetics & Nutrition": [],
  "Family Medicine": [],
  "Infectious Diseases": [],
  "Neonatology": [],
  "Pediatric Surgery": [],
  "Endocrinology": [
    "Obesity.webp",
    "Osteoporosis.webp"
  ],
  "ENT (Otorhinolaryngology)": [
    "Sinusitis.webp",
    "Tonsillitis.webp"
  ],
  "Dermatology": [
    "Eczema.webp",
    "Psoriasis.webp"
  ],
  "Gynecology": [],
  "Maxillofacial Surgery": [],
  "Obstetrics": [],
  "Sleep Medicine": [],
};
export const allIcons = ["Acne.webp","Allergy.webp","Alzheimer's Disease.webp","Anemia.webp","Arrhythmia.webp","Arthritis.webp","Asthma.webp","Back Pain.webp","Blood Group Test.webp","Blood Sugar Test.webp","Blood Test.webp","Bone Fracture.webp","Bronchitis.webp","Cancer.webp","Cataract.webp","Cholesterol Test.webp","Colonoscopy.webp","Common Cold.webp","Conjunctivitis.webp","Constipation.webp","COPD.webp","Coronary Artery Disease.webp","COVID-19.webp","CT Scan.webp","Dengue Test.webp","Dengue.webp","Diabetes.webp","Diarrhea.webp","Dry Eye.webp","Ear Infection.webp","ECG.webp","Echocardiogram.webp","Eczema.webp","Endoscopy.webp","Epilepsy.webp","Erectile Dysfunction.webp","Farsightedness (Hypermetropia).webp","Fatty Liver Disease.webp","Fever.webp","Flu.webp","Gastritis.webp","GERD.webp","Glaucoma.webp","Gonorrhea.webp","Heart Attack.webp","Heart Disease.webp","Hepatitis B-C Test.webp","Hepatitis.webp","HIV Infection.webp","HIV Test.webp","Hypertension.webp","Infertility.webp","Joint Pain.webp","Kidney Disease.webp","Kidney Function Test.webp","Kidney Stones.webp","Laryngitis.webp","Liver Function Test.webp","Malaria Test.webp","Mammogram.webp","Metabolic Syndrome.webp","Migraine.webp","MRI Scan.webp","Nearsightedness (Myopia).webp","Obesity.webp","Osteoporosis.webp","Parkinson's Disease.webp","PCOS.webp","Peptic Ulcer.webp","PET Scan.webp","Pharyngitis.webp","Pneumonia.webp","Pregnancy Test.webp","Psoriasis.webp","Sinusitis.webp","Skin Cancer.webp","Skin Infection.webp","Stool Test.webp","Stroke.webp","Thyroid Disorder.webp","Tonsillitis.webp","Tuberculosis.webp","Typhoid Test.webp","Ultrasound Scan.webp","Urinary Incontinence.webp","Urinary Tract Infection.webp","Urine Test.webp","Viral Infection.webp","Vitamin B12 Test.webp","Vitamin D Test.webp","Vitamin Deficiency.webp","Vitiligo.webp","X-Ray.webp"];

export const getDiseaseIconUrl = (diseaseName: string, dbIconName?: string | null): string | null => {
  if (dbIconName && allIcons.includes(dbIconName)) {
    return `/optimized/${dbIconName}`;
  }
  
  if (!diseaseName) return null;
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedQuery = normalize(diseaseName);

  for (const icon of allIcons) {
    const iconName = icon.replace('.webp', '');
    if (normalize(iconName) === normalizedQuery) {
      return `/optimized/${icon}`;
    }
  }
  return null;
};