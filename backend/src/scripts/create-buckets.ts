import { prisma } from '../config/prisma';

async function main() {
  try {
    const bucketsToCreate = [
      { id: 'reports', name: 'reports', public: true },
      { id: 'licenses', name: 'licenses', public: true },
      { id: 'avatars', name: 'avatars', public: true },
      { id: 'attachments', name: 'attachments', public: true },
    ];

    for (const b of bucketsToCreate) {
      await prisma.$executeRaw`
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (${b.id}, ${b.name}, ${b.public}, 52428800, NULL)
        ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
      `;
      console.log(`Bucket ${b.id} created / updated.`);
    }

    const currentBuckets: any = await prisma.$queryRaw`
      SELECT id, name, public, file_size_limit FROM storage.buckets;
    `;
    console.log('Current Supabase Storage Buckets:', currentBuckets);

  } catch (err) {
    console.error('Error managing storage buckets:', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
