import { readFile } from "node:fs/promises";
import path from "node:path";

export type MockRecord = {
  externalId: string;
  title: string;
  description?: string;
  sourceUrl?: string;
};

const MOCK_ITEM_REGEX =
  /<article\b[^>]*\bdata-external-id="([^"]+)"[^>]*\bdata-title="([^"]+)"[^>]*>([\s\S]*?)<\/article>/gi;

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function parseMockHtml(html: string): MockRecord[] {
  const records: MockRecord[] = [];
  for (const match of html.matchAll(MOCK_ITEM_REGEX)) {
    const externalId = match[1];
    const title = match[2];
    const inner = match[3] ?? "";
    const descMatch = inner.match(/data-description="([^"]*)"/);
    const urlMatch = inner.match(/data-source-url="([^"]*)"/);
    records.push({
      externalId,
      title,
      description: descMatch?.[1] ? stripTags(descMatch[1]) : undefined,
      sourceUrl: urlMatch?.[1] || undefined,
    });
  }
  return records;
}

export async function loadFixtureRecords(fixtureRelative = "fixtures/items.html"): Promise<MockRecord[]> {
  const filePath = path.join(/* turbopackIgnore: true */ process.cwd(), fixtureRelative);
  const html = await readFile(filePath, "utf8");
  return parseMockHtml(html);
}

export async function loadRecordsFromMockFeedUrl(url: string): Promise<MockRecord[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`mock-feed HTTP ${res.status}`);
  }
  const text = await res.text();
  if (res.headers.get("content-type")?.includes("rss")) {
    return parseRssMock(text);
  }
  return parseMockHtml(text);
}

function parseRssMock(xml: string): MockRecord[] {
  const items: MockRecord[] = [];
  const itemBlock = /<item>([\s\S]*?)<\/item>/gi;
  for (const block of xml.matchAll(itemBlock)) {
    const chunk = block[1];
    const guid = chunk.match(/<guid[^>]*>([^<]+)<\/guid>/i)?.[1]?.trim();
    const title = chunk.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1]?.trim();
    const description = chunk.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1]?.trim();
    const link = chunk.match(/<link>([^<]+)<\/link>/i)?.[1]?.trim();
    if (guid && title) {
      items.push({
        externalId: guid,
        title,
        description,
        sourceUrl: link,
      });
    }
  }
  return items;
}
