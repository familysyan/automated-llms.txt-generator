import { query } from "@/lib/db";
import { fetchPage } from "./fetcher";
import { parsePage } from "./parser";
import { loadRobots } from "./robots";
import { generateLlmsTxt } from "@/lib/generator";
import { scheduleMonitor } from "@/lib/monitor/scheduler";

const CONCURRENCY_LIMIT = 5;

const NON_HTML_EXTENSIONS = new Set([
  ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
  ".css", ".js", ".xml", ".json", ".zip", ".tar", ".gz",
  ".mp3", ".mp4", ".wav", ".avi", ".mov", ".webp", ".woff",
  ".woff2", ".ttf", ".eot", ".map",
]);

export interface CrawlJobPayload {
  crawlId: string;
  url: string;
  maxDepth: number;
  maxPages: number;
}

export async function executeCrawl(payload: CrawlJobPayload) {
  const { crawlId, url: seedUrl, maxDepth, maxPages } = payload;

  await query("UPDATE crawl SET status = $1 WHERE id = $2", ["running", crawlId]);

  try {
    const robots = await loadRobots(seedUrl);

    const seedResult = await fetchPage(seedUrl, robots.crawlDelay);
    if (seedResult.statusCode !== 0 && seedResult.statusCode >= 400) {
      await query(
        "UPDATE crawl SET status = $1, error_message = $2, completed_at = now() WHERE id = $3",
        ["failed", `Seed URL returned ${seedResult.statusCode}`, crawlId]
      );
      return;
    }
    if (seedResult.error && seedResult.statusCode === 0) {
      await query(
        "UPDATE crawl SET status = $1, error_message = $2, completed_at = now() WHERE id = $3",
        ["failed", `Could not fetch seed URL: ${seedResult.error}`, crawlId]
      );
      return;
    }

    const seedOrigin = new URL(seedUrl).origin;
    const visited = new Set<string>();
    const urlQueue: { url: string; depth: number }[] = [];
    let pagesProcessed = 0;

    const normalizedSeed = normalizeUrl(seedUrl);
    visited.add(normalizedSeed);

    const seedParsed = parsePage(seedResult.html, seedResult.url);
    await storePage(crawlId, seedResult.url, seedParsed, seedResult.statusCode, 0);
    pagesProcessed++;

    // Update the site record with homepage metadata
    const { rows: crawlSite } = await query<{ site_id: string }>(
      "SELECT site_id FROM crawl WHERE id = $1",
      [crawlId]
    );
    if (crawlSite[0]) {
      await query(
        "UPDATE site SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3",
        [seedParsed.title, seedParsed.description, crawlSite[0].site_id]
      );
    }

    for (const link of seedParsed.links) {
      const normalized = normalizeUrl(link);
      if (shouldEnqueue(normalized, link, seedOrigin, 1, maxDepth, visited, robots)) {
        visited.add(normalized);
        urlQueue.push({ url: link, depth: 1 });
      }
    }

    let activeCount = 0;
    let resolveSlot: (() => void) | null = null;

    function waitForSlot(): Promise<void> {
      if (activeCount < CONCURRENCY_LIMIT) return Promise.resolve();
      return new Promise((resolve) => {
        resolveSlot = resolve;
      });
    }

    function releaseSlot() {
      activeCount--;
      if (resolveSlot) {
        const fn = resolveSlot;
        resolveSlot = null;
        fn();
      }
    }

    while (urlQueue.length > 0 && pagesProcessed < maxPages) {
      await waitForSlot();
      if (pagesProcessed >= maxPages) break;

      const item = urlQueue.shift();
      if (!item) break;

      activeCount++;
      pagesProcessed++;

      processPage(item.url, item.depth, crawlId, seedOrigin, maxDepth, maxPages, visited, robots, urlQueue, pagesProcessed)
        .catch((err) => console.error(`[crawl] error processing ${item.url}:`, err))
        .finally(() => releaseSlot());
    }

    while (activeCount > 0) {
      await new Promise((r) => setTimeout(r, 100));
    }

    const { rows } = await query<{ pages_found: number }>(
      "SELECT pages_found FROM crawl WHERE id = $1",
      [crawlId]
    );
    const totalPages = rows[0]?.pages_found ?? 0;

    if (totalPages === 0) {
      await query(
        "UPDATE crawl SET status = $1, error_message = $2, completed_at = now() WHERE id = $3",
        ["failed", "No pages were successfully crawled", crawlId]
      );
      return;
    }

    await query(
      "UPDATE crawl SET status = $1, completed_at = now() WHERE id = $2",
      ["completed", crawlId]
    );

    const llmsTxt = await generateLlmsTxt(crawlId);
    await query("UPDATE crawl SET llms_txt = $1 WHERE id = $2", [llmsTxt, crawlId]);

    // Auto-create a daily monitor if one doesn't exist yet
    const siteId = crawlSite[0]?.site_id;
    if (siteId) {
      const { rows: existingMonitor } = await query(
        "SELECT id FROM monitor WHERE site_id = $1",
        [siteId]
      );
      if (existingMonitor.length === 0) {
        const monitorId = crypto.randomUUID();
        await query(
          "INSERT INTO monitor (id, site_id) VALUES ($1, $2)",
          [monitorId, siteId]
        );
        await scheduleMonitor({ id: monitorId, siteId, interval: "daily", siteUrl: seedUrl });
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[crawl] fatal error for ${crawlId}:`, message);
    await query(
      "UPDATE crawl SET status = $1, error_message = $2, completed_at = now() WHERE id = $3",
      ["failed", message, crawlId]
    );
  }
}

async function processPage(
  url: string,
  depth: number,
  crawlId: string,
  seedOrigin: string,
  maxDepth: number,
  _maxPages: number,
  visited: Set<string>,
  robots: { isAllowed(url: string): boolean; crawlDelay: number },
  urlQueue: { url: string; depth: number }[],
  _pagesProcessed: number,
) {
  const result = await fetchPage(url, robots.crawlDelay);

  if (result.error || !result.html) {
    await storePage(crawlId, url, null, result.statusCode, depth);
    return;
  }

  const parsed = parsePage(result.html, result.url);
  await storePage(crawlId, result.url, parsed, result.statusCode, depth);

  for (const link of parsed.links) {
    const normalized = normalizeUrl(link);
    if (shouldEnqueue(normalized, link, seedOrigin, depth + 1, maxDepth, visited, robots)) {
      visited.add(normalized);
      urlQueue.push({ url: link, depth: depth + 1 });
    }
  }
}

async function storePage(
  crawlId: string,
  url: string,
  parsed: { title: string | null; description: string | null; contentHash: string; canonicalUrl: string } | null,
  statusCode: number,
  depth: number,
) {
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO page (id, crawl_id, url, title, description, content_hash, depth, status_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      crawlId,
      parsed?.canonicalUrl ?? url,
      parsed?.title ?? null,
      parsed?.description ?? null,
      parsed?.contentHash ?? null,
      depth,
      statusCode || null,
    ]
  );

  await query(
    "UPDATE crawl SET pages_found = pages_found + 1 WHERE id = $1",
    [crawlId]
  );
}

function normalizeUrl(href: string): string {
  try {
    const u = new URL(href);
    u.hash = "";
    if (u.pathname !== "/" && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    u.searchParams.sort();
    return u.toString().toLowerCase();
  } catch {
    return href.toLowerCase();
  }
}

function shouldEnqueue(
  normalized: string,
  raw: string,
  seedOrigin: string,
  depth: number,
  maxDepth: number,
  visited: Set<string>,
  robots: { isAllowed(url: string): boolean },
): boolean {
  if (visited.has(normalized)) return false;
  if (depth > maxDepth) return false;

  try {
    const u = new URL(raw);
    if (u.origin !== seedOrigin) return false;

    const ext = u.pathname.slice(u.pathname.lastIndexOf(".")).toLowerCase();
    if (NON_HTML_EXTENSIONS.has(ext)) return false;
  } catch {
    return false;
  }

  if (!robots.isAllowed(raw)) return false;

  return true;
}
