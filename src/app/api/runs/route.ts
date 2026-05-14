import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonFromZodError } from "@/lib/api-response";

const querySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).optional().default(30),
  skip: z.coerce.number().int().min(0).optional().default(0),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      take: url.searchParams.get("take") ?? undefined,
      skip: url.searchParams.get("skip") ?? undefined,
    });
    if (!parsed.success) {
      return jsonFromZodError(parsed.error);
    }
    const { take, skip } = parsed.data;

    const [runs, total] = await Promise.all([
      prisma.jobRun.findMany({
        orderBy: { startedAt: "desc" },
        take,
        skip,
        include: { _count: { select: { items: true } } },
      }),
      prisma.jobRun.count(),
    ]);

    return NextResponse.json({ runs, total, take, skip });
  } catch {
    return jsonError(500, "Не удалось загрузить запуски");
  }
}
