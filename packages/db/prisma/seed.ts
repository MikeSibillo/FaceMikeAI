import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Optional seed: 2 OracleSpeakerProfile (Michele, Francesco) as examples
  const existing = await prisma.oracleSpeakerProfile.count();
  if (existing === 0) {
    await prisma.oracleSpeakerProfile.createMany({
      data: [
        { displayName: 'Michele', roleLabel: 'Partecipante esempio' },
        { displayName: 'Francesco', roleLabel: 'Partecipante esempio' },
      ],
    });
    console.log('Seeded OracleSpeakerProfile (Michele, Francesco)');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
