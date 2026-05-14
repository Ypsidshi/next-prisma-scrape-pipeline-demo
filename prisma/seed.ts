import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.item.deleteMany();
  await prisma.jobRun.deleteMany();

  const run = await prisma.jobRun.create({
    data: { status: "SUCCESS", trigger: "manual", finishedAt: new Date(), itemsCreated: 2, itemsUpdated: 0 },
  });

  await prisma.item.createMany({
    data: [
      {
        externalId: "seed-1",
        title: "Сид: демо-элемент",
        description: "Создан через prisma db seed",
        sourceUrl: "https://example.invalid/seed-1",
        jobRunId: run.id,
      },
      {
        externalId: "seed-2",
        title: "Сид: второй элемент",
        description: "Для списков и статистики",
        sourceUrl: "https://example.invalid/seed-2",
        jobRunId: run.id,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
