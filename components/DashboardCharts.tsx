"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { StatsResponse } from "@/types/security";

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#ff2d55",
  HIGH: "#ff9500",
  MEDIUM: "#ffcc00",
  LOW: "#30d158",
};

const BAR_COLORS = ["#00d4ff", "#7b61ff", "#ff9500", "#30d158", "#ff2d55", "#ffcc00", "#00b4d8", "#e040fb"];

interface DashboardChartsProps {
  stats: StatsResponse;
}

// Custom tooltip that matches our dark theme
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs border border-border/50 shadow-xl"
      style={{ background: "var(--card)", backdropFilter: "blur(12px)" }}>
      <p className="text-muted-foreground font-bold mb-1 uppercase tracking-tight">{label}</p>
      {payload.map((entry, idx) => {
        // Format names like "high" to "High", and truncate super long raw log strings in tooltip if needed
        const rawName = entry.name || "";
        const displayName = rawName.length > 40 ? rawName.substring(0, 40) + "..." : rawName;
        const finalName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        
        return (
          <p key={idx} className="tabular-nums font-black" style={{ color: entry.color }}>
            {finalName}: {entry.value}
          </p>
        );
      })}
    </div>
  );
}

export function TimelineChart({ data }: { data: StatsResponse["timeline"] }) {
  return (
    <div className="enterprise-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
          Event Volume Over Time
        </h3>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff2d55" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ff2d55" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff9500" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ff9500" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffcc00" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ffcc00" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#30d158" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#30d158" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.1} />
            <XAxis dataKey="time" stroke="var(--muted-foreground)" tick={{ fontSize: 10, fontWeight: 700 }} />
            <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 10, fontWeight: 700 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="critical" stackId="1" stroke="#ff2d55" fill="url(#gradCritical)" strokeWidth={2} />
            <Area type="monotone" dataKey="high" stackId="1" stroke="#ff9500" fill="url(#gradHigh)" strokeWidth={2} />
            <Area type="monotone" dataKey="medium" stackId="1" stroke="#ffcc00" fill="url(#gradMedium)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="low" stackId="1" stroke="#30d158" fill="url(#gradLow)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SeverityPieChart({ data }: { data: StatsResponse["severityDistribution"] }) {
  const filteredData = data.filter((d) => d.value > 0);
  return (
    <div className="enterprise-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
          Alert Severity Distribution
        </h3>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {filteredData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={SEVERITY_COLORS[entry.name] || "#64748b"}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", fontWeight: 700 }}
              formatter={(value: string) => (
                <span className="text-muted-foreground uppercase tracking-tighter">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TopAttackersChart({ data }: { data: StatsResponse["topSourceIPs"] }) {
  return (
    <div className="enterprise-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
          Top Source IPs by Alert Count
        </h3>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.1} />
            <XAxis type="number" stroke="var(--muted-foreground)" tick={{ fontSize: 10, fontWeight: 700 }} />
            <YAxis 
              dataKey="ip" 
              type="category" 
              stroke="var(--muted-foreground)" 
              tick={{ fontSize: 10, fontWeight: 700 }} 
              width={110} 
              tickFormatter={(val: string) => val.length > 15 ? val.substring(0, 15) + "..." : val}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((_, idx) => (
                <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AttackTypesChart({ data }: { data: StatsResponse["attackTypes"] }) {
  return (
    <div className="enterprise-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
          Attack Type Breakdown
        </h3>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.1} />
            <XAxis 
              dataKey="name" 
              stroke="var(--muted-foreground)" 
              tick={{ fontSize: 9, fontWeight: 700 }} 
              interval={0} 
              angle={-20} 
              textAnchor="end"
              height={50}
              tickFormatter={(val: string) => {
                if (!val) return "";
                let clean = val.includes("(") ? val.split("(")[0].trim() : val;
                return clean.length > 12 ? clean.substring(0, 12) + "..." : clean;
              }}
            />
            <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 10, fontWeight: 700 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((_, idx) => (
                <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <TimelineChart data={stats.timeline} />
      <SeverityPieChart data={stats.severityDistribution} />
      <TopAttackersChart data={stats.topSourceIPs} />
      <AttackTypesChart data={stats.attackTypes} />
    </div>
  );
}
