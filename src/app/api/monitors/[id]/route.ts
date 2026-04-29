import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { updateMonitorSchedule, removeMonitorSchedule } from "@/lib/monitor/scheduler";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { active, interval, webhookUrl } = body;

    const { rows: existing } = await query<{ id: string }>(
      "SELECT id FROM monitor WHERE id = $1",
      [id]
    );
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "The requested resource was not found." },
        { status: 404 }
      );
    }

    if (interval && !["hourly", "daily", "weekly"].includes(interval)) {
      return NextResponse.json({ error: "Invalid interval." }, { status: 400 });
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (active !== undefined) {
      setClauses.push(`active = $${idx++}`);
      values.push(active);
    }
    if (interval) {
      setClauses.push(`interval = $${idx++}`);
      values.push(interval);
    }
    if (webhookUrl !== undefined) {
      setClauses.push(`webhook_url = $${idx++}`);
      values.push(webhookUrl);
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    values.push(id);
    await query(
      `UPDATE monitor SET ${setClauses.join(", ")} WHERE id = $${idx}`,
      values
    );

    const { rows } = await query<{
      id: string; site_id: string; active: boolean; interval: string;
      last_check_at: string | null; last_change_at: string | null;
      webhook_url: string | null; created_at: string;
    }>(
      `SELECT m.id, m.site_id, m.active, m.interval, m.last_check_at, m.last_change_at,
              m.webhook_url, m.created_at
       FROM monitor m WHERE m.id = $1`,
      [id]
    );
    const m = rows[0];

    if (active !== undefined || interval) {
      const { rows: siteRows } = await query<{ url: string }>(
        "SELECT url FROM site WHERE id = $1",
        [m.site_id]
      );
      await updateMonitorSchedule({
        id: m.id,
        siteId: m.site_id,
        interval: m.interval,
        active: m.active,
        siteUrl: siteRows[0].url,
      });
    }

    return NextResponse.json({
      id: m.id,
      siteId: m.site_id,
      active: m.active,
      interval: m.interval,
      lastCheckAt: m.last_check_at,
      lastChangeAt: m.last_change_at,
      webhookUrl: m.webhook_url,
      createdAt: m.created_at,
    });
  } catch (err) {
    console.error("[PATCH /api/monitors/[id]]", err);
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
    await removeMonitorSchedule(id);

    const { rowCount } = await query("DELETE FROM monitor WHERE id = $1", [id]);
    if (rowCount === 0) {
      return NextResponse.json(
        { error: "The requested resource was not found." },
        { status: 404 }
      );
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/monitors/[id]]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
