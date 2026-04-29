import { NextResponse } from "next/server";
import { fakeSites } from "@/lib/fake-data";

// TODO: replace with real DB query
export async function GET() {
  const crawl = fakeSites[0].lastCrawl;
  if (!crawl) {
    return NextResponse.json(
      { error: "The requested resource was not found." },
      { status: 404 }
    );
  }
  return NextResponse.json(crawl);
}
