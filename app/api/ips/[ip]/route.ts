import { NextResponse } from "next/server";

const REMOTE_URL = "http://127.0.0.1:8000";

export const runtime = "nodejs";

// DELETE /ips/unblock/...
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ ip: string }> }
) {
  try {
    const { ip } = await params;
    if (!ip) {
      return NextResponse.json({ error: "Missing ip" }, { status: 400 });
    }

    const res = await fetch(`${REMOTE_URL}/ips/unblock/${ip}`, {
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
