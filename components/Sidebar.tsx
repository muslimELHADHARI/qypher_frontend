"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Shield,
  Settings,
  Globe,
  ChevronLeft,
  ChevronRight,
  Atom,
  MessageSquareText,
} from "lucide-react";
import Logo from "./Logo";
import { useState } from "react";
import { useHealthOverview } from "@/hooks/useHealthOverview";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Live Events", href: "/live-events", icon: Activity },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "QSH Management", href: "/qsh-monitor", icon: Atom },
  { label: "IP Management", href: "/ip-management", icon: Globe },
  { label: "Threat Intel", href: "/threat-intel", icon: Shield },
];

const aiNavItem = {
  label: "SOC Assistant",
  href: "/chatbot",
  icon: MessageSquareText,
};

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { health } = useHealthOverview(10000);

  // Calculate system health status based on running services
  const getSystemStatus = () => {
    if (!health?.tools) return { status: "Unknown", color: "text-muted-foreground", glow: "", icon: "?" };

    const runningServices = Object.values(health.tools).filter((tool: any) => tool.running).length;
    const totalServices = Object.keys(health.tools).length;

    if (runningServices === 4) {
      return {
        status: "Optimal",
        color: "text-emerald-500",
        glow: "shadow-[0_0_12px_#10b98166]",
        icon: "⚡"
      };
    } else if (runningServices === 3) {
      return {
        status: "Healthy",
        color: "text-emerald-400",
        glow: "shadow-[0_0_10px_#34d39944]",
        icon: "✓"
      };
    } else if (runningServices === 2) {
      return {
        status: "Fair",
        color: "text-yellow-500",
        glow: "shadow-[0_0_10px_#eab30844]",
        icon: "⚠"
      };
    } else if (runningServices === 1) {
      return {
        status: "Degraded",
        color: "text-orange-500",
        glow: "shadow-[0_0_10px_#f5a62344]",
        icon: "!"
      };
    } else {
      return {
        status: "Critical",
        color: "text-rose-500",
        glow: "shadow-[0_0_10px_#f4373744]",
        icon: "✕"
      };
    }
  };

  const systemHealth = getSystemStatus();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out ${collapsed ? "w-20" : "w-64"
        } bg-card border-r border-border shadow-xl`}
    >
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-6 py-8 border-b border-border/50">
        <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center">
          <Logo size={32} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight text-foreground uppercase italic">Qypher</h1>
            <p className="text-[10px] text-muted-foreground font-semibold tracking-tighter uppercase">Next-Gen Firewall</p>
          </div>
        )}
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? "nav-link-active" : "hover:bg-primary/5 hover:text-primary"} ${collapsed ? "justify-center px-0" : ""}`}
            >
              <Icon
                size={20}
                className={`flex-shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary"}`}
              />
              {!collapsed && (
                <span className="ml-3 font-semibold tracking-tight truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI Chatbot link — pinned above footer */}
      <div className="px-4 pb-3">
        <Link
          href={aiNavItem.href}
          className={`nav-link ${pathname === aiNavItem.href
            ? "nav-link-active"
            : "hover:bg-primary/5 hover:text-primary"
            } ${collapsed ? "justify-center px-0" : ""} relative overflow-hidden`}
        >
          {/* subtle glow strip */}
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
          <aiNavItem.icon
            size={20}
            className={`flex-shrink-0 transition-colors ${pathname === aiNavItem.href
              ? "text-primary"
              : "text-primary/70"
              }`}
          />
          {!collapsed && (
            <>
              <span className="ml-3 font-semibold tracking-tight truncate">
                {aiNavItem.label}
              </span>
              <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/20">
                AI
              </span>
            </>
          )}
        </Link>
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-6 border-t border-border/30 bg-card/50">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span className="text-muted-foreground/50">System Status</span>
              <div className="flex items-center gap-1.5">
                <span className={`${systemHealth.color} ${systemHealth.glow}`}>
                  {systemHealth.icon}
                </span>
                <span className={`${systemHealth.color}`}>{systemHealth.status}</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span className="text-muted-foreground/50">Services</span>
              <span className="text-muted-foreground/80">
                {health?.tools ? `${Object.values(health.tools).filter((t: any) => t.running).length}/${Object.keys(health.tools).length}` : "–"}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span className="text-muted-foreground/50">Running Version</span>
              <span className="text-muted-foreground/80">1.0.0</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse control */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all z-50 shadow-sm"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
