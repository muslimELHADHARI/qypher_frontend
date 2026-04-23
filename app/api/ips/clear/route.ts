import { NextResponse } from "next/server";

const REMOTE_URL = "http://192.168.100.104:8000";

export const runtime = "nodejs";

// DELETE /ips/clear
export async function DELETE() {
  try {
    const res = await fetch(`${REMOTE_URL}/ips/clear`, {
      method: "DELETE",
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
