import fs from 'fs';
import path from 'path';

export interface SuricataAlert {
  timestamp: string;
  srcIp: string;
  destIp: string;
  protocol: string;
  alert: string;
  severity: number;
}

const LOG_PATH = path.join(process.cwd(), 'logs', 'suricata.log');

export function parseSuricataLogs(): SuricataAlert[] {
  try {
    if (!fs.existsSync(LOG_PATH)) return [];
    
    const content = fs.readFileSync(LOG_PATH, 'utf-8');
    const lines = content.split('\n');
    const alerts: SuricataAlert[] = [];

    lines.forEach(line => {
      if (!line.trim()) return;

      // regex to match: [timestamp] SURICATA | srcIp:port -> destIp:port | PROTO=proto | ALERT=alert | SEVERITY=sev
      const regex = /\[(.*?)\] SURICATA \| (.*?):.*? -> (.*?):.*? \| PROTO=(.*?) \| ALERT=(.*?) \| SEVERITY=(\d)/;
      const match = line.match(regex);

      if (match) {
        alerts.push({
          timestamp: match[1],
          srcIp: match[2],
          destIp: match[3],
          protocol: match[4],
          alert: match[5],
          severity: parseInt(match[6])
        });
      }
    });

    return alerts.reverse(); // Newest first
  } catch (err) {
    console.error('Error parsing Suricata logs:', err);
    return [];
  }
}
