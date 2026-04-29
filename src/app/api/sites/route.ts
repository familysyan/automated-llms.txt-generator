import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const { rows: sites } = await query(`
      SELECT
        s.id, s.url, s.name, s.description, s.created_at, s.updated_at,
        c.id AS crawl_id, c.status AS crawl_status, c.pages_found AS crawl_pages_found,
        c.completed_at AS crawl_completed_at, c.started_at AS crawl_started_at,
        m.id AS monitor_id, m.active AS monitor_active, m.interval AS monitor_interval,
        m.last_check_at AS monitor_last_check_at, m.last_change_at AS monitor_last_change_at,
        m.webhook_url AS monitor_webhook_url, m.created_at AS monitor_created_at
      FROM site s
      LEFT JOIN LATERAL (
        SELECT * FROM crawl WHERE site_id = s.id ORDER BY started_at DESC LIMIT 1
      ) c ON true
      LEFT JOIN monitor m ON m.site_id = s.id
      ORDER BY s.updated_at DESC
    `);

    const result = sites.map((row) => ({
      id: row.id,
      url: row.url,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastCrawl: row.crawl_id
        ? {
            id: row.crawl_id,
            siteId: row.id,
            status: row.crawl_status,
            pagesFound: row.crawl_pages_found,
            startedAt: row.crawl_started_at,
            completedAt: row.crawl_completed_at,
            llmsTxt: null,
            pages: [],
          }
        : null,
      monitor: row.monitor_id
        ? {
            id: row.monitor_id,
            siteId: row.id,
            active: row.monitor_active,
            interval: row.monitor_interval,
            lastCheckAt: row.monitor_last_check_at,
            lastChangeAt: row.monitor_last_change_at,
            webhookUrl: row.monitor_webhook_url,
            createdAt: row.monitor_created_at,
          }
        : null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/sites]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
