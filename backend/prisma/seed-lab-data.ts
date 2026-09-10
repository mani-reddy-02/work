import { PrismaClient, BusinessType } from '@prisma/client';

const prisma = new PrismaClient();

const testCatalog = [
  {
    name: 'Complete Blood Count (CBC)',
    category: 'Blood Tests',
    sampleType: 'Blood',
    price: 399,
    turnaroundTime: '12 Hours',
    parametersCount: 24,
    healthConcern: 'fever',
    description: 'A complete blood count (CBC) is a blood test used to evaluate your overall health and detect a wide range of disorders, including anemia, infection and leukemia.',
    preparation: 'No special preparation required. Fasting is not needed.'
  },
  {
    name: 'Liver Function Test (LFT)',
    category: 'Liver',
    sampleType: 'Blood',
    price: 499,
    turnaroundTime: '12 Hours',
    parametersCount: 11,
    healthConcern: 'liver',
    description: 'Liver function tests are blood tests used to help diagnose and monitor liver disease or damage.',
    preparation: '10-12 hours of fasting is required.'
  },
  {
    name: 'Thyroid Profile (T3, T4, TSH)',
    category: 'Thyroid',
    sampleType: 'Blood',
    price: 399,
    turnaroundTime: '12 Hours',
    parametersCount: 3,
    healthConcern: 'thyroid',
    description: 'Thyroid tests measure how well your thyroid gland is working.',
    preparation: 'No special preparation required.'
  },
  {
    name: 'Lipid Profile',
    category: 'Heart',
    sampleType: 'Blood',
    price: 799,
    turnaroundTime: '12 Hours',
    parametersCount: 8,
    healthConcern: 'heart',
    description: 'Measures cholesterol and triglycerides in the blood.',
    preparation: '12 hours of fasting is required.'
  },
  {
    name: 'Blood Sugar Test (Fasting)',
    category: 'Diabetes',
    sampleType: 'Blood',
    price: 149,
    turnaroundTime: '6 Hours',
    parametersCount: 1,
    healthConcern: 'diabetes',
    description: 'Measures blood glucose after an overnight fast.',
    preparation: '10-12 hours of fasting is required.'
  },
  {
    name: 'Kidney Function Test (KFT)',
    category: 'Kidney',
    sampleType: 'Blood',
    price: 599,
    turnaroundTime: '12 Hours',
    parametersCount: 9,
    healthConcern: 'kidney',
    description: 'Assesses how well your kidneys are functioning.',
    preparation: 'No special preparation required.'
  },
  {
    name: 'Vitamin D Test',
    category: 'Vitamins',
    sampleType: 'Blood',
    price: 1199,
    turnaroundTime: '24 Hours',
    parametersCount: 1,
    healthConcern: 'vitamins',
    description: 'Measures the level of Vitamin D in your blood.',
    preparation: 'No special preparation required.'
  },
  {
    name: 'Vitamin B12 Test',
    category: 'Vitamins',
    sampleType: 'Blood',
    price: 899,
    turnaroundTime: '24 Hours',
    parametersCount: 1,
    healthConcern: 'vitamins',
    description: 'Measures the level of Vitamin B12 in your blood.',
    preparation: 'No special preparation required.'
  },
  {
    name: 'HbA1c Blood Test',
    category: 'Diabetes',
    sampleType: 'Blood',
    price: 399,
    turnaroundTime: '12 Hours',
    parametersCount: 2,
    healthConcern: 'diabetes',
    description: 'Measures average blood sugar levels over the past 3 months.',
    preparation: 'No special preparation required.'
  },
  {
    name: 'Urine Routine & Microscopy',
    category: 'Urine Tests',
    sampleType: 'Urine',
    price: 199,
    turnaroundTime: '6 Hours',
    parametersCount: 18,
    healthConcern: 'kidney',
    description: 'Examines physical, chemical, and microscopic properties of urine.',
    preparation: 'First morning sample preferred.'
  },
  {
    name: 'Cardiac Risk Profile',
    category: 'Heart',
    sampleType: 'Blood',
    price: 1999,
    turnaroundTime: '24 Hours',
    parametersCount: 14,
    healthConcern: 'heart',
    description: 'Comprehensive test panel assessing heart health risk factors.',
    preparation: '12 hours of fasting is required.'
  },
  {
    name: 'Iron Profile Test',
    category: 'Blood Tests',
    sampleType: 'Blood',
    price: 799,
    turnaroundTime: '12 Hours',
    parametersCount: 5,
    healthConcern: 'fever',
    description: 'Measures various iron levels to detect anemia and deficiency.',
    preparation: 'No special preparation required.'
  },
  {
    name: 'X-Ray Chest PA View',
    category: 'Imaging',
    sampleType: 'Imaging',
    price: 350,
    turnaroundTime: '1 Hour',
    parametersCount: 1,
    healthConcern: 'infection',
    description: 'Standard radiographic chest examination to detect chest or respiratory conditions.',
    preparation: 'Remove all metal objects and jewelry.'
  }
];

