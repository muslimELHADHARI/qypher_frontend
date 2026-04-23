import { NextResponse } from "next/server";
import { loadAllEvents } from "@/lib/services/logReader";
import { SecurityEvent, StatsResponse } from "@/types/security";
import { format } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function computeStats(events: SecurityEvent[]): StatsResponse {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;

  // Severity distribution
  const severityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  for (const e of events) severityCounts[e.severity]++;
  const severityDistribution = (
    Object.entries(severityCounts) as [keyof typeof severityCounts, number][]
  ).map(([name, value]) => ({ name, value }));

  // Top source IPs
  const srcIPMap: Record<string, number> = {};
  for (const e of events) {
    if (e.src_ip && e.src_ip !== "N/A")
      srcIPMap[e.src_ip] = (srcIPMap[e.src_ip] || 0) + 1;
  }
  const topSourceIPs = Object.entries(srcIPMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  // Top destination IPs
  const dstIPMap: Record<string, number> = {};
  for (const e of events) {
    if (e.dst_ip && e.dst_ip !== "N/A")
      dstIPMap[e.dst_ip] = (dstIPMap[e.dst_ip] || 0) + 1;
  }
  const topDestIPs = Object.entries(dstIPMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  // Attack types
  const attackMap: Record<string, number> = {};
  for (const e of events) {
    const type = e.attack_type || "Unknown";
    attackMap[type] = (attackMap[type] || 0) + 1;
  }
  const attackTypes = Object.entries(attackMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Timeline: group by minute, last 30 minutes
  const timelineMap: Record<
    string,
    { count: number; critical: number; high: number; medium: number; low: number }
  > = {};
  for (const e of events) {
    const ts = new Date(e.timestamp);
    if (isNaN(ts.getTime())) continue;
    const key = format(ts, "HH:mm");
    if (!timelineMap[key]) timelineMap[key] = { count: 0, critical: 0, high: 0, medium: 0, low: 0 };
    timelineMap[key].count++;
    if (e.severity === "CRITICAL") timelineMap[key].critical++;
    else if (e.severity === "HIGH") timelineMap[key].high++;
    else if (e.severity === "MEDIUM") timelineMap[key].medium++;
    else timelineMap[key].low++;
  }
  const timeline = Object.entries(timelineMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([time, vals]) => ({ time, ...vals }));

  // Attacks per minute
  const recentEvents = events.filter((e) => {
    const ts = new Date(e.timestamp).getTime();
    return ts >= oneMinuteAgo && ts <= now;
  });

  return {
    totalEvents: events.length,
    activeThreats: events.filter(
      (e) => e.severity === "CRITICAL" || e.severity === "HIGH"
    ).length,
    criticalAlerts: severityCounts.CRITICAL,
    attacksPerMinute: recentEvents.length,
    severityDistribution,
    topSourceIPs,
    topDestIPs,
    attackTypes,
    timeline,
  };
}

export async function GET() {
  const events = await loadAllEvents();
  const stats = computeStats(events);

  // Fetch true absolute total from the backend database instead of relying on the 1000-event memory buffer
  try {
    const backendRes = await fetch("http://192.168.100.104:8000/logs/stats", { cache: "no-store" });
    if (backendRes.ok) {
      const backendData = await backendRes.json();
      if (backendData.statistics) {
        const trueTotal =
          (backendData.statistics.logs_qsh_count || 0) +
          (backendData.statistics.logs_suricata_count || 0) +
          (backendData.statistics.logs_zeek_count || 0);

        if (trueTotal > stats.totalEvents) {
          stats.totalEvents = trueTotal;
        }
      }
    }
  } catch (err) {
    // If backend is unreachable, fallback to buffer length (already set by computeStats)
    console.error("[Stats API] Failed to fetch true total events:", err);
  }

  return NextResponse.json(stats);
}
