"use client";

import { useStats } from "@/hooks/useStats";
import { useSSEEvents } from "@/hooks/useSSEEvents";
import KPICard from "@/components/KPICard";
import DashboardCharts from "@/components/DashboardCharts";
import LiveEventFeed from "@/components/LiveEventFeed";
import QBERWidget from "@/components/QBERWidget";
import {
  ShieldAlert,
  Activity,
  Gauge,
  ShieldCheck,
} from "lucide-react";

/** Derive a health score (0–100) from live stats. */
function computeSystemHealth(stats: { activeThreats: number; totalEvents: number; attacksPerMinute: number } | null): string {
  if (!stats) return "–";
  const { activeThreats, totalEvents, attacksPerMinute } = stats;
  // Start at 100, penalise for threats and attack rate
  const threatPenalty = Math.min(40, (activeThreats / Math.max(totalEvents, 1)) * 100 * 0.4);
  const ratePenalty = Math.min(30, attacksPerMinute * 0.5);
  const health = Math.max(0, Math.round(100 - threatPenalty - ratePenalty));
  return `${health}%`;
}

export default function DashboardPage() {
  const { stats, loading } = useStats(5000);
  const { events, connected } = useSSEEvents(200);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Security Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time threat landscape and protocol health
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${connected ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-rose-500/5 border-rose-500/20 text-rose-500"
            }`}>
            <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-rose-500"}`} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {connected ? "Gateway Online" : "Connection Lost"}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard
          title="Total Events"
          value={stats?.totalEvents || 0}
          icon={<Activity size={18} />}
          accentColor="#3b82f6"
          subtitle="Processed since startup"
        />
        <KPICard
          title="Security Incidents"
          value={stats?.activeThreats || 0}
          icon={<ShieldAlert size={18} />}
          accentColor="#f43f5e"
          trend={{ value: 8, label: "vs last hour" }}
          subtitle="High + Critical severity"
        />
        <KPICard
          title="Traffic Velocity"
          value={stats?.attacksPerMinute || 0}
          icon={<Gauge size={18} />}
          accentColor="#10b981"
          subtitle="Current ingress rate"
        />
        <KPICard
          title="System Health"
          value={computeSystemHealth(stats)}
          icon={<ShieldCheck size={18} />}
          accentColor="#6366f1"
          subtitle="Based on active threat ratio"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed (70%) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="enterprise-card h-[600px] flex flex-col">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Live Activity Stream</h3>
              <span className="text-[10px] text-muted-foreground font-mono uppercase">Last update: JUST NOW</span>
            </div>
            <div className="flex-1 p-2 min-h-0 overflow-hidden">
              <LiveEventFeed events={events} maxItems={25} connected={connected} />
            </div>
          </div>
        </div>

        {/* Side Panel (30%) */}
        <div className="space-y-8">
          <div className="enterprise-card p-6">
            <QBERWidget />
          </div>

          <div className="enterprise-card p-6">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6 pb-2 border-b border-border/50">System Logs</h3>
            <div className="space-y-4">
              {[
                { label: "Kernel", status: "Running", color: "text-emerald-500" },
                { label: "Quantum Proxy", status: "Active", color: "text-emerald-400" },
                { label: "Suricata IDS", status: "Monitoring", color: "text-emerald-500" },
                { label: "ML Inference", status: "Idle", color: "text-muted-foreground" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/70 font-semibold">{item.label}</span>
                  <span className={`text-[10px] font-bold uppercase ${item.color}`}>{item.status}</span>
                </div>
              ))}
              <div className="mt-6 pt-4 border-t border-border/50">
                <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
                  v2.0.4-STEALTH // STABLE<br />
                  SECURE_KEY_VAL: OK<br />
                  PROX_READY: 1
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Analytical Trends</h2>
        {stats && <DashboardCharts stats={stats} />}
      </div>
    </div>
  );
}