import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [itemsTotal, runsTotal, runsByStatus, lastRuns, recentItems] = await Promise.all([
    prisma.item.count(),
    prisma.jobRun.count(),
    prisma.jobRun.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.jobRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 8,
      select: {
        id: true,
        startedAt: true,
        finishedAt: true,
        status: true,
        trigger: true,
        itemsCreated: true,
        itemsUpdated: true,
        errorMessage: true,
      },
    }),
    prisma.item.findMany({
      orderBy: { fetchedAt: "desc" },
      take: 12,
      select: {
        id: true,
        externalId: true,
        title: true,
        fetchedAt: true,
        jobRun: { select: { trigger: true, status: true } },
      },
    }),
  ]);

  const statusMap = Object.fromEntries(runsByStatus.map((r) => [r.status, r._count._all]));

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-8 dark:border-zinc-800">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Демо портфолио · парсер / пайплайн
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Мок-пайплайн сбора в PostgreSQL</h1>
          <p className="max-w-3xl text-lg text-zinc-600 dark:text-zinc-400">
            Данные приходят только из локальных фикстур и внутреннего RSS <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">/mock-feed</code>. Внешние сайты в
            демо не запрашиваются.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              className="rounded-full bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
              href="/mock-feed"
            >
              Открыть мок-RSS
            </Link>
            <a
              className="rounded-full border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              href="/api/stats"
            >
              GET /api/stats
            </a>
            <a
              className="rounded-full border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              href="/api/items?take=20"
            >
              GET /api/items
            </a>
            <a
              className="rounded-full border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              href="/api/runs?take=20"
            >
              GET /api/runs
            </a>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Записей Item" value={itemsTotal} hint="дедуп по externalId" />
          <StatCard label="Прогонов JobRun" value={runsTotal} hint="история пайплайна" />
          <StatCard
            label="Статусы прогонов"
            value={Object.keys(statusMap).length ? "см. ниже" : "—"}
            hint={`SUCCESS ${statusMap.SUCCESS ?? 0} · FAILED ${statusMap.FAILED ?? 0} · RUNNING ${statusMap.RUNNING ?? 0}`}
          />
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Последние прогоны</h2>
            <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {lastRuns.length === 0 ? (
                <li className="px-4 py-6 text-zinc-500">Пока нет прогонов. Выполните сид или POST /api/pipeline/run.</li>
              ) : (
                lastRuns.map((r) => (
                  <li key={r.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-zinc-500">{r.id.slice(0, 8)}…</span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">{r.status}</span>
                      <span className="text-xs text-zinc-500">{r.trigger}</span>
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {r.startedAt.toISOString()}
                      {r.finishedAt ? ` → ${r.finishedAt.toISOString()}` : ""} · +{r.itemsCreated} / ~{r.itemsUpdated}
                    </div>
                    {r.errorMessage ? <p className="text-xs text-red-600">{r.errorMessage}</p> : null}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-lg font-semibold">Последние элементы</h2>
            <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {recentItems.length === 0 ? (
                <li className="px-4 py-6 text-zinc-500">Пусто. Запустите ingestion.</li>
              ) : (
                recentItems.map((item) => (
                  <li key={item.id} className="px-4 py-3 text-sm">
                    <div className="font-medium">{item.title}</div>
                    <div className="mt-1 font-mono text-xs text-zinc-500">{item.externalId}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {item.fetchedAt.toISOString()}
                      {item.jobRun ? ` · ${item.jobRun.trigger} (${item.jobRun.status})` : ""}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Ручной запуск ingestion</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Из фикстур:{" "}
            <code className="break-all rounded bg-zinc-100 px-1 dark:bg-zinc-800">
              {`curl -X POST http://localhost:3000/api/pipeline/run -H "Content-Type: application/json" -d '{"source":"fixture"}'`}
            </code>
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Из внутреннего RSS: <code className="break-all rounded bg-zinc-100 px-1 dark:bg-zinc-800">{`{"source":"mock-feed"}`}</code>
          </p>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
      <div className="mt-2 text-xs text-zinc-500">{hint}</div>
    </div>
  );
}
