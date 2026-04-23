"use client";

import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  glowClass?: string;
  trend?: { value: number; label: string };
  accentColor?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  glowClass = "kpi-glow-blue",
  trend,
  accentColor = "#00d4ff",
}: KPICardProps) {
  return (
    <div
      className="enterprise-card p-6 relative overflow-hidden group"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-opacity-20"
          style={{
            background: `rgba(${hexToRgb(accentColor)}, 0.1)`,
            border: `1px solid rgba(${hexToRgb(accentColor)}, 0.22)`,
          }}
        >
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
        {trend && (
          <div className="flex flex-col items-end">
             <span className={`text-[11px] font-bold ${trend.value >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
               {trend.value >= 0 ? "+" : ""}{trend.value}%
             </span>
             <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{trend.label}</span>
          </div>
        )}
      </div>

      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 leading-none">
        {title}
      </p>
      <p
        className="text-2xl font-black tracking-tighter text-foreground kpi-main-value"
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {subtitle && (
        <p className="text-[11px] font-medium text-muted-foreground/60 mt-3 border-t border-border/50 pt-3">{subtitle}</p>
      )}
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
