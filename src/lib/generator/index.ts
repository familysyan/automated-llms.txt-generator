import { query } from "@/lib/db";
import { classifyPages } from "./classifier";
import { scorePage } from "./scorer";
import { formatLlmsTxt } from "./formatter";

interface PageRow {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  depth: number;
  status_code: number | null;
  importance: number;
}

interface CrawlRow {
  id: string;
  site_id: string;
}

interface SiteRow {
  url: string;
  name: string | null;
  description: string | null;
}

export async function generateLlmsTxt(crawlId: string): Promise<string> {
  const { rows: crawlRows } = await query<CrawlRow>(
    "SELECT id, site_id FROM crawl WHERE id = $1",
    [crawlId]
  );
  const crawl = crawlRows[0];
  if (!crawl) throw new Error(`Crawl ${crawlId} not found`);

  const { rows: siteRows } = await query<SiteRow>(
    "SELECT url, name, description FROM site WHERE id = $1",
    [crawl.site_id]
  );
  const site = siteRows[0];
  if (!site) throw new Error(`Site ${crawl.site_id} not found`);

  const { rows: pages } = await query<PageRow>(
    `SELECT id, url, title, description, depth, status_code, importance
     FROM page WHERE crawl_id = $1 AND status_code IS NOT NULL AND status_code < 400
     ORDER BY depth ASC, crawled_at ASC`,
    [crawlId]
  );

  if (pages.length === 0) {
    return `# ${site.name || new URL(site.url).hostname}\n\nNo pages were found.\n`;
  }

  const homepage = pages.find((p) => p.depth === 0);
  const siteName = site.name || homepage?.title || new URL(site.url).hostname;
  const siteDescription = site.description || homepage?.description || null;

  for (const page of pages) {
    page.importance = scorePage(page);
    await query(
      "UPDATE page SET importance = $1 WHERE id = $2",
      [page.importance, page.id]
    );
  }

  const pageMap = new Map(pages.map((p) => [p.id, p]));
  const sections = classifyPages(pages, site.url);

  const scoredSections = new Map<
    string,
    { url: string; title: string | null; description: string | null; importance: number }[]
  >();

  for (const [name, sectionPages] of sections) {
    const scored: { url: string; title: string | null; description: string | null; importance: number }[] = [];
    for (const cp of sectionPages) {
      const page = pageMap.get(cp.id)!;
      await query("UPDATE page SET section = $1 WHERE id = $2", [name, page.id]);
      scored.push({
        url: page.url,
        title: page.title,
        description: page.description,
        importance: page.importance,
      });
    }
    scoredSections.set(name, scored);
  }

  return formatLlmsTxt({ siteName, siteDescription, sections: scoredSections });
}
