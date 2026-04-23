"use client";

import { useState } from "react";
import {
   Settings,
   Bell,
   Users,
   Key,
   Monitor,
   Shield,
   Save,
   RefreshCw,
   Search,
   ChevronRight
} from "lucide-react";

export default function SettingsPage() {
   const [activeTab, setActiveTab] = useState("general");

   const tabs = [
      { id: "general", label: "System Configuration", icon: Monitor },
      { id: "security", label: "Security Policies", icon: Shield },
      { id: "access", label: "Identity & Access", icon: Key },
      { id: "alerts", label: "Notifications", icon: Bell },
   ];

   return (
      <div className="space-y-8">
         {/* Header */}
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold text-slate-100">
                  Platform Settings
               </h1>
               <p className="text-sm text-slate-500 mt-1">
                  Manage global configuration, security thresholds, and access controls
               </p>
            </div>
            <div className="flex gap-3">
               <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors">
                  <RefreshCw size={14} />
                  Revert Changes
               </button>
               <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                  <Save size={14} />
                  Save Changes
               </button>
            </div>
         </div>

         <div className="flex flex-col lg:flex-row gap-8">
            {/* Side Navigation */}
            <aside className="w-full lg:w-72 space-y-1">
               {tabs.map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === tab.id
                        ? "bg-blue-600/10 text-blue-500 border border-blue-600/20"
                        : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                        }`}
                  >
                     <div className="flex items-center gap-3">
                        <tab.icon size={18} />
                        <span className="text-sm font-medium">{tab.label}</span>
                     </div>
                     {activeTab === tab.id && <ChevronRight size={14} />}
                  </button>
               ))}
            </aside>

            {/* Content Area */}
            <div className="flex-1 space-y-8 max-w-4xl">
               {activeTab === "general" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                     <div className="enterprise-card overflow-hidden">
                        <div className="p-6 border-b border-slate-800/50">
                           <h3 className="text-sm font-semibold text-slate-200">Data Acquisition Paths</h3>
                           <p className="text-[11px] text-slate-500 mt-1">Configure directories for real-time security log ingestion</p>
                        </div>
                        <div className="divide-y divide-slate-800/50">
                           {[
                              { label: "Suricata Stream", path: "http://192.168.100.104:8000/stream/suricata", status: "Active" },
                              { label: "ML/Zeek Stream", path: "http://192.168.100.104:8000/stream/ml-zeek", status: "Active" },
                              { label: "Quantum Proxy", path: "http://192.168.100.104:8000/stream/qsh/raw", status: "Syncing" },
                           ].map(log => (
                              <div key={log.label} className="flex items-center justify-between p-6 group hover:bg-slate-800/10">
                                 <div className="space-y-1">
                                    <div className="text-xs font-semibold text-slate-300">{log.label}</div>
                                    <div className="text-[11px] font-mono text-blue-500/80">{log.path}</div>
                                 </div>
                                 <span className={`text-[10px] px-2 py-0.5 rounded-full border ${log.status === "Active" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-blue-500/5 border-blue-500/20 text-blue-500"
                                    } uppercase font-bold`}>{log.status}</span>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="enterprise-card p-6">
                        <h3 className="text-sm font-semibold text-slate-200 mb-6 pb-2 border-b border-slate-800/50">Ingestion Tuning</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <div className="flex justify-between items-center text-xs">
                                 <span className="text-slate-400">Polling Interval</span>
                                 <span className="font-bold text-blue-500">1200ms</span>
                              </div>
                              <input type="range" className="w-full h-1.5 bg-slate-800 appearance-none accent-blue-500 rounded-lg" />
                           </div>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center text-xs">
                                 <span className="text-slate-400">Retention Period</span>
                                 <span className="font-bold text-blue-500">30 Days</span>
                              </div>
                              <input type="range" className="w-full h-1.5 bg-slate-800 appearance-none accent-blue-500 rounded-lg" />
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === "security" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                     <div className="enterprise-card overflow-hidden">
                        <div className="p-6 border-b border-slate-800/50">
                           <h3 className="text-sm font-semibold text-slate-200">Automated Alert Triggers</h3>
                           <p className="text-[11px] text-slate-500 mt-1">Rule-based escalation for hostile network acts</p>
                        </div>
                        <div className="divide-y divide-slate-800/50">
                           {[
                              { label: "Critical Hazard Escalation", desc: "Notify security team of high-confidence breaches", value: "SEV >= 1" },
                              { label: "Bruteforce Velocity", desc: "Escalate when login attempts per IP exceed limit", value: "15/min" },
                              { label: "Quantum Decoherence", desc: "Signal team when QBER exceeds threshold", value: "> 0.05%" },
                           ].map(rule => (
                              <div key={rule.label} className="flex items-center justify-between p-6 hover:bg-slate-800/10">
                                 <div className="space-y-1">
                                    <div className="text-xs font-semibold text-slate-300">{rule.label}</div>
                                    <div className="text-[11px] text-slate-500">{rule.desc}</div>
                                 </div>
                                 <div className="text-xs font-mono font-bold text-blue-500 bg-blue-500/5 px-2 py-1 rounded-lg border border-blue-500/10">{rule.value}</div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === "access" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                     <div className="enterprise-card p-6">
                        <div className="flex items-center justify-between mb-8 pb-2 border-b border-slate-800/50">
                           <h3 className="text-sm font-semibold text-slate-200">API Access Tokens</h3>
                           <button className="text-[11px] font-bold text-blue-500 hover:text-blue-400">+ Issue New Token</button>
                        </div>
                        <div className="space-y-4">
                           {[
                              { id: "SOC_PROX_ADMIN", owner: "Internal Controller", lastUsed: "14 mins ago" },
                              { id: "THREAT_INTEL_SYNC", owner: "External Aggregator", lastUsed: "Just now" },
                           ].map(key => (
                              <div key={key.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                 <div className="flex gap-4 items-center">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/10">
                                       <Key size={14} />
                                    </div>
                                    <div>
                                       <div className="text-xs font-semibold text-slate-200">{key.id}</div>
                                       <div className="text-[10px] text-slate-500">{key.owner}</div>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <div className="text-[10px] text-emerald-500 font-bold uppercase">ACTIVE</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{key.lastUsed}</div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === "alerts" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                     <div className="enterprise-card p-6">
                        <h3 className="text-sm font-semibold text-slate-200 mb-6 pb-2 border-b border-slate-800/50">Notification Channels</h3>
                        <div className="space-y-4">
                           {[
                              { label: "Browser Desk Notifications", status: true },
                              { label: "Console Severity Logs", status: true },
                              { label: "External SIEM Integration", status: false },
                              { label: "Mobile SMS Escalation", status: false },
                           ].map(item => (
                              <div key={item.label} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/10 transition-colors">
                                 <span className="text-sm text-slate-300">{item.label}</span>
                                 <div className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${item.status ? 'bg-blue-600' : 'bg-slate-800'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.status ? 'translate-x-5' : 'translate-x-0'} shadow-sm`} />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
