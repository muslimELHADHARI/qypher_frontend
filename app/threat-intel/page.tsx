"use client";

import { useEffect, useState, useMemo } from "react";
import { ThreatIntelligenceResponse, ThreatIndicator } from "@/types/security";
import {
  Shield,
  Globe,
  Database,
  Radio,
  Search,
  MapPin,
  Activity,
  TrendingUp,
  AlertTriangle,
  Wifi,
} from "lucide-react";
import { useSSEEvents } from "@/hooks/useSSEEvents";
import TacticalRadar from "@/components/TacticalRadar";
import ThreatHeatGrid from "@/components/ThreatHeatGrid";
import { truncateIP, formatTime } from "@/lib/format";

/** Severity badge colour derived from reputation score */
function reputationBadge(score: number) {
  if (score >= 90) return { label: "Critical", cls: "bg-rose-500/10 text-rose-500 border-rose-500/20" };
  if (score >= 70) return { label: "High", cls: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
  if (score >= 40) return { label: "Medium", cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
  return { label: "Low", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
}

export default function ThreatIntelPage() {
  const [intel, setIntel] = useState<ThreatIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { events } = useSSEEvents();

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        const res = await fetch("/api/threat-intel");
        if (res.ok) setIntel(await res.json());
      } finally {
        setLoading(false);
      }
    };
    fetchIntel();
    const interval = setInterval(fetchIntel, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredThreats = useMemo(() => {
    if (!intel) return [];
    const q = search.toLowerCase();
    return intel.topThreats.filter(
      (t) => t.value.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [intel, search]);

  if (loading || !intel) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="animate-spin text-primary" size={28} />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Loading threat intelligence data…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Threat Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Indicators of compromise, geo distribution and live event feed
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-emerald-500/5 border-emerald-500/20 text-emerald-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider">Live Feed Active</span>
        </div>
      </div>

      {/* ── Summary KPI row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Indicators",
            value: intel.topThreats.length,
            icon: <Database size={16} />,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Active Campaigns",
            value: intel.activeCampaigns,
            icon: <Radio size={16} />,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
          },
          {
            label: "Global Threat Count",
            value: intel.globalThreatCount,
            icon: <Globe size={16} />,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            label: "Live Events (stream)",
            value: events.length,
            icon: <Wifi size={16} />,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
        ].map((item) => (
          <div key={item.label} className="enterprise-card p-5 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>{item.icon}</div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
              <p className="text-xl font-bold tabular-nums text-foreground mt-0.5">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main two-column layout ───────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-6">

        {/* Left column (75%) */}
        <div className="flex-1 space-y-6">

          {/* Attack radar + geo heatmap */}
          <div className="enterprise-card p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Shield size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Attack Pattern Radar</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Real-time protocol and attack-type distribution
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* Radar */}
              <div className="max-w-xs mx-auto w-full">
                <TacticalRadar events={events} />
              </div>

              {/* Geo heatmap + stats */}
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Geographic Origin Distribution
                  </p>
                  <ThreatHeatGrid data={intel.geoDistribution} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Avg. Detection Latency
                    </p>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      0.02<span className="text-xs ml-1 text-muted-foreground font-medium">ms</span>
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Reputation Diversity
                    </p>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      0.14<span className="text-xs ml-1 text-muted-foreground font-medium">index</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* IOC Table */}
          <div className="enterprise-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Database size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Indicators of Compromise (IOCs)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {filteredThreats.length} indicator{filteredThreats.length !== 1 ? "s" : ""} matched
                  </p>
                </div>
              </div>
              <div className="relative w-72">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by IP, domain, or tag…"
                  className="w-full pl-9 pr-4 py-2.5 bg-card border border-border text-xs text-foreground placeholder-muted-foreground/40 focus:border-primary/40 outline-none rounded-lg transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Indicator
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Reputation Score
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Country
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Tags
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredThreats.map((threat) => {
                    const badge = reputationBadge(threat.reputation);
                    return (
                      <tr
                        key={threat.id}
                        className="hover:bg-primary/[0.03] transition-colors"
                      >
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {threat.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs font-medium text-foreground/80">
                          {truncateIP(threat.value)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${threat.reputation}%`,
                                  backgroundColor:
                                    threat.reputation >= 90
                                      ? "var(--severity-critical, #f43f5e)"
                                      : threat.reputation >= 70
                                      ? "#f97316"
                                      : "#eab308",
                                }}
                              />
                            </div>
                            <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
                              {threat.reputation}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin size={11} className="opacity-50 shrink-0" />
                            {threat.geo?.country || "Unknown"}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {threat.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] uppercase font-semibold px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredThreats.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                        No indicators match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right sidebar (25%) */}
        <div className="w-full xl:w-80 flex flex-col gap-6">

          {/* Live event log */}
          <div className="enterprise-card flex flex-col min-h-[420px]">
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity size={14} className="text-primary" />
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Live Event Log
                </h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {events.length} events
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px] custom-scrollbar">
              {events.slice(0, 30).map((evt, i) => (
                <div
                  key={i}
                  className="flex gap-2 py-1.5 border-l-2 border-transparent hover:border-primary/50 hover:bg-primary/5 pl-2 transition-all"
                >
                  <span className="text-muted-foreground/50 shrink-0">
                    [{formatTime(evt.timestamp)}]
                  </span>
                  <span className="text-primary/80 shrink-0">{truncateIP(evt.src_ip)}</span>
                  <span className="text-foreground/60 truncate">{evt.attack_type}</span>
                </div>
              ))}
              {events.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/30">
                  <Wifi size={28} />
                  <p className="text-[10px] uppercase tracking-widest text-center">
                    Awaiting events…
                  </p>
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-border/50 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-medium text-muted-foreground">
                Stream connected
              </span>
            </div>
          </div>

          {/* Reputation distribution */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-2.5 mb-5">
              <TrendingUp size={14} className="text-primary" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Reputation Breakdown
              </h3>
            </div>
            <div className="space-y-4">
              {intel.reputationDistribution.map((item) => (
                <div key={item.range} className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-muted-foreground">Score {item.range}</span>
                    <span className="text-foreground tabular-nums">{item.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full"
                      style={{ width: `${Math.min(100, (item.count / 100) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active campaigns */}
          <div className="enterprise-card p-5 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Active Threat Campaigns
              </p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {intel.activeCampaigns}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
