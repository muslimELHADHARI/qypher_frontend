import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    modules: {
      suricata: "active",
      ml_zeek: "active",
      sse_stream: "active",
    },
  });
}
