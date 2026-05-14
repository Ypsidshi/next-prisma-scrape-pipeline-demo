import cron from "node-cron";
import { loadFixtureRecords, loadRecordsFromMockFeedUrl } from "../src/lib/pipeline/mock-source";
import { runIngestion } from "../src/lib/pipeline/run-ingestion";

function resolveMockFeedUrl(): string {
  if (process.env.MOCK_FEED_URL) {
    return process.env.MOCK_FEED_URL;
  }
  const base = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/mock-feed`;
}

async function tick() {
  const mockSource = (process.env.MOCK_SOURCE ?? "fixture") as "fixture" | "mock-feed";
  try {
    const records =
      mockSource === "mock-feed"
        ? await loadRecordsFromMockFeedUrl(resolveMockFeedUrl())
        : await loadFixtureRecords();

    if (records.length === 0) {
      console.warn("[pipeline-worker] мок-источник не вернул записей");
      return;
    }

    const result = await runIngestion(records, "scheduled");
    console.log("[pipeline-worker] успех", { ...result, mockSource });
  } catch (e) {
    console.error("[pipeline-worker] ошибка", e);
  }
}

const cronExpr = process.env.PIPELINE_CRON ?? "*/5 * * * *";

if (!cron.validate(cronExpr)) {
  console.error(`[pipeline-worker] неверное выражение cron: ${cronExpr}`);
  process.exit(1);
}

console.log(`[pipeline-worker] старт, cron="${cronExpr}", MOCK_SOURCE=${process.env.MOCK_SOURCE ?? "fixture"}`);

cron.schedule(cronExpr, () => {
  void tick();
});

void tick();
