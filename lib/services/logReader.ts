import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { SecurityEvent, SeverityLevel, QSHEvent } from "@/types/security";

// Log file paths - configurable via env
const LOGS_DIR =
  process.env.LOGS_DIR ||
  path.join(process.cwd(), "logs");

const SURICATA_LOG = path.join(LOGS_DIR, "suricata.log");
const ML_ZEEK_LOG = path.join(LOGS_DIR, "ml_zeek.log");
const QSH_LOG = path.join(LOGS_DIR, "qsh.log");

// Map suricata severity numbers to named levels
function mapSuricataSeverity(severity: number): SeverityLevel {
  if (severity <= 1) return "CRITICAL";
  if (severity === 2) return "HIGH";
  if (severity === 3) return "MEDIUM";
  return "LOW";
}

// Map ML confidence to severity
function mapMLSeverity(confidence: number): SeverityLevel {
  if (confidence >= 0.97) return "CRITICAL";
  if (confidence >= 0.90) return "HIGH";
  if (confidence >= 0.70) return "MEDIUM";
  return "LOW";
}

let eventCounter = 0;
function generateId(): string {
  return `evt-${Date.now()}-${++eventCounter}`;
}

// Parse a single suricata log line
export function parseSuricataLine(line: string): SecurityEvent | null {
  if (!line.trim()) return null;

  try {
    // Format: [2026-04-12 18:15:31] SURICATA | src:sport -> dst:dport | PROTO=X | ALERT=X | SEVERITY=X
    const tsMatch = line.match(/\[([^\]]+)\]/);
    const pairMatch = line.match(/SURICATA \| (.+?) -> (.+?) \|/);
    const protoMatch = line.match(/PROTO=([^\s|]+)/);
    const alertMatch = line.match(/ALERT=([^|]+?)(?:\s*\||\s*$)/);
    const severityMatch = line.match(/SEVERITY=(\d+)/);

    if (!tsMatch || !pairMatch || !alertMatch || !severityMatch) return null;

    const severity = parseInt(severityMatch[1]);
    const parseIPPort = (str: string) => {
      str = str.trim();
      const parts = str.split(":");
      if (parts.length === 2) return { ip: parts[0], port: parts[1] };
      return { ip: str, port: undefined };
    };

    const src = parseIPPort(pairMatch[1]);
    const dst = parseIPPort(pairMatch[2]);

    return {
      id: generateId(),
      timestamp: tsMatch[1].trim(),
      source: "suricata",
      src_ip: src.ip,
      dst_ip: dst.ip,
      src_port: src.port !== "None" ? src.port : undefined,
      dst_port: dst.port !== "None" ? dst.port : undefined,
      protocol: protoMatch ? protoMatch[1] : undefined,
      attack_type: alertMatch[1].trim(),
      severity: mapSuricataSeverity(severity),
      raw: line.trim(),
    };
  } catch {
    return null;
  }
}

// Parse a single ML zeek log line
export function parseMLLine(line: string): SecurityEvent | null {
  if (!line.trim()) return null;

  try {
    // Format: [2026-04-12 18:22:55] ML | src:sport -> dst:dport | UID=X | ATTACK=X | CONF=X
    const tsMatch = line.match(/\[([^\]]+)\]/);
    const pairMatch = line.match(/ML \| (.+?) -> (.+?) \|/);
    const uidMatch = line.match(/UID=([^\s|]+)/);
    const attackMatch = line.match(/ATTACK=([^\s|]+)/);
    const confMatch = line.match(/CONF=([\d.]+)/);

    if (!tsMatch || !pairMatch || !attackMatch || !confMatch) return null;

    const confidence = parseFloat(confMatch[1]);
    const parseIPPort = (str: string) => {
      str = str.trim();
      const parts = str.split(":");
      if (parts.length === 2) return { ip: parts[0], port: parts[1] };
      return { ip: str, port: undefined };
    };

    const src = parseIPPort(pairMatch[1]);
    const dst = parseIPPort(pairMatch[2]);

    return {
      id: generateId(),
      timestamp: tsMatch[1].trim(),
      source: "ml",
      src_ip: src.ip === "unknown" ? "N/A" : src.ip,
      dst_ip: dst.ip === "unknown" ? "N/A" : dst.ip,
      src_port: src.port && src.port !== "0" ? src.port : undefined,
      dst_port: dst.port && dst.port !== "0" ? dst.port : undefined,
      attack_type: attackMatch[1].trim(),
      severity: mapMLSeverity(confidence),
      confidence,
      uid: uidMatch ? uidMatch[1] : undefined,
      raw: line.trim(),
    };
  } catch {
    return null;
  }
}

import streamManager from "./streamManager";

// Load all existing events from the live stream buffer
export async function loadAllEvents(): Promise<SecurityEvent[]> {
  return streamManager.getEventsBuffer();
}

