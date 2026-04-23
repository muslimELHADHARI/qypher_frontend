"use client";

import { SecurityEvent } from "@/types/security";
import { useState, useEffect } from "react";
import EventDetailModal from "./EventDetailModal";
import { truncateIP, formatTime } from "@/lib/format";
import { Terminal, Activity, ShieldAlert } from "lucide-react";

interface LiveEventFeedProps {
  events: SecurityEvent[];
  maxItems?: number;
  connected?: boolean;
}

const severityStyles: Record<string, string> = {
  CRITICAL: "severity-critical",
  HIGH: "severity-high",
  MEDIUM: "severity-medium",
  LOW: "severity-low",
};

export default function LiveEventFeed({
  events,
  maxItems = 50,
  connected = false,
}: LiveEventFeedProps) {
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const displayEvents = events.slice(0, maxItems);

  return (
    <>
      <div className="glass-panel rounded-2xl overflow-hidden tactical-scanline border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-inner">
               <Activity size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                Live Interception Telemetry
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">
                Sub-millisecond packet correlation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-card border border-border shadow-sm`}>
               <span
                 className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" : "bg-rose-500"
                   }`}
               />
               <span className="text-[10px] font-bold text-muted-foreground font-mono">
                 {connected ? "SYNC_ACTIVE" : "OFFLINE"}
               </span>
            </div>
          </div>
        </div>

        {/* Event list */}
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          {displayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground/40">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-6">
                 <Terminal size={32} className="opacity-20" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Listening for Correlation...</p>
              <p className="text-[10px] uppercase tracking-tighter opacity-50 mt-1 italic">Waiting for sensor propagation</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {displayEvents.map((event, idx) => (
                <button
                  key={event.id || idx}
                  onClick={() => setSelectedEvent(event)}
                  className={`w-full text-left flex items-center gap-5 px-6 py-4.5 hover:bg-secondary/50 transition-all cursor-pointer group magnetic-hover ${idx === 0 ? "event-enter-organic" : ""
                    }`}
                >
                  {/* Severity Indicator */}
                  <div className="flex-shrink-0 flex items-center justify-center w-12">
                     <div
                        className={`w-2.5 h-2.5 rounded-full ring-4 ring-offset-4 ring-offset-transparent transition-all duration-700`}
                        style={{
                           backgroundColor:
                              event.severity === "CRITICAL" ? "var(--severity-critical)" : 
                              event.severity === "HIGH" ? "var(--severity-high)" : 
                              event.severity === "MEDIUM" ? "var(--severity-medium)" : "var(--severity-low)",
                           boxShadow: `0 0 16px ${
                              event.severity === "CRITICAL" ? "rgba(192, 57, 43, 0.4)" : 
                              event.severity === "HIGH" ? "rgba(211, 84, 0, 0.4)" : "transparent"
                           }`,
                           borderColor: event.severity === "CRITICAL" ? "rgba(192, 57, 43, 0.2)" : "transparent"
                        }}
                     />
                  </div>

                  {/* Identification */}
                  <div className="flex-shrink-0 w-24">
                     <span className="block text-[11px] font-mono text-muted-foreground font-medium leading-none">
                        {formatTime(event.timestamp)}
                     </span>
                     <span className="block text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1.5">
                        {event.source === "suricata" ? "IDS/IPS" : event.source === "ml" ? "NEURAL" : "QUANTUM"}
                     </span>
                  </div>

                  {/* Artifact / Action */}
                  <div className="flex-1 min-w-0">
                     <span className="block text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {event.attack_type}
                     </span>
                     <div className="flex items-center gap-2.5 mt-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${severityStyles[event.severity]}`}>
                           {event.severity}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 font-mono italic truncate">
                           v.{event.action?.slice(0, 8) || "log"}
                        </span>
                     </div>
                  </div>

                  {/* IPv6 Optimized Targets */}
                  <div className="flex-shrink-0 text-right">
                     <div className="flex items-center justify-end gap-2 text-[11px] font-mono text-muted-foreground font-bold">
                        <span className="text-primary/70">{truncateIP(event.src_ip)}</span>
                        <span className="text-muted-foreground/30">→</span>
                        <span>{truncateIP(event.dst_ip)}</span>
                     </div>
                     <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.2em] mt-1.5">
                        Port {event.src_port || event.dst_port || 'ANY'}
                     </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-border bg-white/[0.01] flex items-center justify-between">
           <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <ShieldAlert size={12} className="text-primary animate-pulse" />
              Surveillance Mesh Active
           </div>
           <div className="text-[10px] font-mono text-muted-foreground/40 font-bold">
              Correlated: {events.length} PVT
           </div>
        </div>
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}
