import { NextResponse } from "next/server";
import { fakeSites } from "@/lib/fake-data";

// TODO: replace with real DB query
export async function GET() {
  return NextResponse.json(fakeSites);
}
