"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Minimize2, Sparkles, Loader2, Zap } from "lucide-react";
import { getMockResponse, type ChatMessage } from "@/data/chatbot_mock";
import { ragGroqChat } from "@/lib/services/ragService";
import Link from "next/link";

const INITIAL_MESSAGE: ChatMessage = {
  id: "init",
  role: "assistant",
  content:
    "Hello, analyst. I'm your Qypher SOC Assistant. Ask me about threats, alerts, QBER anomalies, or incident response.",
  timestamp: new Date(),
};

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
        <Bot size={12} className="text-primary" />
      </div>
      <div className="bubble-assistant px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mb-0.5">
          <Bot size={12} className="text-primary" />
        </div>
      )}
      <div className="flex flex-col gap-1 max-w-[80%]">
        <div
          className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-primary text-white rounded-br-sm shadow-[0_0_12px_rgba(211,84,0,0.3)]"
              : "bubble-assistant rounded-bl-sm"
          }`}
        >
          {msg.content}
        </div>
        {!isUser && msg.type === "code" && (
          <div className="text-[8px] text-emerald-500 font-semibold flex items-center gap-1 self-start ml-1">
            <Zap size={8} />
            Context analyzed
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatbotBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pulse, setPulse] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (open) {
      setPulse(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await ragGroqChat(trimmed, true); // True to always use log context in bubble
      
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        type: response.log_context_used ? "code" : "text",
      };
      
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("RAG API Error in bubble, falling back to mock:", error);
      
      setTimeout(() => {
        const reply = getMockResponse(trimmed);
        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, 800 + Math.random() * 600);
      return; // Early return
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Bubble Button */}
      <button
        id="chatbot-bubble-btn"
        onClick={() => setOpen((p) => !p)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-[0_0_24px_rgba(211,84,0,0.5)] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_0_32px_rgba(211,84,0,0.7)] ${
          pulse ? "animate-[chatpulse_2.5s_ease-in-out_infinite]" : ""
        } ${open ? "rotate-12" : ""}`}
        aria-label="Open SOC Assistant"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
        {pulse && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-background shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[340px] flex flex-col rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.35),0_0_0_1px_rgba(211,84,0,0.15)] transition-all duration-300 origin-bottom-right ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
        style={{ background: "var(--card)" }}
      >
        {/* Header */}
        <div className="relative flex items-center gap-3 px-4 py-3.5 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Bot size={18} className="text-primary" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground tracking-tight">
              Qypher SOC Assistant
            </p>
            <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">
              ● Online — Threat-Aware Mode
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href="/chatbot"
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
              title="Open full chatbot"
            >
              <Sparkles size={13} />
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            >
              <Minimize2 size={13} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar"
          style={{ maxHeight: "340px", minHeight: "260px" }}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        {/* Quick prompts */}
        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          {["Active Alerts", "QBER Status", "Help"].map((label) => (
            <button
              key={label}
              onClick={() => {
                setInput(label);
                setTimeout(() => sendMessage(), 10);
              }}
              className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-border bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-3 pb-3 pt-1">
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-input px-3 py-2 focus-within:border-primary/50 focus-within:shadow-[0_0_0_2px_rgba(211,84,0,0.1)] transition-all">
            <input
              ref={inputRef}
              id="chatbot-bubble-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask the SOC assistant…"
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isTyping ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
