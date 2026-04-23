"use client";

import React, { useMemo } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Activity, Shield, ShieldAlert, Network, ArrowUpRight, ArrowDownRight 
} from "lucide-react";
import { useStats } from "@/hooks/useStats";
import { useSSEEvents } from "@/hooks/useSSEEvents";

const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#6366f1', '#8b5cf6'];

export default function AnalyticsPage() {
  const { stats, loading } = useStats(5000);
  const { events } = useSSEEvents(100);

  // Derive charts from actual API data
  const trendData = useMemo(() => {
    if (!stats?.timeline) return [];
    return stats.timeline.map(t => ({
      time: t.time,
      benign: Math.max(0, t.count - (t.critical + t.high + t.medium + t.low)),
      malicious: t.critical + t.high,
      total: t.count
    }));
  }, [stats]);

  const distributionData = useMemo(() => {
    if (!stats?.attackTypes) return [];
    return stats.attackTypes
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(at => ({ name: at.name, value: at.count }));
  }, [stats]);

  const severityTimelineData = useMemo(() => {
    if (!stats?.timeline) return [];
    return stats.timeline.map(t => ({
      time: t.time,
      critical: t.critical,
      high: t.high,
      medium: t.medium,
      low: t.low
    }));
  }, [stats]);

  const combinedEvents = useMemo(() => {
    const streamIds = new Set(events.map(e => e.id));
    const history = stats?.historicalEvents || [];
    const uniqueHistory = history.filter(e => !streamIds.has(e.id));
    return [...events, ...uniqueHistory].slice(0, 50);
  }, [events, stats?.historicalEvents]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="animate-spin text-primary" size={28} />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Aggregating Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Advanced Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time traffic trends, threat distributions, and anomaly tracking.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: "Total Events Processed", 
            value: stats?.totalEvents?.toLocaleString() || "0", 
            trend: "LIVE", 
            up: true, 
            icon: Network,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
          },
          { 
            title: "Traffic Velocity", 
            value: `${stats?.attacksPerMinute || 0} EPM`, 
            trend: "RATE", 
            up: true, 
            icon: Activity,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10"
          },
          { 
            title: "Active Threats", 
            value: stats?.activeThreats?.toLocaleString() || "0", 
            trend: "HIGH/CRIT", 
            up: false, 
            icon: Shield,
            color: "text-orange-500",
            bg: "bg-orange-500/10"
          },
          { 
            title: "Critical Anomalies", 
            value: stats?.criticalAlerts?.toLocaleString() || "0", 
            trend: "URGENT", 
            up: false, 
            icon: ShieldAlert,
            color: "text-rose-500",
            bg: "bg-rose-500/10"
          }
        ].map((kpi, idx) => (
          <div key={idx} className="enterprise-card p-5 flex flex-col justify-between hover:border-primary/30 transition-colors group">
            <div className="flex items-start justify-between mb-4">
               <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color}`}>
                  <kpi.icon size={20} />
               </div>
               <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                 kpi.up ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
               }`}>
                  {kpi.trend}
               </div>
            </div>
            <div>
               <h3 className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{kpi.value}</h3>
               <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">{kpi.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Traffic Chart */}
      <div className="enterprise-card p-6">
         <div className="mb-6">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Traffic & Threat Volume</h2>
            <p className="text-xs text-muted-foreground mt-1">Comparison of benign traffic vs malicious ingress over time.</p>
         </div>
         <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBenign" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMalicious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Area type="monotone" dataKey="total" name="Total Events" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBenign)" />
                <Area type="monotone" dataKey="malicious" name="Detected Threats (High/Crit)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorMalicious)" />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Bottom Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* Threat Distribution */}
         <div className="enterprise-card p-6 flex flex-col">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Top Attack Vectors</h2>
            <p className="text-xs text-muted-foreground mb-6">Distribution of the most frequent attack patterns detected.</p>
            <div className="flex-1 w-full flex items-center justify-center relative min-h-[300px]">
               {distributionData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={distributionData}
                       cx="50%"
                       cy="50%"
                       innerRadius={80}
                       outerRadius={110}
                       paddingAngle={5}
                       dataKey="value"
                       nameKey="name"
                       stroke="var(--card)"
                       strokeWidth={3}
                     >
                       {distributionData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                       contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                       itemStyle={{ fontWeight: 600, color: 'var(--foreground)' }}
                     />
                     <Legend 
                       verticalAlign="middle" 
                       align="right" 
                       layout="vertical" 
                       iconType="circle"
                       wrapperStyle={{ fontSize: '12px', paddingLeft: '20px' }}
                       formatter={(val: string) => {
                         let clean = val.includes("(") ? val.split("(")[0].trim() : val;
                         return clean.length > 15 ? clean.substring(0, 15) + "..." : clean;
                       }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground font-semibold">No attack data available</p>
                 </div>
               )}
               {/* Center Label */}
               {distributionData.length > 0 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-[100px]">
                    <span className="text-3xl font-black text-foreground">{stats?.attackTypes?.length || 0}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">Vectors</span>
                 </div>
               )}
            </div>
         </div>

         {/* Severity Timeline */}
         <div className="enterprise-card p-6 flex flex-col">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Severity Timeline</h2>
            <p className="text-xs text-muted-foreground mb-6">Chronological breakdown of event severity levels.</p>
            <div className="flex-1 w-full min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={severityTimelineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                   <XAxis 
                     dataKey="time" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                     dy={10} 
                   />
                   <YAxis 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                   />
                   <Tooltip 
                     cursor={{ fill: "var(--muted)", opacity: 0.2 }}
                     contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                   />
                   <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                   <Bar dataKey="critical" name="Critical" stackId="a" fill="#f43f5e" />
                   <Bar dataKey="high" name="High" stackId="a" fill="#f97316" />
                   <Bar dataKey="medium" name="Medium" stackId="a" fill="#eab308" />
                   <Bar dataKey="low" name="Low" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

      </div>

      {/* Enterprise Incident Ledger */}
      <div className="enterprise-card p-6">
         <div className="mb-6 flex items-center justify-between">
            <div>
               <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Enterprise Incident Ledger</h2>
               <p className="text-xs text-muted-foreground mt-1">Real-time raw network telemetry and incident logs.</p>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-md border border-border/50 shadow-inner">
               {combinedEvents.length} Telemetry Events Displayed
            </span>
         </div>
         <div className="overflow-x-auto max-h-[400px]">
            <table className="ent-table w-full text-left border-collapse">
               <thead className="sticky top-0 z-10" style={{ background: "var(--card)", backdropFilter: "blur(8px)" }}>
                  <tr className="text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border/50">
                     <th className="py-3 px-4 font-black">Timestamp</th>
                     <th className="py-3 px-4 font-black">Source</th>
                     <th className="py-3 px-4 font-black">Target IP / Port</th>
                     <th className="py-3 px-4 font-black">Detection Signature</th>
                     <th className="py-3 px-4 font-black text-center">Threat Level</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border/20">
                  {combinedEvents.map((evt) => (
                     <tr key={evt.id} className="hover:bg-muted/5 transition-colors group cursor-default">
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground font-mono">
                           {evt.timestamp.includes("T") ? evt.timestamp.split("T")[1].substring(0,8) : evt.timestamp.split(" ")[1]}
                        </td>
                        <td className="py-3 px-4">
                           <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold border border-indigo-400/20 bg-indigo-400/10 px-2 py-0.5 rounded">
                             {evt.source}
                           </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                           {evt.src_ip} <span className="text-muted-foreground/50">{evt.src_port ? `:${evt.src_port}` : ""}</span>
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-foreground max-w-[250px] truncate" title={evt.raw}>
                           {evt.attack_type}
                        </td>
                        <td className="py-3 px-4 text-center">
                           <div className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border shadow-sm ${
                              evt.severity === "CRITICAL" ? "text-rose-500 border-rose-500/20 bg-rose-500/10" :
                              evt.severity === "HIGH" ? "text-orange-500 border-orange-500/20 bg-orange-500/10" :
                              evt.severity === "MEDIUM" ? "text-amber-500 border-amber-500/20 bg-amber-500/10" :
                              "text-emerald-500 border-emerald-500/20 bg-emerald-500/10"
                           }`}>
                              {evt.severity === "CRITICAL" && <ShieldAlert size={10} />}
                              {evt.severity}
                           </div>
                        </td>
                     </tr>
                  ))}
                  {combinedEvents.length === 0 && (
                     <tr>
                        <td colSpan={5} className="py-12 text-center text-sm font-semibold text-muted-foreground">
                           No telemetry stream recorded yet.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
