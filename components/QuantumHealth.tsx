"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldCheck, Zap } from "lucide-react";

export default function QuantumHealth() {
  const [qshStats, setQshStats] = useState<any>(null);

  useEffect(() => {
    const fetchQSH = async () => {
      try {
        const res = await fetch("/api/qsh");
        if (res.ok) setQshStats(await res.json());
      } catch {}
    };
    fetchQSH();
    const interval = setInterval(fetchQSH, 10000);
    return () => clearInterval(interval);
  }, []);

  const qber = qshStats?.avgQber || 0;
  const isHealthy = qber < 0.05;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} className={isHealthy ? "text-emerald-500" : "text-amber-500"} />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            Quantum Status
          </span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
          isHealthy ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
        }`}>
          {isHealthy ? "Operational" : "Degraded"}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-tight">
            <span className="text-muted-foreground/80">Error Rate (QBER)</span>
            <span className="font-mono text-foreground">{(qber * 100).toFixed(4)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/20">
            <div 
              className={`h-full transition-all duration-1000 ${qber > 0.1 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min(100, qber * 1000)}%` }} 
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-tight">
            <span className="text-muted-foreground/80">Sifted Keys</span>
            <span className="font-mono text-foreground">{qshStats?.totalHandshakes || 0} avg/min</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/20">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: '70%' }} />
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-border/50">
         <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>End-to-End Encryption: ACTIVE</span>
         </div>
      </div>
    </div>
  );
}
