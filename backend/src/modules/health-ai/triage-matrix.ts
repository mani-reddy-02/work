export interface TriageInput {
  symptomDescription: string;
  duration?: string; // 'hours', 'few_days', 'weeks', 'months'
  severity?: 'mild' | 'moderate' | 'severe';
  selectedSymptoms?: string[];
  ageGroup?: 'adult' | 'child' | 'infant' | 'elderly';
  reportedRedFlags?: string[];
}

export interface TriageResult {
  category: 'EMERGENCY' | 'ROUTED' | 'GENERAL_CONSULT';
  urgency: 'IMMEDIATE_EMERGENCY' | 'SAME_DAY_PRIORITY' | 'ROUTINE_OP';
  recommendedDepartment: string;
  departmentKey: string;
  clinicalRationale: string;
  isRedFlag: boolean;
  redFlagsList: string[];
  safetyAdvisory: string;
  recommendedActions: string[];
  patientTips: string[];
}

// Clinician-Reviewed Emergency Red Flags
const RED_FLAG_KEYWORDS = [
  { trigger: 'chest pain', alert: 'Chest pain or heavy tightness (potential cardiac event)' },
  { trigger: 'heart attack', alert: 'Suspected heart attack signs' },
  { trigger: 'radiat', alert: 'Pain radiating to jaw, neck, back, or left arm' },
  { trigger: 'severe breath', alert: 'Severe sudden shortness of breath or gasping for air' },
  { trigger: 'slurred speech', alert: 'Sudden slurred speech or difficulty speaking (potential stroke)' },
  { trigger: 'face droop', alert: 'Facial drooping or one-sided weakness' },
  { trigger: 'unconscious', alert: 'Loss of consciousness, fainting, or blackout' },
  { trigger: 'coughing blood', alert: 'Hemoptysis (coughing up fresh blood)' },
  { trigger: 'vomiting blood', alert: 'Hematemesis (vomiting blood)' },
  { trigger: 'uncontrolled bleed', alert: 'Heavy, uncontrolled bleeding from a wound' },
  { trigger: 'anaphylaxis', alert: 'Severe allergic swelling of throat or tongue' },
  { trigger: 'thunderclap', alert: 'Sudden unbearable worst-headache-of-life' },
  { trigger: 'seizure', alert: 'Active or prolonged seizure / convulsions' },
];

interface DepartmentRule {
  name: string;
  key: string;
  keywords: string[];
  rationale: string;
  tips: string[];
}

