/**
 * 3D Department Images Mapping for MediQuee User Platform.
 * Uses custom-generated 3D UI cards from /departments-images/.
 */

const DEPARTMENT_IMAGE_MAP: Record<string, string> = {
  // Core Clinical Departments
  'cardiology': '/departments-images/cardiology.png',
  'cardiothoracic surgery': '/departments-images/cardiothoracic-surgery.png',
  'gynecology': '/departments-images/gynecology.png',
  'obstetrics': '/departments-images/obstetrics.png',
  'obstetrics & gynecology': '/departments-images/gynecology.png',
  'ob-gyn': '/departments-images/gynecology.png',
  'womens health': '/departments-images/gynecology.png',
  'neurology': '/departments-images/neurology.png',
  'neurosurgery': '/departments-images/neurosurgery.png',
  'pulmonology': '/departments-images/pulmonology.png',
  'gastroenterology': '/departments-images/gastroenterology.png',
  'gastrointestinal surgery': '/departments-images/gastrointestinal-surgery.png',
  'hepatology': '/departments-images/hepatology.png',
  'nephrology': '/departments-images/nephrology.png',
  'urology': '/departments-images/urology.png',
  'endocrinology': '/departments-images/endocrinology.png',
  'ophthalmology': '/departments-images/ophthalmology.png',
  'orthopedics': '/departments-images/orthopedics.png',
  'orthopedic surgery': '/departments-images/orthopedics.png',
  'ent': '/departments-images/ent.png',
  'ent (otorhinolaryngology)': '/departments-images/ent.png',
  'otorhinolaryngology': '/departments-images/ent.png',
  'dentistry': '/departments-images/dentistry.png',
  'dental': '/departments-images/dentistry.png',
  'orthodontics': '/departments-images/orthodontics.png',
  'maxillofacial surgery': '/departments-images/maxillofacial-surgery.png',
  'dermatology': '/departments-images/dermatology.png',
  'pediatrics': '/departments-images/pediatrics.png',
  'neonatology': '/departments-images/neonatology.png',
  'pediatric surgery': '/departments-images/pediatric-surgery.png',
  'psychiatry': '/departments-images/psychiatry.png',
  'psychology': '/departments-images/psychology.png',
  'general medicine': '/departments-images/general-medicine.png',
  'general physician': '/departments-images/general-medicine.png',
  'internal medicine': '/departments-images/general-medicine.png',
  'family medicine': '/departments-images/family-medicine.png',
  'geriatrics': '/departments-images/geriatrics.png',
  'rheumatology': '/departments-images/rheumatology.png',
  'hematology': '/departments-images/hematology.png',
  'oncology (medical)': '/departments-images/oncology-medical.png',
  'oncology': '/departments-images/oncology-medical.png',
  'surgical oncology': '/departments-images/surgical-oncology.png',
  'immunology & allergy': '/departments-images/immunology-allergy.png',
  'allergy & immunology': '/departments-images/immunology-allergy.png',
  'infectious diseases': '/departments-images/infectious-diseases.png',
  'general surgery': '/departments-images/general-surgery.png',
  'vascular surgery': '/departments-images/vascular-surgery.png',
  'plastic & reconstructive surgery': '/departments-images/plastic-reconstructive-surgery.png',
  'plastic surgery': '/departments-images/plastic-reconstructive-surgery.png',
  'sports medicine': '/departments-images/sports-medicine.png',
  'physiotherapy & rehabilitation': '/departments-images/physiotherapy-rehabilitation.png',
  'physiotherapy': '/departments-images/physiotherapy-rehabilitation.png',
  'dietetics & nutrition': '/departments-images/dietetics-nutrition.png',
  'nutrition': '/departments-images/dietetics-nutrition.png',
  'dietetics': '/departments-images/dietetics-nutrition.png',
  'pain management': '/departments-images/pain-management.png',
  'sleep medicine': '/departments-images/sleep-medicine.png',
  'andrology': '/departments-images/andrology.png',
  'mens health': '/departments-images/andrology.png',
  'audiology': '/departments-images/audiology.png',
  'podiatry': '/departments-images/podiatry.png',
  'genetics': '/departments-images/genetics.png',
  'radiology & diagnostic imaging (lab)': '/departments-images/general-surgery.png',
  'radiology': '/departments-images/general-surgery.png',
  'pathology': '/departments-images/hematology.png',
  'microbiology': '/departments-images/infectious-diseases.png',
  'biochemistry': '/departments-images/endocrinology.png',
  'serology & infectious diseases (lab)': '/departments-images/infectious-diseases.png',
  'laboratory': '/departments-images/general-medicine.png',
  'diagnostics': '/departments-images/general-medicine.png'
};

