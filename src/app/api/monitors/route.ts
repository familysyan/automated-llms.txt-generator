import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { scheduleMonitor } from "@/lib/monitor/scheduler";

export async function GET() {
  try {
    const { rows } = await query(`
      SELECT m.id, m.site_id, m.active, m.interval, m.last_check_at, m.last_change_at,
             m.created_at,
             s.url AS site_url, s.name AS site_name
      FROM monitor m
      JOIN site s ON s.id = m.site_id
      ORDER BY m.created_at DESC
    `);

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        siteId: r.site_id,
        active: r.active,
        interval: r.interval,
        lastCheckAt: r.last_check_at,
        lastChangeAt: r.last_change_at,
        createdAt: r.created_at,
        site: { url: r.site_url, name: r.site_name },
      }))
    );
  } catch (err) {
    console.error("[GET /api/monitors]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { siteId, interval = "daily" } = await req.json();

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required." }, { status: 400 });
    }

    if (!["hourly", "daily", "weekly"].includes(interval)) {
      return NextResponse.json({ error: "Invalid interval." }, { status: 400 });
    }

    const { rows: siteRows } = await query<{ id: string; url: string }>(
      "SELECT id, url FROM site WHERE id = $1",
      [siteId]
    );
    if (siteRows.length === 0) {
      return NextResponse.json({ error: "Site not found." }, { status: 404 });
    }

    const { rows: existing } = await query(
      "SELECT id FROM monitor WHERE site_id = $1",
      [siteId]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A monitor already exists for this site." },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO monitor (id, site_id, interval)
       VALUES ($1, $2, $3)`,
      [id, siteId, interval]
    );

    await scheduleMonitor({
      id,
      siteId,
      interval,
      siteUrl: siteRows[0].url,
    });

    const { rows: monitorRows } = await query(
      `SELECT id, site_id, active, interval, last_check_at, last_change_at, created_at
       FROM monitor WHERE id = $1`,
      [id]
    );
    const m = monitorRows[0];

    return NextResponse.json(
      {
        id: m.id,
        siteId: m.site_id,
        active: m.active,
        interval: m.interval,
        lastCheckAt: m.last_check_at,
        lastChangeAt: m.last_change_at,
        createdAt: m.created_at,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/monitors]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
