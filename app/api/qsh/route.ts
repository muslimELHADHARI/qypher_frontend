import { NextResponse } from "next/server";
import { loadAllQSHEvents } from "@/lib/services/logReader";
import { QSHEvent, QSHStatsResponse } from "@/types/security";
import { format } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function computeQSHStats(events: QSHEvent[]): QSHStatsResponse {
  let activeSessions = 0;
  let totalHandshakes = 0;
  let totalCommands = 0;
  let totalQber = 0;
  let qberCount = 0;

  const activityMap: Record<string, number> = {};
  const qberMap: Record<string, { sumQber: number; sumSiftedRate: number; count: number }> = {};
  const activeSet = new Set<string>();
  const clientMap: Record<string, { handshakes: number; commands: number }> = {};

  for (const e of events) {
    const ts = new Date(e.timestamp);
    if (isNaN(ts.getTime())) continue;
    const timeKey = format(ts, "HH:mm");

    // Track sessions
    if (e.event === "session_open" && e.session) activeSet.add(e.session);
    if (e.event === "session_close" && e.session) activeSet.delete(e.session);

    // Track QKD reports
    if (e.event === "server_qkd_report") {
      totalHandshakes++;
      if (e.qber !== undefined) {
        totalQber += e.qber;
        qberCount++;
      }
      
      if (!qberMap[timeKey]) {
        qberMap[timeKey] = { sumQber: 0, sumSiftedRate: 0, count: 0 };
      }
      qberMap[timeKey].sumQber += e.qber || 0;
      qberMap[timeKey].sumSiftedRate += e.sifted_rate || 0;
      qberMap[timeKey].count++;
    }
    
    // Track client handshakes
    if (e.event === "auth_success" && e.client) {
      if (!clientMap[e.client]) clientMap[e.client] = { handshakes: 0, commands: 0 };
      clientMap[e.client].handshakes++;
    }

    // Track standard activity
    if (e.event === "command_execute" || e.event === "file_action") {
      totalCommands++;
      if (!activityMap[timeKey]) activityMap[timeKey] = 0;
      activityMap[timeKey]++;
      
      if (e.client) {
        if (!clientMap[e.client]) clientMap[e.client] = { handshakes: 0, commands: 0 };
        clientMap[e.client].commands++;
      }
    }
  }

  // Format timelines (last 30 minutes)
  const qberTimeline = Object.entries(qberMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([time, data]) => ({
      time,
      qber: data.sumQber / data.count,
      sifted_rate: data.sumSiftedRate / data.count,
    }));

  const activityTimeline = Object.entries(activityMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([time, count]) => ({ time, count }));

  const clients = Object.entries(clientMap).map(([ip, data]) => ({
    ip,
    handshakes: data.handshakes,
    commands: data.commands,
  })).sort((a, b) => b.commands - a.commands);

  // Operations to feature in feed
  const opEvents = events.filter(e => 
    e.event === "command_execute" || e.event === "file_action" || e.event === "auth_success"
  );
  
  const recentEvents = [...opEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 100);

  return {
    totalEvents: events.length,
    activeSessions: activeSet.size,
    totalHandshakes,
    avgQber: qberCount > 0 ? totalQber / qberCount : 0,
    totalCommands,
    qberTimeline,
    activityTimeline,
    clients,
    recentEvents,
  };
}

export async function GET() {
  const events = await loadAllQSHEvents();
  const stats = computeQSHStats(events);
  return NextResponse.json(stats);
}
