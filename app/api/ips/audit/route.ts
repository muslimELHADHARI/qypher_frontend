import { NextResponse } from "next/server";

const REMOTE_URL = "http://192.168.100.104:8000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ips/audit
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  try {
    const remoteUrl = new URL(`${REMOTE_URL}/ips/actions`);
    searchParams.forEach((value, key) => {
      remoteUrl.searchParams.append(key, value);
    });

    const res = await fetch(remoteUrl.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error("Remote API error");

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch audit trail" }, { status: 500 });
  }
}
