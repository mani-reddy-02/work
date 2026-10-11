import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
import { prisma } from './src/config/prisma';

async function main() {
  const hospitals = await prisma.hospital.findMany({
    take: 5,
    select: { id: true, name: true, businessType: true, verificationStatus: true, hospitalShare: true }
  });
  console.log('Sample Hospitals & Labs:', JSON.stringify(hospitals, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