const DEPARTMENT_RULES: DepartmentRule[] = [
  {
    name: 'Cardiology',
    key: 'cardiology',
    keywords: ['palpitation', 'irregular heartbeat', 'pulse racing', 'high bp', 'blood pressure', 'hypertension', 'ankle swelling', 'swollen feet with fatigue', 'breathless on exertion'],
    rationale: 'Symptoms involve cardiovascular regulation, blood pressure, or heart rhythm symptoms that warrant focused cardiac evaluation.',
    tips: ['Keep records of past BP readings', 'List all medications currently taken', 'Avoid heavy physical exertion before appointment']
  },
  {
    name: 'Neurology',
    key: 'neurology',
    keywords: ['headache', 'migraine', 'dizziness', 'vertigo', 'tremor', 'numbness', 'tingling', 'pin and needle', 'nerve pain', 'sciatica', 'memory loss', 'confusion', 'fits history'],
    rationale: 'Symptoms relate to central or peripheral nervous system function, chronic head pain, or sensory coordination.',
    tips: ['Note the frequency and triggers of episodes', 'Avoid skipping meals or irregular sleep', 'Bring any previous MRI/CT brain scans']
  },
  {
    name: 'Pulmonology',
    key: 'pulmonology',
    keywords: ['cough', 'phlegm', 'sputum', 'wheezing', 'asthma', 'bronchitis', 'smoker', 'chest congestion', 'breathlessness', 'dust allergy'],
    rationale: 'Respiratory tract, bronchial airways, and lung function concerns benefit from pulmonologist consultation.',
    tips: ['Note if cough produces colored sputum', 'Observe if symptoms worsen at night or in cold weather', 'Do not take strong unprescribed suppressants']
  },
  {
    name: 'Gastroenterology',
    key: 'gastroenterology',
    keywords: ['stomach pain', 'abdominal', 'acidity', 'gerd', 'heartburn', 'gas', 'bloating', 'indigestion', 'vomit', 'nausea', 'loose motion', 'diarrhea', 'constipation', 'jaundice', 'yellow eye', 'liver'],
    rationale: 'Digestive tract, stomach, intestinal or hepatobiliary discomfort requiring gastrointestinal care.',
    tips: ['Maintain hydration with oral fluids / tender coconut', 'Eat light, non-spicy, easily digestible meals', 'Avoid self-medicating with antibiotics']
  },
  {
    name: 'Orthopedics',
    key: 'orthopedics',
    keywords: ['joint pain', 'knee', 'back pain', 'spine', 'shoulder', 'neck pain', 'bone', 'fracture', 'sprain', 'swollen knee', 'arthritis', 'walking difficulty', 'stiff joint'],
    rationale: 'Musculoskeletal system, bone alignment, joints, ligaments and spine symptoms.',
    tips: ['Avoid strenuous lifting or awkward postures', 'Apply warm or cold compress as appropriate', 'Wear supportive comfortable footwear']
  },
  {
    name: 'Dermatology',
    key: 'dermatology',
    keywords: ['skin', 'rash', 'itching', 'itch', 'pimple', 'acne', 'eczema', 'psoriasis', 'fungal', 'ringworm', 'hair fall', 'dandruff', 'boil', 'mole', 'allergy on skin'],
    rationale: 'Integumentary conditions affecting the skin surface, scalp, hair, and dermal barrier.',
    tips: ['Do not scratch or pop lesions', 'Avoid harsh soaps or unauthorized steroid creams', 'Take clear photos of rash progression']
  },
  {
    name: 'Pediatrics',
    key: 'pediatrics',
    keywords: ['child', 'baby', 'infant', 'toddler', 'pediatric', 'kid', 'vaccination for baby'],
    rationale: 'Age-appropriate medical assessment for infants, children, and young adolescents by a pediatrician.',
    tips: ['Monitor child oral intake and hydration carefully', 'Keep the child immunization card handy', 'Check temperature with a calibrated digital thermometer']
  },
  {
    name: 'Gynecology',
    key: 'gynecology',
    keywords: ['period', 'menstrual', 'cramp', 'vaginal', 'discharge', 'pregnancy', 'pregnant', 'pcod', 'pcos', 'ovary', 'uterus', 'pelvic pain', 'irregular period'],
    rationale: 'Female reproductive health, hormonal cycles, prenatal health, and gynecological wellness.',
    tips: ['Record the first day of your last menstrual period (LMP)', 'Note flow consistency and cycle regularity', 'List any hormonal supplements']
  },
  {
    name: 'ENT (Otorhinolaryngology)',
    key: 'ent',
    keywords: ['ear pain', 'ear discharge', 'ear block', 'hearing', 'tinnitus', 'throat pain', 'sore throat', 'tonsil', 'swallowing pain', 'sinus', 'sinusitis', 'nasal block', 'nose bleed', 'cold running nose'],
    rationale: 'Ear, nose, throat, and sinus structures requiring ENT examination.',
    tips: ['Do not insert cotton buds or pins into ear canals', 'Gargle with warm saline water for mild throat irritation', 'Steam inhalation can relieve nasal congestion']
  },
  {
    name: 'Ophthalmology',
    key: 'ophthalmology',
    keywords: ['eye', 'vision', 'blurry', 'red eye', 'eye pain', 'burning eye', 'cataract', 'watery eye', 'spectacles', 'dry eye'],
    rationale: 'Visual acuity, ocular surface, cornea, and ophthalmological diagnostics.',
    tips: ['Avoid rubbing the eyes', 'Take regular breaks from digital screens', 'Bring existing spectacle prescriptions']
  },
  {
    name: 'Urology',
    key: 'urology',
    keywords: ['urine', 'urination', 'burning urine', 'frequent urine', 'kidney stone', 'flank pain', 'blood in urine', 'prostate'],
    rationale: 'Urinary tract, bladder, renal calculus, and urological system concerns.',
    tips: ['Drink adequate water unless medically restricted', 'Avoid holding urine for prolonged periods', 'Urinalysis report may be recommended by the doctor']
  },
  {
    name: 'Psychiatry',
    key: 'psychiatry',
    keywords: ['anxiety', 'panic', 'depression', 'insomnia', 'sleepless', 'stress', 'mental health', 'overthinking', 'sadness', 'mood swing'],
    rationale: 'Mental well-being, psychological assessment, and compassionate behavioral healthcare.',
    tips: ['Maintain a regular sleep schedule', 'Practice gentle deep-breathing exercises', 'Sharing feelings with a qualified clinician is safe and confidential']
  }
];

