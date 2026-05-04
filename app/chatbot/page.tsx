"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  Plus,
  Clock,
  Trash2,
  ChevronRight,
  Shield,
  Zap,
  AlertTriangle,
  Activity,
  Copy,
  Check,
} from "lucide-react";
import {
  getMockResponse,
  MOCK_SESSIONS,
  type ChatMessage,
  type ChatSession,
} from "@/data/chatbot_mock";
import { ragGroqChat } from "@/lib/services/ragService";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Quick action suggestions ────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Active Alerts", icon: AlertTriangle, color: "text-severity-high" },
  { label: "QBER Status", icon: Zap, color: "text-primary" },
  { label: "Threat Report", icon: Shield, color: "text-severity-critical" },
  { label: "Live Incidents", icon: Activity, color: "text-emerald-500" },
];

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 group">
      <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
        <Bot size={15} className="text-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground/60 ml-1">
          Qypher AI
        </span>
        <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-sm">
          <div className="flex gap-1.5 items-center h-4">
            <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:160ms]" />
            <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:320ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Message component ───────────────────────────────────────────────────────

function Message({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-end gap-3 group ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-primary/20 border border-primary/40"
            : "bg-primary/15 border border-primary/30"
        }`}
      >
        {isUser ? (
          <span className="text-[11px] font-bold text-primary">SOC</span>
        ) : (
          <Bot size={15} className="text-primary" />
        )}
      </div>

      <div
        className={`flex flex-col gap-1 max-w-[72%] ${isUser ? "items-end" : "items-start"}`}
      >
        <span className="text-[10px] text-muted-foreground/60 mx-1">
          {isUser ? "You" : "Qypher AI"} · {formatTime(msg.timestamp)}
        </span>

        <div
          className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-primary text-white rounded-br-sm shadow-[0_2px_16px_rgba(211,84,0,0.25)]"
              : "bg-card border border-border/60 text-foreground rounded-bl-sm shadow-sm"
          }`}
        >
          {msg.content}
          
          {/* Metadata for assistant messages */}
          {!isUser && msg.type === "code" && (
            <div className="mt-2 text-[9px] text-emerald-500 font-semibold flex items-center gap-1">
              <Zap size={10} />
              Logs analyzed for this response
            </div>
          )}

          {/* Copy button on hover (assistant only) */}
          {!isUser && (
            <button
              onClick={copy}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onAction }: { onAction: (label: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-8 py-12">
      {/* Animated orb */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center animate-[chatpulse_3s_ease-in-out_infinite]">
          <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Bot size={28} className="text-primary" />
          </div>
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-background shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-base font-bold text-foreground tracking-tight">
          Qypher SOC Assistant
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
          Your AI-powered analyst for threat intelligence, alert triage, quantum
          diagnostics, and incident response.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
        {QUICK_ACTIONS.map(({ label, icon: Icon, color }) => (
          <button
            key={label}
            id={`chat-quick-${label.toLowerCase().replace(/\s/g, "-")}`}
            onClick={() => onAction(label)}
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group text-left"
          >
            <Icon size={15} className={`${color} flex-shrink-0`} />
            <span className="text-xs font-semibold text-foreground/80 group-hover:text-foreground">
              {label}
            </span>
            <ChevronRight
              size={12}
              className="text-muted-foreground/40 ml-auto group-hover:text-primary transition-colors"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Session list item ───────────────────────────────────────────────────────

function SessionItem({
  session,
  isActive,
  onClick,
}: {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 rounded-xl transition-all group flex flex-col gap-1 ${
        isActive
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-secondary/60 border border-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-semibold truncate ${isActive ? "text-primary" : "text-foreground/80"}`}
        >
          {session.title}
        </span>
        <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">
          {formatRelativeTime(session.timestamp)}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground/60 truncate leading-relaxed">
        {session.lastMessage}
      </p>
      {session.unread ? (
        <span className="self-start text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white">
          {session.unread} new
        </span>
      ) : null}
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const NEW_SESSION_ID = "new";

export default function ChatbotPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(MOCK_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>(NEW_SESSION_ID);
  const [messagesMap, setMessagesMap] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [useLogContext, setUseLogContext] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeMessages = messagesMap[activeSessionId] ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages, isTyping]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isTyping) return;

      // If new session, create it
      let sessionId = activeSessionId;
      if (sessionId === NEW_SESSION_ID) {
        sessionId = `s-${Date.now()}`;
        const newSession: ChatSession = {
          id: sessionId,
          title: content.slice(0, 40) + (content.length > 40 ? "…" : ""),
          lastMessage: content,
          timestamp: new Date(),
          unread: 0,
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(sessionId);
      }

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessagesMap((prev) => ({
        ...prev,
        [sessionId]: [...(prev[sessionId] ?? []), userMsg],
      }));
      setInput("");
      setIsTyping(true);

      try {
        const response = await ragGroqChat(content, useLogContext);
        
        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          role: "assistant",
          content: response.response,
          timestamp: new Date(),
          type: response.log_context_used ? "code" : "text",
        };
        
        setMessagesMap((prev) => ({
          ...prev,
          [sessionId]: [...(prev[sessionId] ?? []), botMsg],
        }));
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, lastMessage: botMsg.content.slice(0, 60) + "…", timestamp: new Date() }
              : s
          )
        );
      } catch (error) {
        console.error("RAG API Error, falling back to mock data:", error);
        
        // Fallback to mock response
        setTimeout(() => {
          const reply = getMockResponse(content);
          const botMsg: ChatMessage = {
            id: `b-${Date.now()}`,
            role: "assistant",
            content: reply,
            timestamp: new Date(),
          };
          setMessagesMap((prev) => ({
            ...prev,
            [sessionId]: [...(prev[sessionId] ?? []), botMsg],
          }));
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionId
                ? { ...s, lastMessage: reply.slice(0, 60) + "…", timestamp: new Date() }
                : s
            )
          );
          setIsTyping(false);
        }, 800 + Math.random() * 600);
        return; // Early return to avoid setting isTyping to false twice
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, activeSessionId, useLogContext]
  );

  const startNewChat = () => {
    setActiveSessionId(NEW_SESSION_ID);
    setInput("");
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setMessagesMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (activeSessionId === id) setActiveSessionId(NEW_SESSION_ID);
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 rounded-2xl overflow-hidden border border-border/50 shadow-xl bg-card">
      {/* ── Sidebar ── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-border/50 bg-secondary/20">
        {/* Header */}
        <div className="px-4 py-5 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Sparkles size={15} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">SOC Assistant</p>
                <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">
                  ● Active
                </p>
              </div>
            </div>
            <button
              id="chatbot-new-session-btn"
              onClick={startNewChat}
              className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all shadow-[0_0_12px_rgba(211,84,0,0.3)] hover:shadow-[0_0_20px_rgba(211,84,0,0.5)]"
              title="New conversation"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Sessions", value: sessions.length },
              { label: "Alerts", value: "3" },
              { label: "QBER", value: "OK" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-card border border-border/50 rounded-xl p-2 text-center"
              >
                <p className="text-sm font-bold text-foreground">{value}</p>
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
          <div className="flex items-center gap-2 px-1 mb-2">
            <Clock size={11} className="text-muted-foreground/40" />
            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
              Recent
            </span>
          </div>

          {sessions.map((session) => (
            <div key={session.id} className="relative group/session">
              <SessionItem
                session={session}
                isActive={activeSessionId === session.id}
                onClick={() => setActiveSessionId(session.id)}
              />
              <button
                onClick={(e) => deleteSession(session.id, e)}
                className="absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground/0 group-hover/session:text-muted-foreground/50 hover:!text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}

          {sessions.length === 0 && (
            <p className="text-center text-[11px] text-muted-foreground/40 py-8">
              No sessions yet
            </p>
          )}
        </div>

        {/* Footer notice */}
        <div className="px-4 py-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground/40 text-center leading-relaxed">
            Responses are AI-generated. Verify critical actions before executing.
          </p>
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3 bg-card/80 backdrop-blur-sm">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Bot size={17} className="text-primary" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-card shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Qypher SOC Assistant</p>
            <p className="text-[11px] text-muted-foreground/60">
              {activeSessionId === NEW_SESSION_ID
                ? "Start a new investigation"
                : sessions.find((s) => s.id === activeSessionId)?.title ??
                  "Conversation"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar"
        >
          {activeMessages.length === 0 ? (
            <EmptyState onAction={(label) => sendMessage(label)} />
          ) : (
            <>
              {activeMessages.map((msg) => (
                <Message key={msg.id} msg={msg} />
              ))}
              {isTyping && <TypingIndicator />}
            </>
          )}
        </div>

        {/* Input area */}
        <div className="px-6 py-4 border-t border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {QUICK_ACTIONS.map(({ label, icon: Icon, color }) => (
                <button
                  key={label}
                  id={`chatbot-prompt-${label.toLowerCase().replace(/\s/g, "-")}`}
                  onClick={() => sendMessage(label)}
                  className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-border bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  <Icon size={11} className={color} />
                  {label}
                </button>
              ))}
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Log Context
              </span>
              <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${useLogContext ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={useLogContext}
                  onChange={() => setUseLogContext(!useLogContext)}
                />
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${useLogContext ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1 rounded-2xl border border-border/70 bg-input focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_rgba(211,84,0,0.08)] transition-all px-4 py-3">
              <textarea
                ref={inputRef}
                id="chatbot-main-input"
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Describe an alert, ask about a threat, or request a report… (Enter to send)"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none leading-relaxed"
                style={{ minHeight: "24px", maxHeight: "120px" }}
              />
            </div>
            <button
              id="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(211,84,0,0.4)] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-[0_0_12px_rgba(211,84,0,0.2)]"
            >
              {isTyping ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/30 text-center mt-2">
            Shift+Enter for new line · Responses powered by mock data
          </p>
        </div>
      </div>
    </div>
  );
}
