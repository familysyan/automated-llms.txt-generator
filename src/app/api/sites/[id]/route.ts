import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { rows: siteRows } = await query(
      "SELECT id, url, name, description, created_at, updated_at FROM site WHERE id = $1",
      [id]
    );

    if (siteRows.length === 0) {
      return NextResponse.json(
        { error: "The requested resource was not found." },
        { status: 404 }
      );
    }

    const site = siteRows[0];

    const { rows: crawlRows } = await query(
      `SELECT id, site_id, status, pages_found, started_at, completed_at, llms_txt
       FROM crawl WHERE site_id = $1 ORDER BY started_at DESC LIMIT 1`,
      [id]
    );

    const lastCrawl = crawlRows[0]
      ? {
          id: crawlRows[0].id,
          siteId: crawlRows[0].site_id,
          status: crawlRows[0].status,
          pagesFound: crawlRows[0].pages_found,
          startedAt: crawlRows[0].started_at,
          completedAt: crawlRows[0].completed_at,
          llmsTxt: crawlRows[0].llms_txt,
          pages: [],
        }
      : null;

    const { rows: monitorRows } = await query(
      `SELECT id, site_id, active, interval, last_check_at, last_change_at, created_at
       FROM monitor WHERE site_id = $1`,
      [id]
    );

    const monitor = monitorRows[0]
      ? {
          id: monitorRows[0].id,
          siteId: monitorRows[0].site_id,
          active: monitorRows[0].active,
          interval: monitorRows[0].interval,
          lastCheckAt: monitorRows[0].last_check_at,
          lastChangeAt: monitorRows[0].last_change_at,
          createdAt: monitorRows[0].created_at,
        }
      : null;

    let checks: { id: string; monitorId: string; checkedAt: string; hasChanges: boolean; diff: unknown }[] = [];
    if (monitor) {
      const { rows: checkRows } = await query(
        `SELECT id, monitor_id, checked_at, has_changes, diff
         FROM monitor_check WHERE monitor_id = $1
         ORDER BY checked_at DESC LIMIT 50`,
        [monitor.id]
      );
      checks = checkRows.map((c) => ({
        id: c.id,
        monitorId: c.monitor_id,
        checkedAt: c.checked_at,
        hasChanges: c.has_changes,
        diff: c.diff,
      }));
    }

    return NextResponse.json({
      id: site.id,
      url: site.url,
      name: site.name,
      description: site.description,
      createdAt: site.created_at,
      updatedAt: site.updated_at,
      lastCrawl,
      monitor,
      checks,
    });
  } catch (err) {
    console.error("[GET /api/sites/[id]]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { rowCount } = await query("DELETE FROM site WHERE id = $1", [id]);

    if (rowCount === 0) {
      return NextResponse.json(
        { error: "The requested resource was not found." },
        { status: 404 }
      );
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/sites/[id]]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
