import { PrismaClient } from '../src/generated';

const prisma = new PrismaClient();

async function main() {
  // Optional seed: 2 OracleSpeakerProfile (Michele, Francesco) - examples only
  const existing = await prisma.oracleSpeakerProfile.count();
  if (existing > 0) return;

  await prisma.oracleSpeakerProfile.createMany({
    data: [
      { displayName: 'Michele', roleLabel: 'Esempio 1' },
      { displayName: 'Francesco', roleLabel: 'Esempio 2' },
    ],
  });
  console.log('Seeded OracleSpeakerProfile: Michele, Francesco');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
