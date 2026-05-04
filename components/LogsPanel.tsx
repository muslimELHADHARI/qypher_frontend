import { ChevronDown, ShieldAlert, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useState } from "react";

export interface LogEntry {
    id: number;
    timestamp: string;
    severity: "critical" | "high" | "medium" | "low" | string;
    source_ip: string;
    destination_ip: string;
    alert_message: string;
    _similarity_score?: number;
}

interface LogsPanelProps {
    logs: LogEntry[];
    isLoading?: boolean;
}

const severityConfig = {
    critical: { color: "text-destructive", bg: "bg-destructive/10", icon: ShieldAlert, label: "CRITICAL" },
    high: { color: "text-orange-500", bg: "bg-orange-500/10", icon: AlertTriangle, label: "HIGH" },
    medium: { color: "text-yellow-500", bg: "bg-yellow-500/10", icon: AlertCircle, label: "MEDIUM" },
    low: { color: "text-blue-500", bg: "bg-blue-500/10", icon: Info, label: "LOW" },
};

export function LogsPanel({ logs, isLoading = false }: LogsPanelProps) {
    const [expanded, setExpanded] = useState(true);

    if (!logs || logs.length === 0) return null;

    const severityCounts = logs.reduce(
        (acc, log) => {
            acc[log.severity] = (acc[log.severity] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    return (
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                        Retrieved Logs ({logs.length})
                    </span>
                    <div className="flex gap-1 ml-2">
                        {Object.entries(severityCounts).map(([severity, count]) => {
                            const config = severityConfig[severity as keyof typeof severityConfig];
                            if (!config) return null;
                            return (
                                <span
                                    key={severity}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${config.bg} ${config.color}`}
                                >
                                    {config.label} ({count})
                                </span>
                            );
                        })}
                    </div>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-muted-foreground/60 transition-transform ${expanded ? "rotate-0" : "-rotate-90"
                        }`}
                />
            </button>

            {/* Logs list */}
            {expanded && (
                <div className="border-t border-border/50 divide-y divide-border/50 max-h-96 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="px-4 py-4 flex items-center justify-center text-sm text-muted-foreground">
                            Loading logs...
                        </div>
                    ) : (
                        logs.map((log) => {
                            const config = severityConfig[log.severity as keyof typeof severityConfig] || severityConfig.low;
                            const Icon = config.icon;
                            return (
                                <div key={log.id} className="px-4 py-3 hover:bg-secondary/20 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`flex-shrink-0 rounded p-1 ${config.bg}`}>
                                            <Icon size={14} className={config.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {/* Timestamp & Severity */}
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="text-xs text-muted-foreground/70">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </span>
                                                {log._similarity_score && (
                                                    <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded">
                                                        Match: {(log._similarity_score * 100).toFixed(0)}%
                                                    </span>
                                                )}
                                            </div>

                                            {/* Alert message */}
                                            <p className="text-sm text-foreground font-medium mb-2 line-clamp-2">
                                                {log.alert_message}
                                            </p>

                                            {/* IPs */}
                                            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                                                <span>
                                                    <span className="font-semibold">Source:</span>{" "}
                                                    <code className="bg-secondary/50 px-1.5 py-0.5 rounded text-primary">
                                                        {log.source_ip}
                                                    </code>
                                                </span>
                                                <span>
                                                    <span className="font-semibold">Dest:</span>{" "}
                                                    <code className="bg-secondary/50 px-1.5 py-0.5 rounded text-primary">
                                                        {log.destination_ip}
                                                    </code>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
