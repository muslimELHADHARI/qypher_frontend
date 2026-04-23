import { SecurityEvent, QSHEvent } from "@/types/security";
import {
  parseSuricataLine,
  parseMLLine,
  parseQSHLineToSecurityEvent,
  parseQSHLine
} from "./logReader";

import { getAutoBlockConfig } from "./autoBlockConfig";

const STREAM_URLS = {
  qsh: "http://192.168.100.104:8000/stream/qsh/raw",
  suricata: "http://192.168.100.104:8000/stream/suricata",
  ml: "http://192.168.100.104:8000/stream/ml-zeek"
};

const MAX_BUFFER_SIZE = 1000;

class StreamManager {
  private eventsBuffer: SecurityEvent[] = [];
  private qshBuffer: QSHEvent[] = [];
  private listeners: Set<(event: SecurityEvent) => void> = new Set();
  private activeStreams: Record<string, AbortController | null> = {
    qsh: null,
    suricata: null,
    ml: null
  };

  constructor() {
    if (typeof window === "undefined") {
      this.initAll();
    }
  }

  private async initAll() {
    console.log("[StreamManager] Initializing network telemetry streams...");
    this.connect("qsh", STREAM_URLS.qsh, this.handleQshLine.bind(this));
    this.connect("suricata", STREAM_URLS.suricata, this.handleSuricataLine.bind(this));
    this.connect("ml", STREAM_URLS.ml, this.handleMLLine.bind(this));
  }

  private async connect(name: string, url: string, handler: (line: string) => void) {
    if (this.activeStreams[name]) {
      this.activeStreams[name]?.abort();
    }

    const controller = new AbortController();
    this.activeStreams[name] = controller;

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.body) throw new Error(`[StreamManager] No body for ${name}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) handler(line);
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error(`[StreamManager] Stream ${name} failed:`, err.message);
        // Reconnect after 5 seconds
        setTimeout(() => this.connect(name, url, handler), 5000);
      }
    }
  }

  private handleSuricataLine(line: string) {
    try {
      // The user mentioned Suricata is parsed JSON
      const data = JSON.parse(line);
      // We still use our parser but it might need to handle object vs string
      const event = this.mapJsonToSecurityEvent(data, "suricata");
      if (event) this.pushEvent(event);
    } catch {
      // Fallback to raw parsing if it's not JSON
      const event = parseSuricataLine(line);
      if (event) this.pushEvent(event);
    }
  }

  private handleMLLine(line: string) {
    const event = parseMLLine(line);
    if (event) this.pushEvent(event);
  }

  private handleQshLine(line: string) {
    // Standard security stream
    const event = parseQSHLineToSecurityEvent(line);
    if (event) this.pushEvent(event);

    // Also update QSH specific buffer for the QSH monitor
    const qshEvent = parseQSHLine(line);
    if (qshEvent) {
      this.qshBuffer.unshift(qshEvent);
      if (this.qshBuffer.length > MAX_BUFFER_SIZE) this.qshBuffer.pop();
    }
  }

  private mapJsonToSecurityEvent(data: any, source: string): SecurityEvent | null {
    // If the API already sends a format close to our SecurityEvent, use it
    // Otherwise, we'll need a specific mapper for the 192.168.100.104 JSON format
    // For now, let's assume it's the raw log line inside a JSON or we try to reconstruct
    if (data.alert || data.timestamp) {
      return {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: data.timestamp || new Date().toISOString(),
        source: "suricata",
        src_ip: data.src_ip || "0.0.0.0",
        dst_ip: data.dest_ip || "0.0.0.0",
        src_port: data.src_port?.toString(),
        dst_port: data.dest_port?.toString(),
        protocol: data.proto,
        attack_type: data.alert?.signature || data.alert || "Unknown Alert",
        severity: this.mapSeverity(data.alert?.severity || 3),
        raw: JSON.stringify(data)
      };
    }
    return null;
  }

  private mapSeverity(sev: number): any {
    if (sev <= 1) return "CRITICAL";
    if (sev === 2) return "HIGH";
    if (sev === 3) return "MEDIUM";
    return "LOW";
  }

  private async checkAutoBlock(event: SecurityEvent) {
    const config = getAutoBlockConfig();
    if (!config.enabled) return;

    // Severity check: HIGH (2) or CRITICAL (1)
    const severityValues: Record<string, number> = { "CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4 };
    const eventSev = severityValues[event.severity] || 5;
    const thresholdSev = severityValues[config.minSeverity] || 2;

    if (eventSev <= thresholdSev && event.src_ip && event.src_ip !== "0.0.0.0") {
      // Avoid auto-blocking internal/QSH events to prevent lockout
      if (event.source === "qsh") return;

      console.log(`[AutoBlock] Triggering block for ${event.src_ip} due to ${event.attack_type}`);

      try {
        const res = await fetch(`http://192.168.100.104:8000/ips/block?ip=${event.src_ip}&reason=[Autonomous] ${event.attack_type}`, {
          method: "POST"
        });

        if (res.ok) {
          // Push a pseudo-event into the stream for the Toast notification
          const systemNotification: SecurityEvent = {
            id: `sys-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "system",
            src_ip: event.src_ip,
            dst_ip: "FIREWALL",
            attack_type: `AUTONOMOUS BLOCK: ${event.src_ip}`,
            severity: "HIGH",
            raw: `Automated mitigation triggered by ${event.attack_type}`
          };
          this.pushEvent(systemNotification);
        }
      } catch (err) {
        console.error("[AutoBlock] Failed to trigger remote block:", err);
      }
    }
  }

  private pushEvent(event: SecurityEvent) {
    this.eventsBuffer.unshift(event);
    if (this.eventsBuffer.length > MAX_BUFFER_SIZE) this.eventsBuffer.pop();

    // Check auto-block logic for standard security events (avoid recursion for system notifications)
    if (event.source !== "system") {
      this.checkAutoBlock(event);
    }

    this.listeners.forEach(l => l(event));
  }

  public subscribe(callback: (event: SecurityEvent) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public getEventsBuffer() {
    return [...this.eventsBuffer];
  }

  public getQshBuffer() {
    return [...this.qshBuffer];
  }
}

// Global singleton to persist across HMR in dev
const globalSymbols = Symbol.for("qypher.streamManager");
let streamManager: StreamManager;

if (!(global as any)[globalSymbols]) {
  (global as any)[globalSymbols] = new StreamManager();
}
streamManager = (global as any)[globalSymbols];

export default streamManager;
