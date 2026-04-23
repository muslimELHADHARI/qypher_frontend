import { NextResponse } from "next/server";

const REMOTE_URL = "http://192.168.100.104:8000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /ips/blocklist
export async function GET() {
  try {
    const res = await fetch(`${REMOTE_URL}/ips/blocklist`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Remote API error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch blocklist" }, { status: 500 });
  }
}

// POST /ips/block?ip=...&reason=...
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.ip) {
      return NextResponse.json({ error: "Missing ip" }, { status: 400 });
    }

    const reason = body.reason || "Malicious behavior detected";
    const remoteUrl = new URL(`${REMOTE_URL}/ips/block`);
    remoteUrl.searchParams.append("ip", body.ip);
    remoteUrl.searchParams.append("reason", reason);

    const res = await fetch(remoteUrl.toString(), {
      method: "POST",
      cache: 'no-store'
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(errData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
