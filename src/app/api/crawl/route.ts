import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBoss } from "@/lib/boss";
import { QUEUES } from "@/lib/jobs/queues";

export async function POST(req: Request) {
  const body = await req.json();
  const { url, maxDepth = 3, maxPages = 200 } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Please enter a valid URL." },
      { status: 400 }
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!parsed.protocol.startsWith("http")) {
      throw new Error("not http");
    }
  } catch {
    return NextResponse.json(
      { error: "Please enter a valid URL including the protocol (https://)." },
      { status: 400 }
    );
  }

  const normalizedUrl = `${parsed.origin}${parsed.pathname.replace(/\/$/, "") || "/"}`;

  try {
    const { rows: existingSites } = await query<{ id: string }>(
      "SELECT id FROM site WHERE url = $1",
      [normalizedUrl]
    );

    let siteId: string;
    if (existingSites.length > 0) {
      siteId = existingSites[0].id;
    } else {
      siteId = crypto.randomUUID();
      await query(
        "INSERT INTO site (id, url) VALUES ($1, $2)",
        [siteId, normalizedUrl]
      );
    }

    const crawlId = crypto.randomUUID();
    await query(
      `INSERT INTO crawl (id, site_id, max_depth, max_pages)
       VALUES ($1, $2, $3, $4)`,
      [crawlId, siteId, maxDepth, maxPages]
    );

    const boss = await getBoss();
    await boss.send(QUEUES.CRAWL, {
      crawlId,
      url: normalizedUrl,
      maxDepth,
      maxPages,
    });

    return NextResponse.json({ crawlId, siteId }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/crawl]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
