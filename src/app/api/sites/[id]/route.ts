import { NextResponse } from "next/server";
import { getSiteById, getMonitorChecks } from "@/lib/fake-data";

// TODO: replace with real DB query
export async function GET(
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

  const checks = site.monitor ? getMonitorChecks(site.monitor.id) : [];

  return NextResponse.json({ ...site, checks });
}

// TODO: replace with real DB delete
export async function DELETE(
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

  return new Response(null, { status: 204 });
}
