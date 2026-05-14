import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-response";

export async function GET() {
  try {
    const [itemsTotal, runsTotal, lastRun, lastItems] = await Promise.all([
      prisma.item.count(),
      prisma.jobRun.count(),
      prisma.jobRun.findFirst({ orderBy: { startedAt: "desc" } }),
      prisma.item.findMany({
        orderBy: { fetchedAt: "desc" },
        take: 5,
        select: { id: true, externalId: true, title: true, fetchedAt: true },
      }),
    ]);

    const byStatus = await prisma.jobRun.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    return NextResponse.json({
      itemsTotal,
      runsTotal,
      runsByStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
      lastRun,
      recentItems: lastItems,
    });
  } catch {
    return jsonError(500, "Не удалось собрать статистику");
  }
}
