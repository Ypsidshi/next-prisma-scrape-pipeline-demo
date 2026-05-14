import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, jsonFromZodError } from "@/lib/api-response";
import { loadFixtureRecords, loadRecordsFromMockFeedUrl } from "@/lib/pipeline/mock-source";
import { runIngestion } from "@/lib/pipeline/run-ingestion";

const bodySchema = z.object({
  source: z.enum(["fixture", "mock-feed"]).default("fixture"),
});

export async function POST(req: Request) {
  let json: unknown = {};
  try {
    json = await req.json();
  } catch {
    json = {};
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonFromZodError(parsed.error);
  }
  const source = parsed.data.source;

  try {
    const records =
      source === "mock-feed"
        ? await loadRecordsFromMockFeedUrl(resolveMockFeedUrl())
        : await loadFixtureRecords();

    if (records.length === 0) {
      return jsonError(400, "Мок-источник не вернул записей");
    }

    const result = await runIngestion(records, source === "mock-feed" ? "manual" : "fixture");
    return NextResponse.json({ ok: true, ...result, source });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка пайплайна";
    return jsonError(500, message);
  }
}

function resolveMockFeedUrl() {
  const base = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/mock-feed`;
}
