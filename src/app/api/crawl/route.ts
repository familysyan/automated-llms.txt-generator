import { NextResponse } from "next/server";

// TODO: replace with real crawl job enqueue
export async function POST(req: Request) {
  const body = await req.json();
  const { url } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Please enter a valid URL." },
      { status: 400 }
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Please enter a valid URL including the protocol." },
      { status: 400 }
    );
  }

  const crawlId = "crawl-" + Date.now();
  const siteId = "site-" + Date.now();

  return NextResponse.json({ crawlId, siteId }, { status: 201 });
}