const laboratoriesData = [
  {
    name: 'Apollo Diagnostics',
    businessType: BusinessType.LABORATORY,
    facilityType: 'Diagnostic Centre',
    contactPhone: '+91 98765 43210',
    contactEmail: 'contact@apollodiagnostics.in',
    website: 'https://apollodiagnostics.in',
    addressLine1: 'Road No 36, Jubilee Hills',
    area: 'Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500033',
    services: ['lab_tests', 'home_sample', 'diagnostics', 'pathology']
  },
  {
    name: 'Vijaya Diagnostic Centre',
    businessType: BusinessType.LABORATORY,
    facilityType: 'Diagnostic Centre',
    contactPhone: '+91 98765 43211',
    contactEmail: 'support@vijayadiagnostic.com',
    website: 'https://vijayadiagnostic.com',
    addressLine1: 'Road No 1, Banjara Hills',
    area: 'Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500034',
    services: ['lab_tests', 'home_sample', 'diagnostics', 'imaging']
  },
  {
    name: 'Tenet Diagnostics',
    businessType: BusinessType.LABORATORY,
    facilityType: 'Diagnostic Centre',
    contactPhone: '+91 98765 43212',
    contactEmail: 'info@tenetmed.com',
    website: 'https://tenetdiagnostics.com',
    addressLine1: 'Mindspace Road, Madhapur',
    area: 'Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500081',
    services: ['lab_tests', 'home_sample', 'diagnostics']
  },
  {
    name: 'PathCare Labs',
    businessType: BusinessType.LABORATORY,
    facilityType: 'Clinical Pathology Lab',
    contactPhone: '+91 98765 43213',
    contactEmail: 'care@pathcare.com',
    website: 'https://pathcarelabs.com',
    addressLine1: 'Cyber Towers Lane, Hitec City',
    area: 'Hitec City',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500081',
    services: ['lab_tests', 'home_sample', 'diagnostics']
  }
];

async function main() {
  console.log('Seeding Real Laboratory & Lab Test Database...');

  // 1. Seed or find laboratories
  const labs: any[] = [];
  for (const labInfo of laboratoriesData) {
    let lab = await prisma.hospital.findFirst({
      where: { name: labInfo.name }
    });
    if (!lab) {
      lab = await prisma.hospital.create({
        data: labInfo
      });
      console.log(`Created Laboratory: ${lab.name} (${lab.id})`);
    } else {
      console.log(`Found Existing Laboratory: ${lab.name} (${lab.id})`);
    }
    labs.push(lab);
  }

  // Also include existing hospitals that offer lab_tests
  const existingHospitals = await prisma.hospital.findMany({
    where: {
      businessType: BusinessType.HOSPITAL,
      services: { hasSome: ['lab_tests', 'lab', 'laboratory', 'diagnostics'] }
    }
  });
  for (const h of existingHospitals) {
    labs.push(h);
    console.log(`Included In-House Hospital Lab: ${h.name} (${h.id})`);
  }

  // 2. Seed Lab Tests
  const createdTests: any[] = [];
  for (const testData of testCatalog) {
    let test = await prisma.labTest.findFirst({
      where: { name: testData.name }
    });
    if (!test) {
      test = await prisma.labTest.create({
        data: testData
      });
      console.log(`Created Lab Test: ${test.name} (${test.id})`);
    } else {
      test = await prisma.labTest.update({
        where: { id: test.id },
        data: testData
      });
      console.log(`Updated Lab Test: ${test.name} (${test.id})`);
    }
    createdTests.push(test);
  }

  // 3. Seed Offerings linking tests to laboratories
  console.log('Creating Laboratory Test Offerings with real prices...');
  for (const test of createdTests) {
    // Determine which labs offer this test (at least 2-4 labs per test to allow real comparison)
    // Most tests offered at Apollo, Vijaya, and at least one hospital lab
    for (let i = 0; i < labs.length; i++) {
      const lab = labs[i];
      // Vary prices slightly per lab for realism while keeping base test price accurate
      const priceOffset = (i === 0) ? 0 : (i === 1) ? 50 : (i === 2) ? -30 : 20;
      const labPrice = Math.max(99, test.price + priceOffset);
      const homeFee = (i % 2 === 0) ? 0 : 50;

      await prisma.laboratoryTestOffering.upsert({
        where: {
          laboratoryId_testId: {
            laboratoryId: lab.id,
            testId: test.id
          }
        },
        create: {
          laboratoryId: lab.id,
          testId: test.id,
          price: labPrice,
          homeCollectionAvailable: true,
          homeCollectionFee: homeFee,
          active: true
        },
        update: {
          price: labPrice,
          homeCollectionAvailable: true,
          homeCollectionFee: homeFee,
          active: true
        }
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
