"use client";

import { SecurityEvent } from "@/types/security";
import { X, Copy, Check } from "lucide-react";
import { useState } from "react";

interface EventDetailModalProps {
  event: SecurityEvent;
  onClose: () => void;
}

export default function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const [copied, setCopied] = useState(false);

  const copyRaw = async () => {
    await navigator.clipboard.writeText(event.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const severityColor =
    event.severity === "CRITICAL"
      ? "#ff2d55"
      : event.severity === "HIGH"
      ? "#ff9500"
      : event.severity === "MEDIUM"
      ? "#ffcc00"
      : "#30d158";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #0a1628, #060e1a)",
          border: "1px solid rgba(30, 58, 95, 0.8)",
          boxShadow: `0 0 60px rgba(0, 0, 0, 0.5), 0 0 30px ${severityColor}15`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(30,58,95,0.4)]">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: severityColor }}
            />
            <h2 className="text-base font-semibold text-[#e2e8f0]">
              Event Detail
            </h2>
            <span
              className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{
                backgroundColor: `${severityColor}18`,
                color: severityColor,
                borderColor: `${severityColor}40`,
              }}
            >
              {event.severity}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[#64748b] hover:text-[#e2e8f0]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Timestamp", value: event.timestamp },
              { label: "Source", value: event.source.toUpperCase() },
              { label: "Source IP", value: `${event.src_ip}${event.src_port ? `:${event.src_port}` : ""}` },
              { label: "Dest IP", value: `${event.dst_ip}${event.dst_port ? `:${event.dst_port}` : ""}` },
              { label: "Attack Type", value: event.attack_type },
              { label: "Protocol", value: event.protocol || "N/A" },
              ...(event.confidence != null
                ? [{ label: "Confidence", value: `${(event.confidence * 100).toFixed(1)}%` }]
                : []),
              ...(event.uid ? [{ label: "UID", value: event.uid }] : []),
            ].map((field) => (
              <div
                key={field.label}
                className="rounded-lg bg-[rgba(15,30,53,0.6)] px-3 py-2.5 border border-[rgba(30,58,95,0.3)]"
              >
                <p className="text-[10px] uppercase tracking-wider text-[#64748b] mb-0.5">
                  {field.label}
                </p>
                <p className="text-sm text-[#e2e8f0] font-mono truncate">{field.value}</p>
              </div>
            ))}
          </div>

          {/* Raw log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-[#64748b]">
                Raw Log Line
              </p>
              <button
                onClick={copyRaw}
                className="flex items-center gap-1 text-[10px] text-[#64748b] hover:text-[#00d4ff] transition-colors"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="text-xs text-[#94a3b8] bg-[rgba(5,10,15,0.6)] rounded-lg p-3 overflow-x-auto border border-[rgba(30,58,95,0.3)] font-mono whitespace-pre-wrap break-all leading-relaxed">
              {event.raw}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
