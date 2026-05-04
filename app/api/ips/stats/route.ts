import { NextResponse } from "next/server";

const REMOTE_URL = "http://127.0.0.1:8000";

export const runtime = "nodejs";

// GET /ips/stats
export async function GET() {
  try {
    const res = await fetch(`${REMOTE_URL}/ips/stats`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Remote API error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
