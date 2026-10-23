/**
 * Realistic clinical photography mapping for hospital departments.
 * Replaces cartoon/clipart icons with realistic medical imagery.
 */

const DEPARTMENT_IMAGE_MAP: Record<string, string> = {
  'andrology': '/images/departments/andrology.jpg',
  'mens health': '/images/departments/andrology.jpg',
  'cardiology': '/images/departments/cardiology.jpg',
  'cardiothoracic surgery': '/images/departments/cardiology.jpg',
  'general medicine': '/images/departments/general-medicine.jpg',
  'internal medicine': '/images/departments/general-medicine.jpg',
  'family medicine': '/images/departments/general-medicine.jpg',
  'gynecology': '/images/departments/gynecology.jpg',
  'obstetrics & gynecology': '/images/departments/gynecology.jpg',
  'ob-gyn': '/images/departments/gynecology.jpg',
  'womens health': '/images/departments/gynecology.jpg',
  'dermatology': '/images/departments/dermatology.jpg',
  'orthopedics': '/images/departments/orthopedics.jpg',
  'orthopedic surgery': '/images/departments/orthopedics.jpg',
  'dentistry': '/images/departments/dentistry.jpg',
  'dental': '/images/departments/dentistry.jpg',
  'pediatrics': '/images/departments/pediatrics.jpg',
  'neurology': '/images/departments/neurology.jpg',
  'neurosurgery': '/images/departments/neurology.jpg',
  'ophthalmology': '/images/departments/ophthalmology.jpg',
  'ent': '/images/departments/ent.jpg',
  'ent (otorhinolaryngology)': '/images/departments/ent.jpg',
  'otorhinolaryngology': '/images/departments/ent.jpg',
  'radiology & diagnostic imaging (lab)': '/images/departments/diagnostics.jpg',
  'radiology': '/images/departments/diagnostics.jpg',
  'pathology': '/images/departments/diagnostics.jpg',
  'microbiology': '/images/departments/diagnostics.jpg',
  'genetics': '/images/departments/diagnostics.jpg',
  'biochemistry': '/images/departments/diagnostics.jpg',
  'serology & infectious diseases (lab)': '/images/departments/diagnostics.jpg',
  'laboratory': '/images/departments/diagnostics.jpg',
  'diagnostics': '/images/departments/diagnostics.jpg',
};

const KEYWORD_RULES: Array<{ regex: RegExp; image: string }> = [
  { regex: /cardio|heart/i, image: '/images/departments/cardiology.jpg' },
  { regex: /general|internal|family|medicine|physician/i, image: '/images/departments/general-medicine.jpg' },
  { regex: /gynec|obstet|women|matern/i, image: '/images/departments/gynecology.jpg' },
  { regex: /andro|men|urolog|erect|fertilit/i, image: '/images/departments/andrology.jpg' },
  { regex: /derma|skin/i, image: '/images/departments/dermatology.jpg' },
  { regex: /ortho|bone|joint|fracture|spine/i, image: '/images/departments/orthopedics.jpg' },
  { regex: /dent|tooth|teeth|oral/i, image: '/images/departments/dentistry.jpg' },
  { regex: /pediatr|child|infant|baby/i, image: '/images/departments/pediatrics.jpg' },
  { regex: /neuro|brain|nerv/i, image: '/images/departments/neurology.jpg' },
  { regex: /ophthalm|eye|vision|retin/i, image: '/images/departments/ophthalmology.jpg' },
  { regex: /ent|ear|nose|throat|sinus|otolaryng/i, image: '/images/departments/ent.jpg' },
  { regex: /lab|pathol|microbio|radio|imag|blood|diagnos|biochem|serol/i, image: '/images/departments/diagnostics.jpg' },
];

export const getDepartmentImageUrl = (
  departmentName?: string | null,
  customImage?: string | null
): string => {
  if (customImage) {
    if (customImage.startsWith('http') || customImage.startsWith('/images/')) {
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

  return '/images/departments/default.jpg';
};
