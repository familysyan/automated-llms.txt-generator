import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBoss } from "@/lib/boss";
import { QUEUES } from "@/lib/jobs/queues";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { rows: siteRows } = await query<{ id: string; url: string }>(
      "SELECT id, url FROM site WHERE id = $1",
      [id]
    );

    if (siteRows.length === 0) {
      return NextResponse.json(
        { error: "The requested resource was not found." },
        { status: 404 }
      );
    }

    const site = siteRows[0];
    const crawlId = crypto.randomUUID();

    await query(
      "INSERT INTO crawl (id, site_id) VALUES ($1, $2)",
      [crawlId, site.id]
    );

    const boss = await getBoss();
    await boss.send(QUEUES.CRAWL, {
      crawlId,
      url: site.url,
      maxDepth: 3,
      maxPages: 200,
    });

    return NextResponse.json({ crawlId, siteId: id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/sites/[id]/recrawl]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
