import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultPosters = [
    {
      title: 'Book Now',
      redirectLink: '/services',
      isDefault: true,
      displayOrder: 1,
    },
    {
      title: 'Book Video Consultation',
      redirectLink: '/specialties?type=doctor',
      isDefault: true,
      displayOrder: 2,
    },
    {
      title: 'Book Lab Test',
      redirectLink: '/services/lab-tests',
      isDefault: true,
      displayOrder: 3,
    },
    {
      title: 'Book Home Sample Collection',
      redirectLink: '/services/home-sample',
      isDefault: true,
      displayOrder: 4,
    }
  ];

  for (const poster of defaultPosters) {
    const existing = await prisma.homePoster.findFirst({
      where: { title: poster.title, isDefault: true }
    });

    if (!existing) {
      await prisma.homePoster.create({
        data: poster
      });
      console.log(`Created default poster: ${poster.title}`);
    } else {
      console.log(`Poster already exists: ${poster.title}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
