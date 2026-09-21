import { PrismaClient, SpecimenType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Platform Lab Departments & Tests...');

  // 1. Hematology & Clinical Pathology
  const hem = await prisma.platformLabDepartment.upsert({
    where: { code: 'HEM' },
    update: {},
    create: {
      code: 'HEM',
      name: 'Hematology & Clinical Pathology',
      description: 'Blood counts, coagulation, and blood grouping',
      icon: 'FlaskConical',
    }
  });

  const hemTests = [
    { code: 'CBC', name: 'Complete Blood Count (CBC) with ESR', specimenType: SpecimenType.WHOLE_BLOOD, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 6, canBeCollectedAtHome: true },
    { code: 'PERI_SMEAR', name: 'Peripheral Blood Smear Examination', specimenType: SpecimenType.WHOLE_BLOOD, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 12, canBeCollectedAtHome: true },
    { code: 'ESR', name: 'Erythrocyte Sedimentation Rate (ESR)', specimenType: SpecimenType.WHOLE_BLOOD, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 4, canBeCollectedAtHome: true },
    { code: 'PT_INR', name: 'Prothrombin Time (PT/INR)', specimenType: SpecimenType.PLASMA, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 8, canBeCollectedAtHome: true },
    { code: 'APTT', name: 'Activated Partial Thromboplastin Time (APTT)', specimenType: SpecimenType.PLASMA, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 8, canBeCollectedAtHome: true },
    { code: 'BLOOD_GROUP', name: 'Blood Grouping & Rh Typing', specimenType: SpecimenType.WHOLE_BLOOD, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 2, canBeCollectedAtHome: true },
    { code: 'AEC', name: 'Absolute Eosinophil Count (AEC)', specimenType: SpecimenType.WHOLE_BLOOD, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 6, canBeCollectedAtHome: true },
  ];

  for (const t of hemTests) {
    await prisma.platformLabTest.upsert({
      where: { code: t.code },
      update: { ...t, departmentId: hem.id },
      create: { ...t, departmentId: hem.id },
    });
  }

  // 2. Clinical Biochemistry & Metabolic
  const bio = await prisma.platformLabDepartment.upsert({
    where: { code: 'BIO' },
    update: {},
    create: {
      code: 'BIO',
      name: 'Clinical Biochemistry & Metabolic',
      description: 'Organ functions, sugars, and electrolytes',
      icon: 'Activity',
    }
  });

  const bioTests = [
    { code: 'LFT', name: 'Liver Function Test (LFT)', specimenType: SpecimenType.SERUM, fastingRequired: true, fastingDurationHours: 10, defaultTatHours: 12, canBeCollectedAtHome: true },
    { code: 'KFT', name: 'Kidney / Renal Function Test (KFT / RFT)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 12, canBeCollectedAtHome: true },
    { code: 'LIPID', name: 'Lipid Profile Comprehensive', specimenType: SpecimenType.SERUM, fastingRequired: true, fastingDurationHours: 12, defaultTatHours: 12, canBeCollectedAtHome: true },
    { code: 'FBS', name: 'Fasting Blood Sugar (FBS)', specimenType: SpecimenType.PLASMA, fastingRequired: true, fastingDurationHours: 8, defaultTatHours: 4, canBeCollectedAtHome: true },
    { code: 'PPBS', name: 'Postprandial Blood Sugar (PPBS)', specimenType: SpecimenType.PLASMA, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 4, canBeCollectedAtHome: true },
    { code: 'HBA1C', name: 'Glycated Hemoglobin (HbA1c)', specimenType: SpecimenType.WHOLE_BLOOD, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 6, canBeCollectedAtHome: true },
    { code: 'ELECTRO', name: 'Serum Electrolytes (Na+, K+, Cl-)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 6, canBeCollectedAtHome: true },
    { code: 'URIC_ACID', name: 'Serum Uric Acid', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 8, canBeCollectedAtHome: true },
    { code: 'CALCIUM', name: 'Serum Calcium & Phosphorus', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 8, canBeCollectedAtHome: true },
    { code: 'AMYLASE', name: 'Serum Amylase & Lipase', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 12, canBeCollectedAtHome: true },
  ];

  for (const t of bioTests) {
    await prisma.platformLabTest.upsert({
      where: { code: t.code },
      update: { ...t, departmentId: bio.id },
      create: { ...t, departmentId: bio.id },
    });
  }

  // 3. Endocrinology & Hormone Studies
  const end = await prisma.platformLabDepartment.upsert({
    where: { code: 'END' },
    update: {},
    create: {
      code: 'END',
      name: 'Endocrinology & Hormone Studies',
      description: 'Hormones, vitamins, and markers',
      icon: 'Droplets',
    }
  });

  const endTests = [
    { code: 'THYROID', name: 'Thyroid Profile Total (T3, T4, TSH)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 12, canBeCollectedAtHome: true },
    { code: 'FREE_THYROID', name: 'Free Thyroid Profile (FT3, FT4, TSH)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 12, canBeCollectedAtHome: true },
    { code: 'VIT_D3', name: 'Vitamin D3 (25-Hydroxy)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 24, canBeCollectedAtHome: true },
    { code: 'VIT_B12', name: 'Vitamin B12', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 24, canBeCollectedAtHome: true },
    { code: 'IRON', name: 'Serum Ferritin & Iron Studies', specimenType: SpecimenType.SERUM, fastingRequired: true, fastingDurationHours: 8, defaultTatHours: 24, canBeCollectedAtHome: true },
    { code: 'CORTISOL', name: 'Serum Cortisol (Morning/Evening)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 24, canBeCollectedAtHome: true },
    { code: 'TESTOSTERONE', name: 'Serum Testosterone Total', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 24, canBeCollectedAtHome: true },
    { code: 'BETA_HCG', name: 'Beta hCG (Pregnancy & Tumor Marker)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 6, canBeCollectedAtHome: true },
  ];

  for (const t of endTests) {
    await prisma.platformLabTest.upsert({
      where: { code: t.code },
      update: { ...t, departmentId: end.id },
      create: { ...t, departmentId: end.id },
    });
  }

  // 4. Serology, Immunology & Infectious Diseases
  const ser = await prisma.platformLabDepartment.upsert({
    where: { code: 'SER' },
    update: {},
    create: {
      code: 'SER',
      name: 'Serology & Infectious Diseases',
      description: 'Antigens and antibodies for infections',
      icon: 'Shield',
    }
  });

  const serTests = [
    { code: 'DENGUE', name: 'Dengue Duo (NS1 Antigen + IgM/IgG Antibodies)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 4, canBeCollectedAtHome: true },
    { code: 'WIDAL', name: 'Widal Slide / Tube Test (Typhoid)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 6, canBeCollectedAtHome: true },
    { code: 'MALARIA', name: 'Malaria Antigen Dual (Pv/Pf)', specimenType: SpecimenType.WHOLE_BLOOD, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 2, canBeCollectedAtHome: true },
    { code: 'CRP', name: 'C-Reactive Protein (Quantitative CRP)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 6, canBeCollectedAtHome: true },
    { code: 'HS_CRP', name: 'High-Sensitivity CRP (hs-CRP)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 12, canBeCollectedAtHome: true },
    { code: 'RF', name: 'Rheumatoid Factor (RF / RA)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 8, canBeCollectedAtHome: true },
    { code: 'HIV', name: 'HIV 1 & 2 Antibody & p24 Antigen', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 12, canBeCollectedAtHome: true },
    { code: 'HBSAG', name: 'Hepatitis B Surface Antigen (HBsAg)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 8, canBeCollectedAtHome: true },
    { code: 'HCV', name: 'Hepatitis C Antibody (Anti-HCV)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 12, canBeCollectedAtHome: true },
  ];

  for (const t of serTests) {
    await prisma.platformLabTest.upsert({
      where: { code: t.code },
      update: { ...t, departmentId: ser.id },
      create: { ...t, departmentId: ser.id },
    });
  }

  // 5. Clinical Microbiology & Urinalysis
  const mic = await prisma.platformLabDepartment.upsert({
    where: { code: 'MIC' },
    update: {},
    create: {
      code: 'MIC',
      name: 'Microbiology & Urinalysis',
      description: 'Microbes, cultures, and body fluids',
      icon: 'Microscope',
    }
  });

  const micTests = [
    { code: 'CUE', name: 'Complete Urine Examination (CUE / Routine)', specimenType: SpecimenType.URINE, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 3, canBeCollectedAtHome: true },
    { code: 'URINE_CULTURE', name: 'Urine Culture & Antibiotic Sensitivity', specimenType: SpecimenType.URINE, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 48, canBeCollectedAtHome: true },
    { code: 'BLOOD_CULTURE', name: 'Blood Culture & Sensitivity', specimenType: SpecimenType.WHOLE_BLOOD, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 72, canBeCollectedAtHome: true },
    { code: 'SPUTUM_AFB', name: 'Sputum for AFB (Acid-Fast Bacilli / TB)', specimenType: SpecimenType.SPUTUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 24, canBeCollectedAtHome: true },
    { code: 'STOOL', name: 'Stool Routine & Occult Blood', specimenType: SpecimenType.STOOL, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 6, canBeCollectedAtHome: true },
  ];

  for (const t of micTests) {
    await prisma.platformLabTest.upsert({
      where: { code: t.code },
      update: { ...t, departmentId: mic.id },
      create: { ...t, departmentId: mic.id },
    });
  }

  // 6. Cardiac Biomarkers & Critical Care
  const car = await prisma.platformLabDepartment.upsert({
    where: { code: 'CAR' },
    update: {},
    create: {
      code: 'CAR',
      name: 'Cardiac Biomarkers & Critical Care',
      description: 'Heart and emergency blood markers',
      icon: 'HeartPulse',
    }
  });

  const carTests = [
    { code: 'TROP_I', name: 'Troponin-I High Sensitivity', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 2, canBeCollectedAtHome: true },
    { code: 'CPK_MB', name: 'CPK-MB (Cardiac Isoenzyme)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 4, canBeCollectedAtHome: true },
    { code: 'D_DIMER', name: 'D-Dimer Quantitative', specimenType: SpecimenType.PLASMA, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 4, canBeCollectedAtHome: true },
    { code: 'NT_PROBNP', name: 'NT-proBNP (Heart Failure Marker)', specimenType: SpecimenType.SERUM, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 8, canBeCollectedAtHome: true },
  ];

  for (const t of carTests) {
    await prisma.platformLabTest.upsert({
      where: { code: t.code },
      update: { ...t, departmentId: car.id },
      create: { ...t, departmentId: car.id },
    });
  }

  // 7. Radiology & Diagnostic Imaging
  const rad = await prisma.platformLabDepartment.upsert({
    where: { code: 'RAD' },
    update: {},
    create: {
      code: 'RAD',
      name: 'Radiology & Diagnostic Imaging',
      description: 'X-Rays, Ultrasound, and ECGs',
      icon: 'Scan',
    }
  });

  const radTests = [
    { code: 'CHEST_XRAY', name: 'Chest X-Ray PA View', specimenType: SpecimenType.IMAGE_SCAN, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 2, canBeCollectedAtHome: false },
    { code: 'USG_ABD', name: 'Ultrasound (USG) Abdomen & Pelvis', specimenType: SpecimenType.IMAGE_SCAN, fastingRequired: true, fastingDurationHours: 6, defaultTatHours: 2, canBeCollectedAtHome: false },
    { code: 'ECG', name: 'Electrocardiogram (ECG 12-Lead)', specimenType: SpecimenType.IMAGE_SCAN, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 1, canBeCollectedAtHome: false },
    { code: 'ECHO', name: '2D Echocardiography with Doppler', specimenType: SpecimenType.IMAGE_SCAN, fastingRequired: false, fastingDurationHours: null, defaultTatHours: 4, canBeCollectedAtHome: false },
  ];

  for (const t of radTests) {
    await prisma.platformLabTest.upsert({
      where: { code: t.code },
      update: { ...t, departmentId: rad.id },
      create: { ...t, departmentId: rad.id },
    });
  }

  console.log('Successfully seeded Platform Lab Departments & Tests.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
