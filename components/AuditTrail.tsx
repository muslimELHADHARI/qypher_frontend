"use client";

import React, { useEffect, useState } from "react";
import { formatTime, truncateIP } from "@/lib/format";
import { History, ShieldAlert, CheckCircle, XCircle, RotateCcw } from "lucide-react";

interface AuditAction {
  id: number;
  timestamp: string;
  action: "block" | "unblock" | "flush" | "sync";
  ip: string;
  status: "success" | "failed" | "partial";
  command: string;
  output: string;
}

export default function AuditTrail() {
  const [actions, setActions] = useState<AuditAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await fetch("/api/ips/audit?limit=20");
        if (res.ok) {
          const data = await res.json();
          setActions(data.actions || []);
        }
      } catch (err) {
        console.error("Failed to fetch audit trail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
    const interval = setInterval(fetchAudit, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && actions.length === 0) {
    return <div className="p-10 text-center text-slate-600 text-xs uppercase tracking-widest animate-pulse">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <div
          key={action.id}
          className="p-2.5 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-1 rounded ${action.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                {action.status === 'success' ? <CheckCircle size={10} /> : <XCircle size={10} />}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-200 uppercase tracking-tight">
                  {action.action} <span className="text-blue-500/80 font-mono">{truncateIP(action.ip)}</span>
                </p>
                <p className="text-[9px] text-slate-600 font-mono leading-none mt-0.5">
                  {formatTime(action.timestamp)}
                </p>
              </div>
            </div>
          </div>

          <div className={`absolute bottom-0 left-0 h-[1.5px] transition-all duration-1000 ${action.status === 'success' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
            }`} style={{ width: '100%' }} />
        </div>
      ))}

      {actions.length === 0 && (
        <div className="py-10 text-center">
          <ShieldAlert size={24} className="mx-auto text-slate-800 mb-2" />
          <p className="text-[10px] text-slate-600 uppercase font-bold">No active audit logs</p>
        </div>
      )}
    </div>
  );
}
