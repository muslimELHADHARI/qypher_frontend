"use client";

import React, { useMemo } from "react";

interface ThreatHeatGridProps {
  data: { country: string; count: number; lat?: number; lng?: number }[];
}

export default function ThreatHeatGrid({ data }: ThreatHeatGridProps) {
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [data]);

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  if (!chartData.length) {
    return (
      <div className="w-full h-40 flex items-center justify-center bg-card/20 border border-border/30 rounded-xl">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">No geographic data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {chartData.map((item, index) => {
        // Calculate width, ensuring a minimum visible bar
        const width = Math.max(3, (item.count / maxCount) * 100);
        
        return (
          <div 
            key={item.country} 
            className="group relative px-4 py-3 rounded-xl border border-border/20 bg-black/20 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-primary/40 hover:bg-black/30"
          >
            {/* Background Glow */}
            <div 
              className="absolute top-0 left-0 h-full bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ width: `${width}%` }}
            />

            <div className="relative z-10 flex justify-between items-end mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-4 text-center">
                  #{index + 1}
                </span>
                <span className="text-xs font-bold text-foreground/90 uppercase tracking-wider">
                  {item.country}
                </span>
              </div>
              <span className="text-xs font-mono text-primary tabular-nums font-bold">
                {item.count} <span className="text-[9px] text-muted-foreground ml-1">EVENTS</span>
              </span>
            </div>

            {/* Animated Progress Bar */}
            <div className="relative z-10 h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-primary/40 to-primary transition-all duration-1000 ease-out"
                style={{ width: `${width}%` }}
              >
                {/* Highlight inside bar */}
                <div className="absolute top-0 right-0 w-8 h-full bg-white/30 blur-[2px]" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
