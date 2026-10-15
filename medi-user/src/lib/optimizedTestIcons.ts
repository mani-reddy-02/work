/**
 * Utility for mapping test names, packages, and health concerns
 * to high-quality WebP illustrations from /public/optimized/
 */

const keywordImageMap: Array<{ keywords: string[]; image: string }> = [
  // Blood & Hematology
  {
    keywords: ['complete blood count', 'cbc', 'hemogram', 'blood test', 'esr', 'smear', 'pt/inr', 'aptt', 'ferritin', 'iron profile', 'aec', 'eosinophil', 'electrolytes', 'd-dimer', 'blood culture', 'cortisol', 'testosterone', 'hormone', 'folate', 'calcium', 'phosphorus'],
    image: '/optimized/Blood Test.webp',
  },
  {
    keywords: ['blood group', 'rh typing', 'rh factor', 'cross match'],
    image: '/optimized/Blood Group Test.webp',
  },
  // Diabetes & Blood Sugar
  {
    keywords: ['sugar', 'glucose', 'diabetes', 'hba1c', 'fbs', 'ppbs', 'glycated', 'gtt', 'fasting blood sugar', 'postprandial'],
    image: '/optimized/Blood Sugar Test.webp',
  },
  // Lipid & Cholesterol
  {
    keywords: ['lipid', 'cholesterol', 'triglyceride', 'hdl', 'ldl', 'vldl', 'cardiac risk'],
    image: '/optimized/Cholesterol Test.webp',
  },
  // Liver
  {
    keywords: ['liver', 'lft', 'bilirubin', 'sgot', 'sgpt', 'ast', 'alt', 'alkaline phosphatase', 'alp', 'amylase', 'lipase'],
    image: '/optimized/Liver Function Test.webp',
  },
  // Kidney & Renal
  {
    keywords: ['kidney', 'kft', 'rft', 'renal', 'creatinine', 'urea', 'uric acid', 'bun'],
    image: '/optimized/Kidney Function Test.webp',
  },
  // Thyroid
  {
    keywords: ['thyroid', 'tsh', 't3', 't4', 'ft3', 'ft4'],
    image: '/optimized/Thyroid Disorder.webp',
  },
  // Vitamins
  {
    keywords: ['vitamin b12', 'vit b12', 'b-12', 'b12', 'cobalamin'],
    image: '/optimized/Vitamin B12 Test.webp',
  },
  {
    keywords: ['vitamin d', 'vit d', 'd3', '25-hydroxy', 'cholecalciferol'],
    image: '/optimized/Vitamin D Test.webp',
  },
  {
    keywords: ['vitamin', 'vitamin deficiency', 'deficiency', 'multivitamin'],
    image: '/optimized/Vitamin Deficiency.webp',
  },
  // Infectious & Serology
  {
    keywords: ['dengue', 'ns1'],
    image: '/optimized/Dengue Test.webp',
  },
  {
    keywords: ['typhoid', 'widal'],
    image: '/optimized/Typhoid Test.webp',
  },
  {
    keywords: ['malaria'],
    image: '/optimized/Malaria Test.webp',
  },
  {
    keywords: ['hiv', 'aids'],
    image: '/optimized/HIV Test.webp',
  },
  {
    keywords: ['hepatitis', 'hbsag', 'hcv'],
    image: '/optimized/Hepatitis B-C Test.webp',
  },
  {
    keywords: ['covid', 'sars', 'rt-pcr'],
    image: '/optimized/COVID-19.webp',
  },
  {
    keywords: ['tb', 'tuberculosis', 'sputum', 'afb'],
    image: '/optimized/Tuberculosis.webp',
  },
  // Urinalysis & Stool
  {
    keywords: ['urine', 'cue', 'urinalysis', 'urinary routine', 'urine culture'],
    image: '/optimized/Urine Test.webp',
  },
  {
    keywords: ['stool', 'occult blood'],
    image: '/optimized/Stool Test.webp',
  },
  // Cardiac
  {
    keywords: ['ecg', 'electrocardiogram'],
    image: '/optimized/ECG.webp',
  },
  {
    keywords: ['echo', 'echocardiography', '2d echo'],
    image: '/optimized/Echocardiogram.webp',
  },
  {
    keywords: ['troponin', 'cpk', 'bnp', 'heart', 'cardiac'],
    image: '/optimized/Heart Disease.webp',
  },
  // Imaging & Scans
  {
    keywords: ['x-ray', 'xray', 'chest x', 'radiograph'],
    image: '/optimized/X-Ray.webp',
  },
  {
    keywords: ['ultrasound', 'usg', 'sonography', 'pelvis'],
    image: '/optimized/Ultrasound Scan.webp',
  },
  {
    keywords: ['ct scan', 'computed tomography', 'cat scan'],
    image: '/optimized/CT Scan.webp',
  },
  {
    keywords: ['mri', 'magnetic resonance'],
    image: '/optimized/MRI Scan.webp',
  },
  {
    keywords: ['pet scan'],
    image: '/optimized/PET Scan.webp',
  },
  {
    keywords: ['endoscopy'],
    image: '/optimized/Endoscopy.webp',
  },
  {
    keywords: ['colonoscopy'],
    image: '/optimized/Colonoscopy.webp',
  },
  {
    keywords: ['mammogram', 'mammography'],
    image: '/optimized/Mammogram.webp',
  },
  // Reproductive & Hormones
  {
    keywords: ['pregnancy', 'beta hcg', 'beta-hcg', 'hcg'],
    image: '/optimized/Pregnancy Test.webp',
  },
  {
    keywords: ['pcos'],
    image: '/optimized/PCOS.webp',
  },
  // Specialty
  {
    keywords: ['allergy', 'ige'],
    image: '/optimized/Allergy.webp',
  },
  {
    keywords: ['cancer', 'psa', 'ca 125', 'biopsy'],
    image: '/optimized/Cancer.webp',
  },
  {
    keywords: ['arthritis', 'rheumatoid', 'rf', 'ra factor'],
    image: '/optimized/Arthritis.webp',
  },
  {
    keywords: ['bone', 'fracture', 'osteoporosis'],
    image: '/optimized/Bone Fracture.webp',
  },
  // Packages
  {
    keywords: ['full body', 'master health', 'executive', 'wellness', 'package', 'checkup', 'comprehensive'],
    image: '/optimized/Blood Test.webp',
  },
];

