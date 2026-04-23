import { loadAllEvents, loadAllQSHEvents } from "./logReader";
import { IPProfile, RiskLevel, EventSource } from "@/types/security";

// Simple persistent mock using an object in memory
// In production, this would be a real database
const ipStatusOverrides: Record<string, "monitored" | "blocked" | "whitelisted"> = {};

export function setIPStatus(ip: string, status: "monitored" | "blocked" | "whitelisted") {
  ipStatusOverrides[ip] = status;
}

export async function aggregateAllIPs(): Promise<IPProfile[]> {
  try {
    const res = await fetch("/api/ips/history");
    if (!res.ok) throw new Error("Failed to fetch historical IP data");
    
    const data = await res.json();
    const history: any[] = data.history || [];
    
    return history.map(item => {
      // Map SQLite fields to frontend IPProfile
      const blockedInfo = item.blocked_info || {};
      const stats = item.stats || { total_events: 0 };
      
      const riskLevel: RiskLevel = 
        item.max_severity === "CRITICAL" ? "CRITICAL" :
        item.max_severity === "HIGH" ? "HIGH" :
        item.max_severity === "MEDIUM" ? "MEDIUM" : "SAFE";

      return {
        ip: item.ip,
        sources: item.sources || [],
        firstSeen: item.first_seen || item.timestamp_blocked,
        lastSeen: item.last_seen || item.timestamp_blocked,
        totalEvents: stats.total_events || 0,
        riskLevel: riskLevel,
        status: blockedInfo.status === "active" ? "blocked" : "monitored",
        reasons: item.reasons || [blockedInfo.reason].filter(Boolean),
      };
    });
  } catch (err) {
    console.error("Aggregation error:", err);
    return [];
  }
}