const KEYWORD_RULES: Array<{ regex: RegExp; image: string }> = [
  { regex: /cardio|heart/i, image: '/departments-images/cardiology.png' },
  { regex: /gynec|obstet|women|matern/i, image: '/departments-images/gynecology.png' },
  { regex: /neuro|brain|nerv/i, image: '/departments-images/neurology.png' },
  { regex: /pulmon|lung|respirat|breath|asthma|copd/i, image: '/departments-images/pulmonology.png' },
  { regex: /gastro|stomach|digest|liver|hepat/i, image: '/departments-images/gastroenterology.png' },
  { regex: /nephro|kidney|renal/i, image: '/departments-images/nephrology.png' },
  { regex: /endo|thyroid|hormon|diabet/i, image: '/departments-images/endocrinology.png' },
  { regex: /ophthalm|eye|vision|retin/i, image: '/departments-images/ophthalmology.png' },
  { regex: /ortho|bone|joint|fracture|spine/i, image: '/departments-images/orthopedics.png' },
  { regex: /ent|ear|nose|throat|sinus|otolaryng/i, image: '/departments-images/ent.png' },
  { regex: /dent|tooth|teeth|oral/i, image: '/departments-images/dentistry.png' },
  { regex: /derma|skin/i, image: '/departments-images/dermatology.png' },
  { regex: /pediatr|child|infant|baby/i, image: '/departments-images/pediatrics.png' },
  { regex: /psychiat|psychol|mental|mind/i, image: '/departments-images/psychiatry.png' },
  { regex: /family/i, image: '/departments-images/family-medicine.png' },
  { regex: /general|internal|physician|medicine/i, image: '/departments-images/general-medicine.png' },
  { regex: /andro|men|urolog|erect|fertilit/i, image: '/departments-images/andrology.png' },
  { regex: /rheum|arthrit/i, image: '/departments-images/rheumatology.png' },
  { regex: /hemat|blood/i, image: '/departments-images/hematology.png' },
  { regex: /oncol|cancer|tumor/i, image: '/departments-images/oncology-medical.png' },
  { regex: /surger|operat/i, image: '/departments-images/general-surgery.png' }
];

export const getDepartmentImageUrl = (
  departmentName?: string | null,
  customImage?: string | null
): string => {
  if (customImage) {
    if (customImage.startsWith('/images/departments/')) {
      const filename = customImage.replace('/images/departments/', '');
      const baseName = filename.replace(/\.(jpg|png|webp)$/i, '');
      return `/departments-images/${baseName}.png`;
    }
    if (customImage.startsWith('http') || customImage.startsWith('/departments-images/')) {
      return customImage;
    }
  }

  if (departmentName) {
    const trimmed = departmentName.trim().toLowerCase();

    // 1. Exact match
    if (DEPARTMENT_IMAGE_MAP[trimmed]) {
      return DEPARTMENT_IMAGE_MAP[trimmed];
    }

    // 2. Keyword matching
    for (const rule of KEYWORD_RULES) {
      if (rule.regex.test(trimmed)) {
        return rule.image;
      }
    }
  }

  return '/departments-images/general-medicine.png';
};