const categoryDefaultMap: Record<string, string> = {
  blood: '/optimized/Blood Test.webp',
  'blood tests': '/optimized/Blood Test.webp',
  diabetes: '/optimized/Diabetes.webp',
  heart: '/optimized/Heart Disease.webp',
  cardiac: '/optimized/Heart Disease.webp',
  thyroid: '/optimized/Thyroid Disorder.webp',
  liver: '/optimized/Fatty Liver Disease.webp',
  kidney: '/optimized/Kidney Disease.webp',
  fever: '/optimized/Fever.webp',
  vitamins: '/optimized/Vitamin Deficiency.webp',
  radiology: '/optimized/X-Ray.webp',
  imaging: '/optimized/Ultrasound Scan.webp',
  pathology: '/optimized/Blood Test.webp',
};

const healthConcernMap: Record<string, string> = {
  diabetes: '/optimized/Diabetes.webp',
  heart: '/optimized/Heart Disease.webp',
  thyroid: '/optimized/Thyroid Disorder.webp',
  liver: '/optimized/Fatty Liver Disease.webp',
  kidney: '/optimized/Kidney Disease.webp',
  fever: '/optimized/Fever.webp',
  vitamins: '/optimized/Vitamin Deficiency.webp',
  allergy: '/optimized/Allergy.webp',
  arthritis: '/optimized/Arthritis.webp',
  cancer: '/optimized/Cancer.webp',
  asthma: '/optimized/Asthma.webp',
  anemia: '/optimized/Anemia.webp',
  hypertension: '/optimized/Hypertension.webp',
};

/**
 * Returns a high-res illustration URL from /optimized/ for any test or package name.
 */
export function getTestIcon(testName?: string, category?: string): string {
  if (!testName && !category) {
    return '/optimized/Blood Test.webp';
  }

  const query = (testName || '').toLowerCase().trim();
  const catQuery = (category || '').toLowerCase().trim();

  // 1. Check keyword mappings for test name
  for (const entry of keywordImageMap) {
    for (const kw of entry.keywords) {
      if (query.includes(kw)) {
        return entry.image;
      }
    }
  }

  // 2. Check keyword mappings for category if present
  if (catQuery) {
    for (const entry of keywordImageMap) {
      for (const kw of entry.keywords) {
        if (catQuery.includes(kw)) {
          return entry.image;
        }
      }
    }
    if (categoryDefaultMap[catQuery]) {
      return categoryDefaultMap[catQuery];
    }
  }

  // 3. Fallback
  return '/optimized/Blood Test.webp';
}

/**
 * Returns illustration for health concern cards.
 */
export function getHealthConcernIcon(concernIdOrName: string): string {
  const key = (concernIdOrName || '').toLowerCase().trim();
  return healthConcernMap[key] || getTestIcon(key);
}

export interface ParsedDatePill {
  tag: string;         // e.g. "TOMORROW", "TODAY", "SAT", "SUN", "FRI"
  dayNumber: string;   // e.g. "16", "17", "18"
  monthName: string;   // e.g. "OCT"
  isToday: boolean;
  isTomorrow: boolean;
  fullDateString: string;
}

/**
 * Parses available date object into clean, formatted date pill elements
 * preventing any text overflow or clipping.
 */
export function parseDatePill(d: { date: string; label: string }): ParsedDatePill {
  const isToday = (d.label || '').toLowerCase().includes('today');
  const isTomorrow = (d.label || '').toLowerCase().includes('tomorrow');

  let dayNum = '';
  let monthStr = 'OCT';
  let dayOfWeek = 'DAY';

  if (d.date && d.date.includes('-')) {
    const parts = d.date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dt = new Date(year, monthIndex, day);
      if (!isNaN(dt.getTime())) {
        dayNum = parts[2].padStart(2, '0');
        monthStr = dt.toLocaleDateString('en-US', { month: 'short' });
        dayOfWeek = dt.toLocaleDateString('en-US', { weekday: 'short' });
      }
    }
  }

  // Fallback parsing from label if date was missing or incomplete
  if (!dayNum && d.label) {
    const labelParts = d.label.split(', ');
    if (labelParts.length > 1) {
      const right = labelParts[1].trim().split(' ');
      if (right.length >= 2) {
        monthStr = right[0];
        dayNum = right[1];
      }
    } else {
      const match = d.label.match(/(\w{3})\s+(\d+)/i);
      if (match) {
        monthStr = match[1];
        dayNum = match[2];
      }
    }
  }

  let tag = dayOfWeek.toUpperCase();
  if (isToday) {
    tag = 'TODAY';
  } else if (isTomorrow) {
    tag = 'TOMORROW';
  }

  return {
    tag,
    dayNumber: dayNum || '--',
    monthName: monthStr.toUpperCase(),
    isToday,
    isTomorrow,
    fullDateString: d.date,
  };
}
