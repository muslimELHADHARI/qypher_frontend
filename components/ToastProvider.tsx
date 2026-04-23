"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { ShieldAlert, X, CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  description?: string;
}

interface ToastContextType {
  addToast: (message: string, type: Toast["type"], description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"], description?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-80 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-[#0a1628]/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-full transition-all border-[rgba(30,58,95,0.6)]"
          >
            <div className={`mt-0.5 ${
              toast.type === "success" ? "text-emerald-500" :
              toast.type === "error" ? "text-rose-500" :
              toast.type === "warning" ? "text-amber-500" : "text-blue-500"
            }`}>
              {toast.type === "success" && <CheckCircle2 size={18} />}
              {toast.type === "error" && <ShieldAlert size={18} />}
              {toast.type === "warning" && <AlertTriangle size={18} />}
              {toast.type === "info" && <Info size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-100">{toast.message}</h4>
              {toast.description && (
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-500 hover:text-slate-200 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
