const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const modules = ['HOSPITAL', 'DOCTOR', 'LABS'];
  const titles = [
    'Host Medical Camps',
    'Hospital Marketing',
    'Platform Support & Demo'
  ];

  for (const mod of modules) {
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      // Check if exists
      const exists = await prisma.homePagePoster.findFirst({
        where: { module: mod, title }
      });
      if (!exists) {
        await prisma.homePagePoster.create({
          data: {
            title,
            module: mod,
            position: 'HERO_BANNER',
            isDefault: true,
            isActive: true,
            displayOrder: i + 1,
            buttonText: 'Action',
            description: 'Default poster',
            imageUrl: '',
            buttonAction: ''
          }
        });
        console.log(`Created default poster ${title} for module ${mod}`);
      } else {
        console.log(`Poster ${title} already exists for module ${mod}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
