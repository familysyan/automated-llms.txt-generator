import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { rows: crawlRows } = await query(
      `SELECT id, site_id, status, pages_found, started_at, completed_at, llms_txt,
              max_depth, max_pages, error_message
       FROM crawl WHERE id = $1`,
      [id]
    );

    if (crawlRows.length === 0) {
      return NextResponse.json(
        { error: "The requested resource was not found." },
        { status: 404 }
      );
    }

    const crawl = crawlRows[0];

    const { rows: pages } = await query(
      `SELECT id, crawl_id, url, title, description, content_hash, depth,
              section, importance, status_code, crawled_at
       FROM page WHERE crawl_id = $1
       ORDER BY depth ASC, importance DESC, crawled_at ASC`,
      [id]
    );

    return NextResponse.json({
      id: crawl.id,
      siteId: crawl.site_id,
      status: crawl.status,
      pagesFound: crawl.pages_found,
      startedAt: crawl.started_at,
      completedAt: crawl.completed_at,
      llmsTxt: crawl.llms_txt,
      pages: pages.map((p) => ({
        id: p.id,
        crawlId: p.crawl_id,
        url: p.url,
        title: p.title,
        description: p.description,
        contentHash: p.content_hash,
        depth: p.depth,
        section: p.section,
        importance: p.importance,
        statusCode: p.status_code,
        crawledAt: p.crawled_at,
      })),
    });
  } catch (err) {
    console.error("[GET /api/crawl/[id]]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