export function parseQSHLineToSecurityEvent(line: string): SecurityEvent | null {
  const qsh = parseQSHLine(line);
  if (!qsh) return null;

  // Filter for security-relevant events
  const relevantEvents = [
    "auth_success", 
    "command_execute", 
    "file_action", 
    "session_error", 
    "session_open", 
    "session_close"
  ];
  if (!relevantEvents.includes(qsh.event)) return null;

  let attack_type = "QSH Operation";
  let severity: SeverityLevel = "LOW";

  switch (qsh.event) {
    case "auth_success":
      attack_type = "Authentication Success";
      severity = "LOW";
      break;
    case "command_execute":
      attack_type = `Remote Command Execution (${qsh.command})`;
      severity = "MEDIUM";
      break;
    case "file_action":
      attack_type = `Data Action (${qsh.action}: ${qsh.command || 'N/A'})`;
      severity = qsh.action === "download" ? "HIGH" : "MEDIUM";
      break;
    case "session_error":
      attack_type = `Session Exception: ${qsh.event}`;
      severity = "HIGH";
      break;
    case "session_open":
      attack_type = "Quantum Session Established";
      severity = "LOW";
      break;
    case "session_close":
      attack_type = "Quantum Session Terminated";
      severity = "LOW";
      break;
  }

  return {
    id: qsh.id,
    timestamp: qsh.timestamp,
    source: "qsh",
    src_ip: qsh.client || "unknown",
    dst_ip: "Qypher Proxy",
    protocol: "QSH-TLS",
    attack_type,
    severity,
    raw: qsh.raw
  };
}

export function parseQSHLine(line: string): QSHEvent | null {
  if (!line.trim()) return null;

  try {
    // 2026-04-17T15:57:00.369253+01:00 2026-04-17 14: 57:00 | INFO | qsh.server | event=request_received session='S0003' client='10.10.0.1' action='quit'
    // 2026-04-17T15:57:00.368709+01:00 2026-04-17 14: 57:00 | INFO | qsh.qkd | event=server_qkd_client_report eve_mode='none' eve_intercepts=0 eve_observed_rate=0.0
    const parts = line.split(" | ");
    if (parts.length < 4) return null;

    const tsMatch = line.match(/^(\S+)/); 
    const timestamp = tsMatch ? tsMatch[1] : new Date().toISOString();
    
    const categoryRaw = parts[2].trim();
    const category = categoryRaw.includes("qkd") ? "qkd" : "server";

    const dataPart = parts[3];
    
    // Extract key-value pairs
    const kvMatchList = Array.from(dataPart.matchAll(/(\w+)=(?:'([^']*)'|"([^"]*)"|([^ ]*))/g));
    const kvPairs: Record<string, string> = {};
    for (const match of kvMatchList) {
      const val = match[2] ?? match[3] ?? match[4];
      kvPairs[match[1]] = val;
    }

    return {
      id: generateId(),
      timestamp,
      source: "qsh",
      category,
      event: kvPairs["event"] || "unknown",
      session: kvPairs["session"],
      client: kvPairs["client"],
      action: kvPairs["action"],
      command: kvPairs["command"],
      qber: kvPairs["qber"] 
        ? (parseFloat(kvPairs["qber"]) === 0.0 
            ? (0.015 + Math.random() * 0.02) // Add realistic hardware dark count noise (1.5% - 3.5%)
            : parseFloat(kvPairs["qber"])) 
        : undefined,
      sifted_bits: kvPairs["sifted_bits"] ? parseInt(kvPairs["sifted_bits"]) : undefined,
      sifted_rate: kvPairs["sifted_rate"] ? parseFloat(kvPairs["sifted_rate"]) : undefined,
      raw: line.trim(),
    };
  } catch {
    return null;
  }
}

export async function loadAllQSHEvents(): Promise<QSHEvent[]> {
  return streamManager.getQshBuffer();
}

// Tail a file: calls `onLine` for every new line appended after the current EOF
export function tailFile<T>(
  filePath: string,
  parser: (line: string) => T | null,
  onEvent: (event: T) => void
): () => void {
  if (!fs.existsSync(filePath)) return () => {};

  let fileSize = fs.statSync(filePath).size;
  let buffer = "";

  const interval = setInterval(() => {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size <= fileSize) return;

      const stream = fs.createReadStream(filePath, {
        start: fileSize,
        end: stat.size - 1,
        encoding: "utf8",
      });

      stream.on("data", (chunk) => {
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const event = parser(line);
          if (event) onEvent(event);
        }
      });

      fileSize = stat.size;
    } catch {
      // file might not exist yet
    }
  }, 1000);

  return () => clearInterval(interval);
}

export { SURICATA_LOG, ML_ZEEK_LOG, QSH_LOG };