export class ClinicianTriageEngine {
  /**
   * Deterministically evaluates symptoms using clinician-reviewed triage rules
   * NEVER uses LLM hallucinations to diagnose disease
   */
  static evaluate(input: TriageInput): TriageResult {
    const rawText = (input.symptomDescription || '').toLowerCase();
    const additionalSymptoms = (input.selectedSymptoms || []).map(s => s.toLowerCase());
    const combinedText = `${rawText} ${additionalSymptoms.join(' ')}`;

    // 1. Check for Emergency Red Flags
    const detectedRedFlags: string[] = [];
    for (const rf of RED_FLAG_KEYWORDS) {
      if (combinedText.includes(rf.trigger)) {
        detectedRedFlags.push(rf.alert);
      }
    }
    if (input.reportedRedFlags && input.reportedRedFlags.length > 0) {
      detectedRedFlags.push(...input.reportedRedFlags);
    }

    if (detectedRedFlags.length > 0 || input.severity === 'severe') {
      // If critical cardiac/stroke/hemorrhage red flags exist
      const hasCriticalRedFlag = detectedRedFlags.some(rf => 
        rf.includes('heart') || rf.includes('Chest pain') || rf.includes('stroke') || rf.includes('consciousness') || rf.includes('bleed')
      );

      if (hasCriticalRedFlag) {
        return {
          category: 'EMERGENCY',
          urgency: 'IMMEDIATE_EMERGENCY',
          recommendedDepartment: 'Emergency Medicine / Casualty',
          departmentKey: 'emergency',
          clinicalRationale: 'Warning signs indicate a potentially critical medical situation that requires immediate physical clinical evaluation.',
          isRedFlag: true,
          redFlagsList: detectedRedFlags,
          safetyAdvisory: 'CRITICAL ALERT: Please do not wait for a scheduled OP appointment. Proceed immediately to the nearest hospital Emergency Room or call 108 Emergency Ambulance service.',
          recommendedActions: [
            'Call 108 or your local Emergency Ambulance immediately',
            'Proceed to the nearest hospital Casualty / Emergency Ward',
            'Have someone accompany you; do not drive yourself'
          ],
          patientTips: [
            'Sit in a comfortable resting position',
            'Loosen tight clothing around neck and waist',
            'Keep your identification and insurance cards readily available'
          ]
        };
      }
    }

    // 2. Special Pediatric Routing if Age is child/infant
    if (input.ageGroup === 'child' || input.ageGroup === 'infant') {
      return {
        category: 'ROUTED',
        urgency: input.severity === 'moderate' ? 'SAME_DAY_PRIORITY' : 'ROUTINE_OP',
        recommendedDepartment: 'Pediatrics',
        departmentKey: 'pediatrics',
        clinicalRationale: 'For children and infants, evaluation by a specialized Pediatrician ensures safe, age-specific examination and dosage.',
        isRedFlag: false,
        redFlagsList: detectedRedFlags,
        safetyAdvisory: 'General outpatient department recommendation based on age and clinical protocol.',
        recommendedActions: [
          'Book an OP consultation with a Pediatrician',
          'Keep hydration steady with age-appropriate fluids',
          'Monitor body temperature with a digital thermometer'
        ],
        patientTips: [
          'Bring past vaccination cards',
          'Note down specific feeding patterns or activity changes'
        ]
      };
    }

    // 3. Match against Department Rules
    let bestMatch: DepartmentRule | null = null;
    let highestScore = 0;

    for (const rule of DEPARTMENT_RULES) {
      let score = 0;
      for (const kw of rule.keywords) {
        if (combinedText.includes(kw)) {
          score += 1;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = rule;
      }
    }

    if (bestMatch && highestScore > 0) {
      return {
        category: 'ROUTED',
        urgency: input.severity === 'moderate' ? 'SAME_DAY_PRIORITY' : 'ROUTINE_OP',
        recommendedDepartment: bestMatch.name,
        departmentKey: bestMatch.key,
        clinicalRationale: bestMatch.rationale,
        isRedFlag: detectedRedFlags.length > 0,
        redFlagsList: detectedRedFlags,
        safetyAdvisory: 'This department recommendation is for OP navigation only and is not a medical diagnosis.',
        recommendedActions: [
          `Consult a qualified specialist in ${bestMatch.name}`,
          'Choose an accredited hospital and convenient doctor time slot',
          'If symptoms abruptly worsen, seek emergency hospital care immediately'
        ],
        patientTips: bestMatch.tips
      };
    }

    // 4. Default Safe Route: General Medicine (Internal Medicine)
    return {
      category: 'GENERAL_CONSULT',
      urgency: 'ROUTINE_OP',
      recommendedDepartment: 'General Medicine',
      departmentKey: 'general-medicine',
      clinicalRationale: 'General Medicine (Physician) is the ideal primary care entry point for comprehensive evaluation, initial blood tests, and referral if sub-specialty care is needed.',
      isRedFlag: false,
      redFlagsList: detectedRedFlags,
      safetyAdvisory: 'A General Physician can assess full health history and direct to specialized care if required.',
      recommendedActions: [
        'Schedule an OP visit with a General Physician',
        'Hospital reception staff can assist with on-arrival clinical guidance'
      ],
      patientTips: [
        'List all current symptoms and when they began',
        'Bring any previous medical prescriptions or laboratory test reports'
      ]
    };
  }

  static getSupportedDepartments() {
    return DEPARTMENT_RULES.map(r => ({
      name: r.name,
      key: r.key,
      commonSymptoms: r.keywords.slice(0, 5)
    }));
  }
}
