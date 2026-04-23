import { NextResponse } from "next/server";
import { getThreatIntelligence } from "@/lib/services/threatIntel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const intel = await getThreatIntelligence();
  return NextResponse.json(intel);
}
