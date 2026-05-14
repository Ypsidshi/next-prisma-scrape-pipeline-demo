import { NextResponse } from "next/server";

const MOCK_FEED_TITLE = "Mock scrape feed (demo)";

export async function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const items = [
    {
      guid: "rss-demo-100",
      title: "RSS-мок: скидка на подписку",
      link: `${base}/mock-feed`,
      description: "Запись из внутреннего RSS только для демонстрации.",
    },
    {
      guid: "rss-demo-101",
      title: "RSS-мок: напоминание о вебинаре",
      link: `${base}/`,
      description: "Не обращается к внешним источникам.",
    },
  ];

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${MOCK_FEED_TITLE}</title>
    <link>${base}</link>
    <description>Внутренний мок-фид. Не для продакшн-скрейпинга.</description>
    ${items
      .map(
        (i) => `
    <item>
      <title><![CDATA[${i.title}]]></title>
      <link>${i.link}</link>
      <guid>${i.guid}</guid>
      <description><![CDATA[${i.description}]]></description>
    </item>`,
      )
      .join("")}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
