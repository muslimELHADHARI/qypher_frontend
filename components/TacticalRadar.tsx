"use client";

import React, { useMemo } from "react";
import { SecurityEvent } from "@/types/security";

export default function TacticalRadar({ events = [] }: { events?: SecurityEvent[] }) {
  const nodes = useMemo(() => {
    // Process recent events into visual nodes
    return events.slice(0, 50).map(evt => {
       // Deterministic but scattered positioning based on IP
       const octets = evt.src_ip.split('.').map(Number);
       const angle = ((octets[3] || Math.random() * 255) / 255) * 360; 
       // Radius between 15% and 90%
       const radiusPercent = 15 + (((octets[2] || Math.random() * 100) % 100) / 100) * 75; 
       
       let color = "#10b981"; // Emerald (Low)
       let size = 4;
       let glow = "rgba(16, 185, 129, 0.6)";

       if (evt.severity === "CRITICAL") {
          color = "#f43f5e"; // Rose
          size = 8;
          glow = "rgba(244, 63, 94, 0.8)";
       } else if (evt.severity === "HIGH") {
          color = "#f97316"; // Orange
          size = 6;
          glow = "rgba(249, 115, 22, 0.6)";
       } else if (evt.severity === "MEDIUM") {
          color = "#eab308"; // Yellow
          size = 5;
          glow = "rgba(234, 179, 8, 0.5)";
       }

       return {
          id: evt.id,
          angle,
          radiusPercent,
          color,
          size,
          glow,
          type: evt.attack_type,
          ip: evt.src_ip
       };
    });
  }, [events]);

  return (
     <div className="relative w-full max-w-sm mx-auto aspect-square rounded-full border border-border/20 bg-black/40 backdrop-blur-xl flex items-center justify-center p-2 shadow-[0_0_40px_rgba(0,0,0,0.2)]">
        {/* Core center */}
        <div className="absolute w-2 h-2 bg-primary/80 rounded-full shadow-[0_0_15px_var(--primary)] z-10" />

        {/* Concentric rings */}
        <div className="absolute inset-[10%] border border-primary/20 rounded-full" />
        <div className="absolute inset-[35%] border border-border/20 rounded-full border-dashed" />
        <div className="absolute inset-[60%] border border-border/10 rounded-full" />
        <div className="absolute inset-[85%] border border-border/5 rounded-full border-dashed" />
        
        {/* Crosshairs */}
        <div className="absolute w-full h-[1px] bg-primary/10" />
        <div className="absolute h-full w-[1px] bg-primary/10" />
        <div className="absolute w-full h-[1px] bg-border/5 rotate-45" />
        <div className="absolute w-full h-[1px] bg-border/5 -rotate-45" />

        {/* Nodes */}
        {nodes.map(node => {
           const rad = (node.angle * Math.PI) / 180;
           // Center is 50%, 50%
           const x = 50 + (node.radiusPercent / 2) * Math.cos(rad);
           const y = 50 + (node.radiusPercent / 2) * Math.sin(rad);

           return (
              <div 
                 key={node.id}
                 className="absolute rounded-full transition-all duration-700 ease-out group cursor-crosshair z-20"
                 style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: node.size,
                    height: node.size,
                    backgroundColor: node.color,
                    boxShadow: `0 0 ${node.size * 2.5}px ${node.glow}`,
                    transform: 'translate(-50%, -50%)'
                 }}
              >
                 {/* Tooltip on hover */}
                 <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2.5 py-1.5 bg-black/90 backdrop-blur-md border border-border/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl z-50">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">{node.ip}</p>
                    <p className="text-[10px] font-bold text-foreground">{node.type}</p>
                 </div>
              </div>
           );
        })}

        {/* Modern Radar Sweep */}
        <div className="absolute inset-2 rounded-full origin-center animate-[spin_6s_linear_infinite] opacity-30 pointer-events-none z-0"
             style={{ background: 'conic-gradient(from 0deg, transparent 70deg, var(--primary) 360deg)' }}
        />
        
        {/* Data Status Badge */}
        <div className="absolute -bottom-2 right-4 bg-card/80 backdrop-blur border border-border/50 px-3 py-1.5 rounded-full flex items-center gap-2 z-30 shadow-lg">
           <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--primary)]" />
           <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/80">Live Plot</span>
        </div>
     </div>
  );
}
