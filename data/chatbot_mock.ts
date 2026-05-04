export interface LogEntry {
  id: number;
  timestamp: string;
  severity: "critical" | "high" | "medium" | "low" | string;
  source_ip: string;
  destination_ip: string;
  alert_message: string;
  _similarity_score?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "alert" | "code" | "table";
  logs?: LogEntry[];
  logs_retrieved?: number;
  log_context_used?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  unread?: number;
}

export const MOCK_SESSIONS: ChatSession[] = [
  {
    id: "s1",
    title: "Suspicious Port Scan Analysis",
    lastMessage: "The pattern indicates a SYN flood from 192.168.4.22",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    unread: 0,
  },
  {
    id: "s2",
    title: "QBER Anomaly Investigation",
    lastMessage: "Quantum bit error rate spiked to 14.3% — likely interception",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unread: 2,
  },
  {
    id: "s3",
    title: "Critical Alert Triage – 04/21",
    lastMessage: "Recommend isolating subnet 10.0.3.0/24 immediately",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unread: 0,
  },
];

export const MOCK_RESPONSES: Record<string, string> = {
  default:
    "I'm your Qypher SOC Assistant. I can help you analyze threats, interpret alerts, investigate incidents, and guide your response playbooks. What would you like to investigate?",
  hello:
    "Hello, analyst. All quantum channels are nominal. 3 active alerts in your queue — 1 critical, 2 high. How can I assist your investigation today?",
  threat:
    "Based on current telemetry, I've detected an elevated threat posture on your east perimeter. The pattern suggests a coordinated reconnaissance sweep targeting TCP ports 22, 80, 443 and 8080. Recommend enabling geo-block rules for AS14061 (DigitalOcean) until the pattern subsides.",
  alert:
    "Current alert summary:\n\n🔴 **CRITICAL** — Brute force SSH on node QSH-07 (47 attempts/min)\n🟠 **HIGH** — Unusual outbound traffic to 185.220.101.x (Tor exit node)\n🟡 **MEDIUM** — Certificate mismatch on TLS handshake at 10.0.2.15\n\nWhich alert do you want to drill into?",
  qber:
    "The QBER reading of 14.3% significantly exceeds the safe threshold of 11%. This strongly suggests an eavesdropping attempt (Eve) on your BB84 QKD channel. The affected session ID is QSH-SESSION-0x4A2F. I recommend:\n1. Abort the current key exchange\n2. Initiate privacy amplification\n3. Flag the endpoint for forensic analysis",
  ssh:
    "SSH brute force detected from 192.168.4.22. Attack vector: credential stuffing using Mirai-variant dictionary. Node QSH-07 has been automatically rate-limited. Recommend blocking the /24 subnet and reviewing `/var/log/auth.log` for lateral movement indicators.",
  block:
    "To block an IP, navigate to IP Management → Add Rule. You can also run:\n```\nqsh-cli firewall block 192.168.4.22 --reason 'SOC Investigation'\n```\nThe rule will propagate across all mesh nodes within ~30 seconds.",
  report:
    "Generating incident summary for the last 24 hours:\n\n• Total events processed: 14,382\n• Critical incidents: 2 (both acknowledged)\n• QBER anomalies: 1 (mitigated)\n• Blocked IPs: 7\n• Mean time to detect: 1m 42s\n• Mean time to respond: 8m 11s\n\nWould you like me to export this as a PDF report?",
  help:
    "I can assist with:\n\n🔍 **Threat Analysis** — Analyze suspicious IPs, patterns, and signatures\n🚨 **Alert Triage** — Prioritize and investigate active alerts\n⚛️ **Quantum Diagnostics** — Interpret QBER readings and QKD session health\n🛡️ **Response Playbooks** — Step-by-step incident response guidance\n📊 **Reports** — Generate shift summaries and compliance reports\n\nJust describe what you're investigating!",
};

export function getMockResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.match(/\b(hi|hello|hey|greet)/)) return MOCK_RESPONSES.hello;
  if (lower.match(/\bthreat|attack|malicious|suspicious/))
    return MOCK_RESPONSES.threat;
  if (lower.match(/\balert|incident|event/)) return MOCK_RESPONSES.alert;
  if (lower.match(/\bqber|quantum|bb84|interception|eavesdrop/))
    return MOCK_RESPONSES.qber;
  if (lower.match(/\bssh|brute.?force|credential/)) return MOCK_RESPONSES.ssh;
  if (lower.match(/\bblock|ban|firewall|rule/)) return MOCK_RESPONSES.block;
  if (lower.match(/\breport|summary|statistic|24.hour/))
    return MOCK_RESPONSES.report;
  if (lower.match(/\bhelp|what can you|capabilities/))
    return MOCK_RESPONSES.help;
  return MOCK_RESPONSES.default;
}
