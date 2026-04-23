"use client";

import { useEffect, useState } from "react";
import { QSHStatsResponse } from "@/types/security";
import { Atom } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";

export default function QBERWidget() {
  const [stats, setStats] = useState<QSHStatsResponse | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/qsh");
        if (res.ok) setStats(await res.json());
      } catch (e) {
         // ignore
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
     return <div className="animate-pulse h-48 bg-muted/20 rounded-xl w-full"></div>;
  }

  const qberPercent = stats.avgQber * 100;
  // Typical QBER threshold for interception is usually 11%, we'll set warning at 5%
  const isHealthy = qberPercent < 5.0; 

  // Provide fallback data if timeline is empty or has only 1 point (AreaChart needs >= 2 points)
  let chartData: any[] = [];
  if (stats.qberTimeline && stats.qberTimeline.length > 1) {
    chartData = stats.qberTimeline;
  } else if (stats.qberTimeline && stats.qberTimeline.length === 1) {
    chartData = [
      stats.qberTimeline[0], 
      { ...stats.qberTimeline[0], time: "Now" }
    ];
  } else {
    chartData = [
      { time: "00:00", qber: 0 },
      { time: "00:05", qber: 0 },
      { time: "00:10", qber: 0 },
      { time: "00:15", qber: 0 },
    ];
  }

  return (
    <div className="flex flex-col space-y-4">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Atom size={18} className="text-[#7b61ff]" />
             <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Quantum Key Dist</h3>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded-md ${
             isHealthy ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
          }`}>
             {isHealthy ? "SECURE" : "INTERCEPTED"}
          </span>
       </div>

       <div className="flex items-end justify-between mt-2">
          <div>
             <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-1">Avg QBER</p>
             <p className={`text-3xl font-bold tabular-nums leading-none tracking-tight ${
               isHealthy ? "text-emerald-500" : "text-rose-500"
             }`}>
               {qberPercent.toFixed(2)}%
             </p>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-1">Handshakes</p>
             <p className="text-xl font-bold tabular-nums text-foreground leading-none">{stats.totalHandshakes}</p>
          </div>
       </div>

       <div className="h-24 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 2 }}>
               <defs>
                 <linearGradient id="qberGrad" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor={isHealthy ? "#10b981" : "#f43f5e"} stopOpacity={0.3}/>
                   <stop offset="95%" stopColor={isHealthy ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <YAxis domain={[0, 0.1]} hide />
               <Area 
                  type="monotone" 
                  dataKey="qber" 
                  stroke={isHealthy ? "#10b981" : "#f43f5e"} 
                  strokeWidth={2} 
                  fill="url(#qberGrad)" 
                  isAnimationActive={false}
               />
             </AreaChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
}
