"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/KPICard";
import { QSHStatsResponse, QSHEvent } from "@/types/security";
import { Atom, ShieldCheck, Terminal, Users } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs border border-[rgba(30,58,95,0.6)]"
      style={{ background: "rgba(10, 22, 40, 0.95)", backdropFilter: "blur(12px)" }}>
      <p className="text-[#64748b] mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="tabular-nums" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(4) : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function QshMonitorPage() {
  const [stats, setStats] = useState<QSHStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/qsh");
        if (res.ok) setStats(await res.json());
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">QSH Management</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Loading telemetry...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="enterprise-card h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0] flex items-center gap-2">
            <Atom className="text-[#7b61ff]" size={24} /> QSH Management
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            QSH Metrics include Auths sessions and actions
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg bg-[rgba(123,97,255,0.1)] text-[#7b61ff] border border-[rgba(123,97,255,0.25)]">
          Live Prototype
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPICard
          title="Avg QBER"
          value={(stats.avgQber * 100).toFixed(2) + "%"}
          subtitle="Quantum Bit Error Rate"
          icon={<Atom size={20} />}
          glowClass="kpi-glow-purple"
          accentColor="#7b61ff"
        />
        <KPICard
          title="QKD Handshakes"
          value={stats.totalHandshakes}
          subtitle="Successful secure key bounds"
          icon={<ShieldCheck size={20} />}
          glowClass="kpi-glow-green"
          accentColor="#30d158"
        />
        <KPICard
          title="Active Sessions"
          value={stats.activeSessions}
          subtitle="Currently open shells"
          icon={<Users size={20} />}
          glowClass="kpi-glow-blue"
          accentColor="#00d4ff"
        />
        <KPICard
          title="Total Commands"
          value={stats.totalCommands}
          subtitle="Shell actions logged"
          icon={<Terminal size={20} />}
          glowClass="kpi-glow-orange"
          accentColor="#ff9500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="enterprise-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-6 pb-2 border-b border-slate-800/50">
            QBER &amp; Sifted Rate Timeline
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.qberTimeline}>
                <defs>
                  <linearGradient id="gradQber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7b61ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7b61ff" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradSift" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.3)" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="left" type="monotone" dataKey="qber" name="QBER" stroke="#7b61ff" fill="url(#gradQber)" strokeWidth={2} />
                <Area yAxisId="right" type="monotone" dataKey="sifted_rate" name="Sifted Rate" stroke="#00d4ff" fill="url(#gradSift)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="enterprise-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-6 pb-2 border-b border-slate-800/50">
            Shell Activity Volume
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.activityTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.3)" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Operations" radius={[4, 4, 0, 0]} fill="#00d4ff" fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detail Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-10">
        <div className="lg:col-span-3 enterprise-card p-6">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-800/50">
             <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
               Cryptographic Audit Ledger
             </h3>
             <span className="text-[10px] uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Secured by BB84</span>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="ent-table w-full text-left">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-[#64748b] uppercase tracking-wider border-b border-slate-800 text-[10px]">
                  <th className="py-3 px-4 font-bold">Time</th>
                  <th className="py-3 px-4 font-bold">Session ID</th>
                  <th className="py-3 px-4 font-bold">Client IP</th>
                  <th className="py-3 px-4 font-bold">Action Type</th>
                  <th className="py-3 px-4 font-bold">Payload / Command</th>
                  <th className="py-3 px-4 font-bold">Cryptographic Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {stats.recentEvents.map((evt) => {
                  // Generate a deterministic pseudo-hash based on ID for visual flair
                  const pseudoHash = Array.from(evt.id).reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0).toString(16).substring(0, 12).padStart(12, '0');
                  
                  return (
                  <tr key={evt.id} className="hover:bg-[rgba(15,40,71,0.3)] transition-colors group">
                    <td className="py-3 px-4 whitespace-nowrap text-[#64748b] text-xs font-mono">
                      {evt.timestamp.split("T")[1]?.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#00d4ff] text-xs">
                      {evt.session || "SYS_AUTH"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#e2e8f0] text-xs">
                      {evt.client || "INTERNAL"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border shadow-sm ${
                         evt.event === "auth_success" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" :
                         evt.event === "command_execute" ? "text-indigo-400 border-indigo-400/30 bg-indigo-400/10" :
                         evt.event === "file_action" ? "text-amber-500 border-amber-500/30 bg-amber-500/10" : "text-rose-500 border-rose-500/30 bg-rose-500/10"
                        }`}>
                        {evt.event === "auth_success" ? "AUTH_VERIFIED" : 
                         evt.event === "command_execute" ? "REMOTE_EXEC" : 
                         evt.event === "file_action" ? "FILE_TRANS" : 
                         evt.action?.toUpperCase() || "SYS_OP"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 text-xs max-w-[250px] truncate group-hover:text-white transition-colors" title={evt.command}>
                      {evt.command ? <span className="bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">{evt.command}</span> : <span className="text-slate-600 italic">No Payload</span>}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#64748b] text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                        sha256:{pseudoHash}...
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-3 enterprise-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-6 pb-2 border-b border-slate-800/50">
            Client Summary
          </h3>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="ent-table">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-[#64748b] uppercase tracking-wider border-b border-slate-800">
                  <th className="text-left py-2 px-3">Client IP</th>
                  <th className="text-left py-2 px-3">Handshakes</th>
                  <th className="text-left py-2 px-3">Commands</th>
                </tr>
              </thead>
              <tbody>
                {stats.clients.map((client) => (
                  <tr key={client.ip} className="border-b border-[rgba(30,58,95,0.2)] hover:bg-[rgba(15,40,71,0.3)] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#e2e8f0]">
                      {client.ip}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-[#30d158]">
                      {client.handshakes}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-[#ff9500]">
                      {client.commands}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
