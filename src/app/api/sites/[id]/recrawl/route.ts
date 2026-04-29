import { NextResponse } from "next/server";
import { getSiteById } from "@/lib/fake-data";

// TODO: replace with real crawl job enqueue
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const site = getSiteById(id);
  if (!site) {
    return NextResponse.json(
      { error: "The requested resource was not found." },
      { status: 404 }
    );
  }

  const crawlId = "crawl-" + Date.now();
  return NextResponse.json({ crawlId, siteId: id }, { status: 201 });
}
