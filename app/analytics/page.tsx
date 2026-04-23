"use client";

import { useStats } from "@/hooks/useStats";
import {
  TimelineChart,
  SeverityPieChart,
  TopAttackersChart,
  AttackTypesChart,
} from "@/components/DashboardCharts";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const { stats, loading } = useStats(8000);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">Analytics</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Loading analytics data...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glow-card rounded-xl h-[300px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0]">Analytics</h1>
        <p className="text-sm text-[#64748b] mt-0.5">
          Deep dive into security telemetry
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Events",
            value: stats.totalEvents.toLocaleString(),
            color: "#00d4ff",
          },
          {
            label: "Unique Source IPs",
            value: stats.topSourceIPs.length.toString(),
            color: "#7b61ff",
          },
          {
            label: "Attack Types",
            value: stats.attackTypes.length.toString(),
            color: "#ff9500",
          },
          {
            label: "Critical Rate",
            value:
              stats.totalEvents > 0
                ? `${((stats.criticalAlerts / stats.totalEvents) * 100).toFixed(1)}%`
                : "0%",
            color: "#ff2d55",
          },
        ].map((item) => (
          <div key={item.label} className="glow-card rounded-xl p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1">
              {item.label}
            </p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: item.color }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TimelineChart data={stats.timeline} />
        <SeverityPieChart data={stats.severityDistribution} />
        <TopAttackersChart data={stats.topSourceIPs} />
        <AttackTypesChart data={stats.attackTypes} />
      </div>

      {/* Top Destination IPs table */}
      <div className="glow-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4">
          Top Destination IPs (targets)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#64748b] uppercase tracking-wider border-b border-[rgba(30,58,95,0.4)]">
                <th className="text-left py-2 px-3">#</th>
                <th className="text-left py-2 px-3">IP Address</th>
                <th className="text-left py-2 px-3">Hits</th>
                <th className="text-left py-2 px-3">% of Total</th>
                <th className="text-left py-2 px-3">Visualization</th>
              </tr>
            </thead>
            <tbody>
              {stats.topDestIPs.map((entry, idx) => {
                const pct = stats.totalEvents > 0 ? (entry.count / stats.totalEvents) * 100 : 0;
                return (
                  <tr
                    key={entry.ip}
                    className="border-b border-[rgba(30,58,95,0.2)] hover:bg-[rgba(15,40,71,0.3)] transition-colors"
                  >
                    <td className="py-2.5 px-3 text-[#64748b]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-[#e2e8f0]">{entry.ip}</td>
                    <td className="py-2.5 px-3 tabular-nums text-[#94a3b8]">
                      {entry.count.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-[#94a3b8]">
                      {pct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 w-48">
                      <div className="w-full h-2 rounded-full bg-[#0f1e35] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            background: "linear-gradient(90deg, #00d4ff, #7b61ff)",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
