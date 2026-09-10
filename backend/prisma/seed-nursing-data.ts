import { PrismaClient, Role, BusinessType } from '@prisma/client';

const prisma = new PrismaClient();

const nursingServices = [
  {
    name: 'General Nursing Care',
    code: 'GNC',
    category: 'General Care',
    duration: '12 / 24 Hours',
    basePrice: 1200,
    description: 'Patient monitoring, Medication assistance, Basic nursing care, and Vital signs tracking.',
    requirements: 'Doctor prescription and medical history if applicable.',
    iconUrl: '/optimized/Nursing.webp',
    active: true,
  },
  {
    name: 'Elderly Care',
    code: 'EC',
    category: 'Elderly Care',
    duration: '12 / 24 Hours',
    basePrice: 1500,
    description: 'Daily assistance, Mobility support, Personal hygiene, Feeding support, and Companionship.',
    requirements: 'Patient mobility assessment and emergency contact required.',
    iconUrl: '/optimized/Elderly.webp',
    active: true,
  },
  {
    name: 'Post-Hospitalization Care',
    code: 'PHC',
    category: 'Post-Op Recovery',
    duration: '12 / 24 Hours',
    basePrice: 1800,
    description: 'Post-surgery recovery monitoring, Medication assistance, Wound-care support, and Suture care.',
    requirements: 'Hospital discharge summary and surgeon instructions required.',
    iconUrl: '/optimized/PostOp.webp',
    active: true,
  },
  {
    name: 'Injection / Dressing Support',
    code: 'IDS',
    category: 'Clinical Procedures',
    duration: 'Per Visit',
    basePrice: 450,
    description: 'IM/IV injection administration, Aseptic wound dressing, IV line maintenance, and Suture removal.',
    requirements: 'Valid doctor prescription required for all injections.',
    iconUrl: '/optimized/Injection.webp',
    active: true,
  },
  {
    name: 'Critical / ICU Care at Home',
    code: 'ICU_CARE',
    category: 'Specialized Care',
    duration: '24 Hours',
    basePrice: 3500,
    description: 'Ventilator/tracheostomy care, Continuous monitoring, Specialized equipment management by ICU-trained nurses.',
    requirements: 'Detailed clinical summary and intensive care setup recommendation.',
    iconUrl: '/optimized/ICU.webp',
    active: true,
  },
  {
    name: 'Mother & Baby Care',
    code: 'MBC',
    category: 'Specialized Care',
    duration: '12 Hours',
    basePrice: 1600,
    description: 'Postpartum maternal recovery, Newborn care, Umbilical cord hygiene, and Lactation assistance.',
    requirements: 'Maternal discharge report and pediatrician notes.',
    iconUrl: '/optimized/MotherBaby.webp',
    active: true,
  },
  {
    name: 'Catheter / Tube Care',
    code: 'CTC',
    category: 'Clinical Procedures',
    duration: 'Per Visit',
    basePrice: 600,
    description: 'Foley urinary catheterization, Ryle\'s tube insertion and feeding assistance, and Stoma care.',
    requirements: 'Prescription detailing catheter/tube specifications.',
    iconUrl: '/optimized/Tube.webp',
    active: true,
  },
];

async function main() {
  console.log('--- SEEDING HOME NURSING DATA ---');

  // 1. Seed or update nursing services
  const createdServices: Record<string, string> = {};
  for (const s of nursingServices) {
    const service = await prisma.nursingService.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        category: s.category,
        duration: s.duration,
        basePrice: s.basePrice,
        description: s.description,
        requirements: s.requirements,
        iconUrl: s.iconUrl,
        active: s.active,
      },
      create: s,
    });
    createdServices[s.code] = service.id;
    console.log(`✔ Seeded service: ${service.name} (${service.code}) - ID: ${service.id}`);
  }

  // 2. Find hospitals that offer home_nursing
  const hospitals = await prisma.hospital.findMany({
    where: {
      OR: [
        { services: { has: 'home_nursing' } },
        { name: { in: ['SM Hospital', 'MS Hospital', 'Admin A'] } },
      ],
    },
  });

  console.log(`Found ${hospitals.length} hospitals for Home Nursing offerings.`);

  // 3. Create offerings for each hospital
  for (const hospital of hospitals) {
    // Ensure 'home_nursing' is in hospital services without changing any relations
    if (!hospital.services.includes('home_nursing')) {
      await prisma.hospital.update({
        where: { id: hospital.id },
        data: { services: { push: 'home_nursing' } },
      });
      console.log(`Updated services array for hospital: ${hospital.name}`);
    }

    // Seed offerings for all services
    for (const [code, serviceId] of Object.entries(createdServices)) {
      const base = nursingServices.find((s) => s.code === code)!;
      // Provide minor hospital-specific price variance
      const priceModifier = hospital.name.includes('MS') ? 1.05 : hospital.name.includes('SM') ? 1.0 : 0.95;
      const customPrice = Math.round(base.basePrice * priceModifier);

      await prisma.nursingServiceOffering.upsert({
        where: {
          hospitalId_serviceId: {
            hospitalId: hospital.id,
            serviceId,
          },
        },
        update: {
          price: customPrice,
          duration: base.duration,
          available: true,
          serviceArea: hospital.city ? `Within 20 km of ${hospital.city}` : 'Metropolitan Area',
        },
        create: {
          hospitalId: hospital.id,
          serviceId,
          price: customPrice,
          duration: base.duration,
          available: true,
          serviceArea: hospital.city ? `Within 20 km of ${hospital.city}` : 'Metropolitan Area',
        },
      });
    }
    console.log(`✔ Linked all offerings for: ${hospital.name}`);

    // Ensure hospital has at least one active nurse user
    const existingNurses = await prisma.user.findMany({
      where: { hospitalId: hospital.id, role: Role.NURSE },
    });

    if (existingNurses.length === 0) {
      const nurseUser = await prisma.user.create({
        data: {
          name: `Staff Nurse (${hospital.name})`,
          email: `nurse.${hospital.id.substring(0, 8)}@mediquee.com`,
          phone: `+91-98${Math.floor(10000000 + Math.random() * 90000000)}`,
          passwordHash: '$2a$10$YourHashedPasswordHere1234567890123456789012',
          role: Role.NURSE,
          designation: 'Certified Home Healthcare Nurse',
          hospitalId: hospital.id,
          active: true,
        },
      });
      console.log(`✔ Created nurse profile for hospital ${hospital.name}: ${nurseUser.name}`);
    } else {
      console.log(`✔ Hospital ${hospital.name} already has ${existingNurses.length} nurse(s).`);
    }
  }

  console.log('--- COMPLETED SEEDING HOME NURSING DATA ---');
}

main()
  .catch((e) => {
    console.error('Error seeding home nursing data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
