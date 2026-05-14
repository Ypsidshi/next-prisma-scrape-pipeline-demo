import { prisma } from "@/lib/prisma";
import type { MockRecord } from "@/lib/pipeline/mock-source";

export type IngestionTrigger = "scheduled" | "manual" | "fixture";

export async function runIngestion(records: MockRecord[], trigger: IngestionTrigger) {
  const jobRun = await prisma.jobRun.create({
    data: { status: "RUNNING", trigger },
  });

  let itemsCreated = 0;
  let itemsUpdated = 0;

  try {
    for (const r of records) {
      const existing = await prisma.item.findUnique({ where: { externalId: r.externalId } });
      if (existing) {
        await prisma.item.update({
          where: { externalId: r.externalId },
          data: {
            title: r.title,
            description: r.description ?? null,
            sourceUrl: r.sourceUrl ?? null,
            fetchedAt: new Date(),
            jobRunId: jobRun.id,
          },
        });
        itemsUpdated += 1;
      } else {
        await prisma.item.create({
          data: {
            externalId: r.externalId,
            title: r.title,
            description: r.description ?? null,
            sourceUrl: r.sourceUrl ?? null,
            jobRunId: jobRun.id,
          },
        });
        itemsCreated += 1;
      }
    }

    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        itemsCreated,
        itemsUpdated,
      },
    });

    return { jobRunId: jobRun.id, itemsCreated, itemsUpdated };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Неизвестная ошибка";
    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        itemsCreated,
        itemsUpdated,
        errorMessage: message,
      },
    });
    throw e;
  }
}
