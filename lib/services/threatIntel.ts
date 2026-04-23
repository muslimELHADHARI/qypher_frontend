import { ThreatIntelligenceResponse, ThreatIndicator } from "@/types/security";
import { loadAllEvents } from "./logReader";

// Standard private network ranges for internal categorization
function isPrivateIP(ip: string): boolean {
  return /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ip);
}

// Simple deterministic mapper for visual representation if real GeoIP is unavailable
function getMockGeo(ip: string) {
  if (isPrivateIP(ip)) return { country: "Internal", city: "Local Node", lat: 0, lng: 0 };
  
  // Deterministic "Geo" based on last octet for consistently styled UI
  const lastOctet = parseInt(ip.split('.').pop() || "0");
  const geos = [
    { country: "USA", city: "Ashburn", lat: 39.04, lng: -77.48 },
    { country: "Netherlands", city: "Amsterdam", lat: 52.36, lng: 4.90 },
    { country: "Germany", city: "Frankfurt", lat: 50.11, lng: 8.68 },
    { country: "Russia", city: "Moscow", lat: 55.75, lng: 37.61 },
    { country: "China", city: "Beijing", lat: 39.90, lng: 116.40 },
  ];
  return geos[lastOctet % geos.length];
}

export async function getThreatIntelligence(): Promise<ThreatIntelligenceResponse> {
  const events = await loadAllEvents();
  
  // Aggregate alerts by Source IP
  const ipMap = new Map<string, {
    alerts: string[];
    risk: number;
    lastSeen: string;
    firstSeen: string;
    severities: string[];
  }>();

  events.forEach(log => {
    if (log.src_ip === "N/A" || !log.src_ip) return;
    if (!ipMap.has(log.src_ip)) {
      ipMap.set(log.src_ip, {
        alerts: [],
        risk: 10,
        lastSeen: log.timestamp,
        firstSeen: log.timestamp,
        severities: []
      });
    }

    const entry = ipMap.get(log.src_ip)!;
    if (!entry.alerts.includes(log.attack_type)) entry.alerts.push(log.attack_type);
    entry.severities.push(log.severity);
    
    // Calculate risk
    let add = 0;
    if (log.severity === "CRITICAL") add = 40;
    else if (log.severity === "HIGH") add = 15;
    else if (log.severity === "MEDIUM") add = 5;
    
    entry.risk = Math.min(99, entry.risk + add);
    if (new Date(log.timestamp) > new Date(entry.lastSeen)) entry.lastSeen = log.timestamp;
    if (new Date(log.timestamp) < new Date(entry.firstSeen)) entry.firstSeen = log.timestamp;
  });

  const topThreats: ThreatIndicator[] = Array.from(ipMap.entries())
    .map(([ip, data], index) => ({
      id: `ti-live-${index}`,
      type: "IP" as const,
      value: ip,
      reputation: data.risk,
      firstSeen: data.firstSeen,
      lastSeen: data.lastSeen,
      source: "Local Intrusion Node",
      tags: data.alerts.map(a => a.toLowerCase().replace(/possbl /g, "")),
      geo: getMockGeo(ip)
    }))
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 10);

  // Geographic distribution summary
  const geoCounts = new Map<string, { count: number, lat: number, lng: number }>();
  topThreats.forEach(t => {
    if (!t.geo) return;
    const current = geoCounts.get(t.geo.country) || { count: 0, lat: t.geo.lat, lng: t.geo.lng };
    current.count += 1;
    geoCounts.set(t.geo.country, current);
  });

  return {
    topThreats,
    globalThreatCount: events.length,
    activeCampaigns: Array.from(new Set(events.map(l => l.attack_type))).length,
    reputationDistribution: [
      { range: "90-100", count: Array.from(ipMap.values()).filter(v => v.risk >= 90).length },
      { range: "75-89", count: Array.from(ipMap.values()).filter(v => v.risk >= 75 && v.risk < 90).length },
      { range: "50-74", count: Array.from(ipMap.values()).filter(v => v.risk >= 50 && v.risk < 75).length },
      { range: "0-49", count: Array.from(ipMap.values()).filter(v => v.risk < 50).length },
    ],
    geoDistribution: Array.from(geoCounts.entries()).map(([country, data]) => ({
      country,
      count: data.count,
      lat: data.lat,
      lng: data.lng
    }))
  };
}
