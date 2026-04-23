export type SeverityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type EventSource = "suricata" | "ml" | "qsh" | "system";

export interface SecurityEvent {
  id: string;
  timestamp: string;
  source: EventSource;
  src_ip: string;
  dst_ip: string;
  src_port?: string;
  dst_port?: string;
  protocol?: string;
  attack_type: string;
  severity: SeverityLevel;
  confidence?: number;
  uid?: string;
  action?: string;
  raw: string;
}

export interface StatsResponse {
  totalEvents: number;
  activeThreats: number;
  criticalAlerts: number;
  attacksPerMinute: number;
  severityDistribution: {
    name: SeverityLevel;
    value: number;
  }[];
  topSourceIPs: {
    ip: string;
    count: number;
  }[];
  topDestIPs: {
    ip: string;
    count: number;
  }[];
  attackTypes: {
    name: string;
    count: number;
  }[];
  timeline: {
    time: string;
    count: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }[];
  historicalEvents?: SecurityEvent[];
}

export interface QSHEvent {
  id: string;
  timestamp: string;
  source: "qsh";
  category: "qkd" | "server";
  event: string;
  session?: string;
  client?: string;
  action?: string;
  command?: string;
  qber?: number;
  sifted_bits?: number;
  sifted_rate?: number;
  raw: string;
}

export interface QSHStatsResponse {
  totalEvents: number;
  activeSessions: number;
  totalHandshakes: number;
  avgQber: number;
  totalCommands: number;
  qberTimeline: {
    time: string;
    qber: number;
    sifted_rate: number;
  }[];
  activityTimeline: {
    time: string;
    count: number;
  }[];
  recentEvents: QSHEvent[];
  clients: {
    ip: string;
    handshakes: number;
    commands: number;
  }[];
}

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE";
export type IPStatus = "monitored" | "blocked" | "whitelisted";

export interface IPProfile {
  ip: string;
  sources: EventSource[];
  firstSeen: string;
  lastSeen: string;
  totalEvents: number;
  riskLevel: RiskLevel;
  status: IPStatus;
  reasons: string[];
}

export interface ThreatIndicator {
  id: string;
  type: "IP" | "DOMAIN" | "HASH";
  value: string;
  reputation: number; // 0-100
  firstSeen: string;
  lastSeen: string;
  source: string;
  tags: string[];
  geo?: {
    country: string;
    city?: string;
    lat: number;
    lng: number;
  };
}

export interface ThreatIntelligenceResponse {
  topThreats: ThreatIndicator[];
  globalThreatCount: number;
  activeCampaigns: number;
  reputationDistribution: { range: string; count: number }[];
  geoDistribution: { country: string; count: number; lat: number; lng: number }[];
}

