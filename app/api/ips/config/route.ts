import { NextResponse } from "next/server";
import { getAutoBlockConfig, setAutoBlockConfig } from "@/lib/services/autoBlockConfig";

export const runtime = "nodejs";

// GET /api/ips/config
export async function GET() {
  return NextResponse.json(getAutoBlockConfig());
}

// POST /api/ips/config
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = setAutoBlockConfig(body);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
