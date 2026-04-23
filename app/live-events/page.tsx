"use client";

import { useSSEEvents } from "@/hooks/useSSEEvents";
import { useStats } from "@/hooks/useStats";
import LiveEventFeed from "@/components/LiveEventFeed";
import { useState, useMemo } from "react";
import { SecurityEvent, SeverityLevel, EventSource } from "@/types/security";
import { Search, Filter, X } from "lucide-react";

export default function LiveEventsPage() {
  const { stats } = useStats(8000);
  const { events: sseEvents, connected } = useSSEEvents(500);

  // Historical events loaded on mount
  const [historicalEvents, setHistoricalEvents] = useState<SecurityEvent[]>([]);
  const [loadedHistory, setLoadedHistory] = useState(false);

  // Filters
  const [ipFilter, setIpFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<EventSource | "ALL">("ALL");
  const [attackFilter, setAttackFilter] = useState("");

  // Load historical events once
  if (!loadedHistory) {
    fetch("/api/stats")
      .then(() => {
        // We'll use the SSE events as they come in; historical = preloaded from log files
        setLoadedHistory(true);
      })
      .catch(() => setLoadedHistory(true));
  }

  // Merge and filter
  const allEvents = useMemo(() => {
    let combined = [...sseEvents, ...historicalEvents];

    if (ipFilter) {
      combined = combined.filter(
        (e) =>
          e.src_ip.includes(ipFilter) || e.dst_ip.includes(ipFilter)
      );
    }
    if (severityFilter !== "ALL") {
      combined = combined.filter((e) => e.severity === severityFilter);
    }
    if (sourceFilter !== "ALL") {
      combined = combined.filter((e) => e.source === sourceFilter);
    }
    if (attackFilter) {
      combined = combined.filter((e) =>
        e.attack_type.toLowerCase().includes(attackFilter.toLowerCase())
      );
    }

    return combined;
  }, [sseEvents, historicalEvents, ipFilter, severityFilter, sourceFilter, attackFilter]);

  const hasFilters = ipFilter || severityFilter !== "ALL" || sourceFilter !== "ALL" || attackFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Events</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Unified real-time security event stream
        </p>
      </div>

      {/* Filters */}
      <div className="enterprise-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-muted-foreground" />
          <span className="text-xs font-black text-foreground uppercase tracking-widest">
            Filters
          </span>
          {hasFilters && (
            <button
              onClick={() => {
                setIpFilter("");
                setSeverityFilter("ALL");
                setSourceFilter("ALL");
                setAttackFilter("");
              }}
              className="ml-auto flex items-center gap-1 text-[10px] text-[#ff2d55] hover:text-[#ff5a7a] transition-colors"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* IP Filter */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
              placeholder="Filter by IP..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-background border border-border text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Attack type filter */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={attackFilter}
              onChange={(e) => setAttackFilter(e.target.value)}
              placeholder="Filter by attack type..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-background border border-border text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SeverityLevel | "ALL")}
            className="w-full px-3 py-2 rounded-lg text-xs bg-background border border-border text-foreground focus:border-primary focus:outline-none transition-colors"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Source filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as EventSource | "ALL")}
            className="w-full px-3 py-2 rounded-lg text-xs bg-background border border-border text-foreground focus:border-primary focus:outline-none transition-colors"
          >
            <option value="ALL">All Sources</option>
            <option value="suricata">Suricata</option>
            <option value="ml">ML / Zeek</option>
            <option value="qsh">QSH / Quantum</option>
          </select>
        </div>
      </div>

      {/* Events */}
      <LiveEventFeed events={allEvents} maxItems={100} connected={connected} />
    </div>
  );
}
