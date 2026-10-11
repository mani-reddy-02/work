import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
import { prisma } from './src/config/prisma';

async function testFlow() {
  console.log('--- Setting up test pending requests ---');
  // Create or set a pending hospital
  const testHospital = await prisma.hospital.upsert({
    where: { id: 'test-pending-hospital-id' },
    update: {
      verificationStatus: 'PENDING',
      hospitalShare: 75
    },
    create: {
      id: 'test-pending-hospital-id',
      name: 'Sunrise Specialty Hospital',
      businessType: 'HOSPITAL',
      facilityType: 'SPECIALTY',
      verificationStatus: 'PENDING',
      contactPhone: '9876543210',
      contactEmail: 'contact@sunrisehospital.com',
      city: 'Hyderabad',
      state: 'Telangana',
      addressLine1: 'Banjara Hills Rd 12',
      hospitalShare: 75
    }
  });
  console.log('Test Hospital created/set:', testHospital.name, 'verificationStatus:', testHospital.verificationStatus, 'hospitalShare:', testHospital.hospitalShare);

  // Create or set a pending laboratory
  const testLab = await prisma.hospital.upsert({
    where: { id: 'test-pending-lab-id' },
    update: {
      verificationStatus: 'PENDING',
      hospitalShare: 85
    },
    create: {
      id: 'test-pending-lab-id',
      name: 'Apex Diagnostic Care',
      businessType: 'LABORATORY',
      facilityType: 'GENERAL',
      verificationStatus: 'PENDING',
      contactPhone: '9123456780',
      contactEmail: 'info@apexdiagnostics.com',
      city: 'Secunderabad',
      state: 'Telangana',
      addressLine1: 'MG Road',
      hospitalShare: 85
    }
  });
  console.log('Test Lab created/set:', testLab.name, 'verificationStatus:', testLab.verificationStatus, 'hospitalShare:', testLab.hospitalShare);

  await prisma.$disconnect();
}

testFlow().catch(console.error);
