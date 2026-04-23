"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Globe, 
  Lock, 
  Unlock, 
  ShieldX, 
  Search, 
  RefreshCw,
  Trash2,
  History as HistoryIcon,
  Zap,
  Activity,
  Database,
  SearchCode,
  AlertTriangle,
  Server,
  Shield,
  Plus
} from "lucide-react";
import AuditTrail from "@/components/AuditTrail";
import { truncateIP, formatTime } from "@/lib/format";

interface IPBlockEntry {
  ip: string;
  reason: string;
  timestamp: string;
  status: "active" | "inactive";
  applied: boolean; // From backend live state
  max_severity: string;
  total_events: number;
}

interface IPStats {
  total_entries: number;
  single_ips: number;
  cidr_ranges: number;
  firewall_enabled: boolean;
  db_size_kb: number;
}

export default function IPManagementPage() {
  const [ips, setIps] = useState<IPBlockEntry[]>([]);
  const [stats, setStats] = useState<IPStats | null>(null);
  const [autoBlock, setAutoBlock] = useState<{enabled: boolean, minSeverity: string}>({enabled: false, minSeverity: "HIGH"});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    refreshData();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/ips/config");
      if (res.ok) setAutoBlock(await res.json());
    } catch {}
  };

  const toggleAutoBlock = async () => {
    const nextState = !autoBlock.enabled;
    try {
      const res = await fetch("/api/ips/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState })
      });
      if (res.ok) {
        setAutoBlock(await res.json());
      }
    } catch (err) {
      alert("Failed to update Autonomous Mitigation state");
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const [blocklistRes, statsRes] = await Promise.all([
        fetch("/api/ips"),
        fetch("/api/ips/stats")
      ]);
      
      if (blocklistRes.ok) {
        const data = await blocklistRes.json();
        const mapped = (data.blocklist || []).map((item: any) => ({
          ip: item.ip,
          reason: item.reason || "Manual restriction",
          timestamp: item.added_at,
          status: item.firewall_status === 'applied' ? "active" : "inactive",
          applied: item.firewall_status === 'applied',
          max_severity: item.metadata?.max_severity || "HIGH",
          total_events: item.metadata?.total_events || 1
        }));
        setIps(mapped);
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.statistics || statsData);
      }
    } catch (err) {
      console.error("Failed to refresh persistent data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (ip: string) => {
    if (!confirm(`Are you sure you want to unblock ${ip}?`)) return;
    try {
      const res = await fetch(`/api/ips/${ip}`, { method: "DELETE" });
      if (res.ok) await refreshData();
    } catch (err) {
      alert("Error occurred during unblock operation");
    }
  };

  const handleManualBlock = async (ip: string) => {
    if (!ip) return;
    try {
      const res = await fetch("/api/ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, reason: "Manual restriction by administrator" })
      });
      if (res.ok) {
        const input = document.getElementById('manual-ip-input') as HTMLInputElement;
        if (input) input.value = "";
        await refreshData();
      }
    } catch (err) {
      alert("Failed to apply manual block");
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/ips/firewall", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(`Firewall Sync Complete: ${data.added} added, ${data.removed} removed.`);
        await refreshData();
      }
    } catch (err) {
      alert("Synchronization error");
    } finally {
      setSyncing(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("WARNING: This will clear all persistent rules and flush iptables. Proceed?")) return;
    try {
      const res = await fetch("/api/ips/clear", { method: "DELETE" });
      if (res.ok) await refreshData();
    } catch (err) {
       alert("Flush operation failed");
    }
  };

  const displayIps = useMemo(() => {
    if (!search) return ips;
    const s = search.toLowerCase();
    return ips.filter(p => p.ip.includes(s) || p.reason.toLowerCase().includes(s));
  }, [ips, search]);

  if (loading && !ips.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="animate-spin text-primary" size={28} />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Loading firewall state…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Access Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage firewall rules, monitor autonomous mitigation, and review audit logs.
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Blocks", value: stats?.total_entries || 0, color: "text-rose-500", bg: "bg-rose-500/10", icon: ShieldX },
          { label: "Individual IPs", value: stats?.single_ips || 0, color: "text-orange-500", bg: "bg-orange-500/10", icon: Lock },
          { label: "Subnets (CIDR)", value: stats?.cidr_ranges || 0, color: "text-blue-500", bg: "bg-blue-500/10", icon: Globe },
          { label: "Firewall Engine", value: stats?.firewall_enabled !== false ? "ACTIVE" : "INACTIVE", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: Database },
        ].map((kpi, i) => (
          <div key={i} className="enterprise-card p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{kpi.label}</p>
              <p className="text-2xl font-bold text-foreground tabular-nums leading-none">{kpi.value}</p>
            </div>
            <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
               <kpi.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Main IP Table */}
        <div className="flex-1 w-full space-y-4">
          <div className="enterprise-card overflow-hidden">
            <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Shield size={18} />
                </div>
                <div>
                   <h2 className="text-sm font-semibold text-foreground">Active Firewall Rules</h2>
                   <p className="text-[11px] text-muted-foreground mt-0.5">Current iptables and persistence layer state</p>
                </div>
              </div>
              
              <div className="relative w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by IP, CIDR, or Reason..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-xs bg-card border border-border text-foreground placeholder-muted-foreground/40 focus:border-primary/40 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/20 border-b border-border/50">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">IP / CIDR</th>
                    <th className="text-center px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Last Seen</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {displayIps.map((entry) => (
                    <tr key={entry.ip} className="hover:bg-primary/[0.03] transition-colors group">
                      <td className="px-6 py-3 font-mono font-medium text-foreground/80 text-xs">
                        {truncateIP(entry.ip)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          entry.applied 
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                            : 'bg-muted/50 text-muted-foreground border-border'
                        }`}>
                          {entry.applied ? "Enforced" : "Passive"}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="max-w-xs">
                           <span className="text-foreground text-xs font-medium block truncate mb-1">
                              {entry.reason.replace(/_/g, ' ')}
                           </span>
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground font-medium">
                                 {entry.total_events} events
                              </span>
                              <span className="text-[10px] text-muted-foreground/30">•</span>
                              <span className={`text-[10px] font-semibold ${
                                 entry.max_severity === 'CRITICAL' ? 'text-rose-500' : 
                                 entry.max_severity === 'HIGH' ? 'text-orange-500' : 'text-muted-foreground'
                              }`}>
                                 {entry.max_severity}
                              </span>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground text-[11px] font-mono text-right">
                        {formatTime(entry.timestamp)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button 
                           onClick={() => handleUnblock(entry.ip)}
                           className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-muted text-muted-foreground hover:text-foreground" 
                           title="Unblock IP"
                        >
                           <Unlock size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {displayIps.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                           <SearchCode size={32} className="opacity-20" />
                           <p className="text-sm">No active blocks found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full xl:w-80 space-y-6 flex flex-col">
          
          {/* Autonomous Mitigation */}
          <div className="enterprise-card p-5">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                   <Zap size={16} className={autoBlock.enabled ? "text-primary" : "text-muted-foreground"} />
                   <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Autonomous Mitigation</h3>
                </div>
                <button 
                  onClick={toggleAutoBlock}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    autoBlock.enabled ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${autoBlock.enabled ? "translate-x-4.5" : "translate-x-1"}`} />
                </button>
             </div>
             
             <p className="text-[11px] text-muted-foreground mb-4">
               {autoBlock.enabled ? 
                 "Automatically blocking high-severity threats detected by the IDS and ML models." : 
                 "Autonomous mitigation is disabled. Threats will be logged but not blocked."
               }
             </p>
             
             <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg">
                <div className={`w-1.5 h-1.5 rounded-full ${autoBlock.enabled ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                <span className="text-[10px] font-semibold text-muted-foreground">
                  Status: {autoBlock.enabled ? "Enabled" : "Disabled"}
                </span>
             </div>
          </div>

          {/* Manual Block */}
          <div className="enterprise-card p-5">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2.5">
              <Lock size={14} className="text-muted-foreground" />
              Manual Block
            </h3>
            <div className="space-y-3">
              <div>
                 <label className="text-[10px] font-medium text-muted-foreground mb-1.5 block">IP Address or CIDR</label>
                 <input
                  id="manual-ip-input"
                  type="text"
                  placeholder="e.g. 192.168.1.50 or 10.0.0.0/24"
                  className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground placeholder-muted-foreground/40 focus:border-primary/40 focus:outline-none transition-all font-mono"
                />
              </div>
              <button 
                onClick={() => {
                  const input = document.getElementById('manual-ip-input') as HTMLInputElement;
                  if (input.value) handleManualBlock(input.value);
                }}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                Apply Block
              </button>
            </div>
          </div>

          {/* System Maintenance */}
          <div className="enterprise-card p-5">
             <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2.5">
               <Server size={14} className="text-muted-foreground" />
               System Maintenance
             </h3>
             <div className="grid grid-cols-2 gap-3 mb-4">
                <button 
                   onClick={handleSync}
                   disabled={syncing}
                   className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors border border-transparent"
                >
                   <RefreshCw size={16} className={`text-muted-foreground ${syncing ? "animate-spin" : ""}`} />
                   <span className="text-[10px] font-medium text-foreground">Sync Firewall</span>
                </button>
                <button 
                   onClick={handleClearAll}
                   className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 transition-colors border border-transparent"
                >
                   <Trash2 size={16} />
                   <span className="text-[10px] font-medium">Clear All</span>
                </button>
             </div>
             <div className="p-3 bg-blue-500/5 rounded-lg flex items-start gap-2.5">
                <AlertTriangle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                   Syncing synchronizes iptables with the persistent database. Use if firewall state becomes inconsistent.
                </p>
             </div>
          </div>

          {/* Audit Log */}
          <div className="enterprise-card flex flex-col overflow-hidden min-h-[300px]">
             <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                   <HistoryIcon size={14} className="text-muted-foreground" />
                   <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Audit Log</h3>
                </div>
             </div>
             <div className="flex-1 p-0 overflow-y-auto max-h-[350px] custom-scrollbar">
                <AuditTrail />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
