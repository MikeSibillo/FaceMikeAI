import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.SEED_VOICE_SPEAKERS !== 'true') return;

  const existing = await prisma.oracleSpeakerProfile.count();
  if (existing > 0) return;

  await prisma.oracleSpeakerProfile.createMany({
    data: [
      { displayName: 'Michele', roleLabel: 'Example' },
      { displayName: 'Francesco', roleLabel: 'Example' },
    ],
  });
  console.log('Seeded OracleSpeakerProfile (Michele, Francesco)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
