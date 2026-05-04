import { NextResponse } from "next/server";

const REMOTE_URL = "http://127.0.0.1:8000";

export const runtime = "nodejs";

// GET /ips/firewall/status
export async function GET() {
  try {
    const res = await fetch(`${REMOTE_URL}/ips/firewall/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Remote API error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch firewall status" }, { status: 500 });
  }
}

// POST /ips/firewall/sync
export async function POST() {
  try {
    const res = await fetch(`${REMOTE_URL}/ips/firewall/sync`, {
      method: "POST",
      cache: 'no-store'
    });
    if (!res.ok) throw new Error("Remote API error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to sync firewall" }, { status: 500 });
  }
}
