"use client";

import { useStats } from "@/hooks/useStats";
import { useEffect, useState } from "react";

export default function QuantumHealthWidget() {
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
  const coherence = Math.max(0, 100 - (qber * 2000)); // Arbitrary scaling for visual impact

  return (
    <div className="relative flex flex-col items-center justify-center h-full p-4 overflow-hidden">
      {/* Central Core */}
      <div className="relative w-24 h-24 rounded-full flex items-center justify-center">
        {/* Pulsing glow */}
        <div className="absolute inset-0 rounded-full bg-[#7b61ff] opacity-20 animate-pulse scale-125" />
        <div className="absolute inset-2 rounded-full border border-[rgba(123,97,255,0.3)] border-dashed animate-spin" style={{ animationDuration: '8s' }} />
        
        {/* Core level */}
        <div className="z-10 text-center">
          <div className="text-2xl font-bold text-[#e2e8f0] tabular-nums">
            {coherence.toFixed(1)}%
          </div>
          <div className="text-[10px] uppercase tracking-tighter text-[#7b61ff]">Coherence</div>
        </div>
      </div>

      {/* Metrics list */}
      <div className="mt-6 w-full space-y-3">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-[#64748b] uppercase font-semibold">QBER Error</span>
          <span className="text-[#ff2d55] font-mono">{(qber * 100).toFixed(4)}%</span>
        </div>
        <div className="w-full bg-[rgba(30,58,95,0.3)] h-1 rounded-full overflow-hidden">
          <div className="bg-[#ff2d55] h-full transition-all duration-1000" style={{ width: `${Math.min(100, qber * 2000)}%` }} />
        </div>
        
        <div className="flex justify-between items-center text-[11px] mt-2">
          <span className="text-[#64748b] uppercase font-semibold">Sifted Rate</span>
          <span className="text-[#00d4ff] font-mono">{qshStats?.totalHandshakes || 0} p/s</span>
        </div>
        <div className="w-full bg-[rgba(30,58,95,0.3)] h-1 rounded-full overflow-hidden">
          <div className="bg-[#00d4ff] h-full transition-all duration-1000" style={{ width: '65%' }} />
        </div>
      </div>

      <div className="absolute top-2 right-2 flex gap-1">
        <div className="w-1 h-1 bg-[#30d158] rounded-full animate-ping" />
        <span className="text-[8px] text-[#30d158] uppercase">Secure</span>
      </div>
    </div>
  );
}
