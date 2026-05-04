/**
 * RAG & Groq LLM Service
 * Wraps all /rag/* endpoints from the Qypher backend.
 * Base URL reads from NEXT_PUBLIC_API_URL env var (falls back to localhost:8000).
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GroqModel =
  | "llama-3.3-70b-versatile"
  | "llama2-70b-4096"
  | "gemma-7b-it"
  | "llama3-8b-8192";

export interface RagIngestResponse {
  status: "success" | "error";
  ingested_count: number;
  log_type: string;
}

export interface RagLog {
  id: number;
  timestamp: string;
  severity: "critical" | "high" | "medium" | "low" | string;
  source_ip: string;
  destination_ip: string;
  alert_message: string;
  _similarity_score?: number;
}

export interface RagQueryResponse {
  status: "success" | "error";
  format: "user" | "llm";
  query: string;
  summary: string;
  logs: RagLog[];
}

export interface RagStatsResponse {
  status: "success" | "error";
  stats: {
    vector_count: number;
    embedding_dimension: number;
    cache_size: number;
  };
}

export interface RagClearResponse {
  status: "success" | "error";
  message: string;
}

export interface RagAnalyzeResponse {
  status: "success" | "error";
  query: string;
  model: GroqModel;
  analysis: string;
  context_summary: string;
  retrieved_logs_count: number;
}

export interface RagChatResponse {
  status: "success" | "error";
  message: string;
  response: string;
  log_context_used: boolean;
  logs_retrieved: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[RAG] ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

/**
 * POST /rag/ingest
 * Ingests logs from the database into the vector store.
 */
export async function ragIngest(
  logType: "all" | "qsh" | "suricata" | "zeek" = "all",
  limit = 100
): Promise<RagIngestResponse> {
  return apiFetch<RagIngestResponse>(
    `/rag/ingest?log_type=${logType}&limit=${limit}`,
    { method: "POST" }
  );
}

/**
 * GET /rag/query
 * Semantic search over logs – returns human-readable summary + log list.
 */
export async function ragQuery(
  query: string,
  queryType: "general" | "ip" | "severity" | "threat" = "general",
  k = 5,
  format: "user" | "llm" = "user"
): Promise<RagQueryResponse> {
  const params = new URLSearchParams({
    query,
    query_type: queryType,
    k: String(k),
    format,
  });
  return apiFetch<RagQueryResponse>(`/rag/query?${params}`);
}

/**
 * GET /rag/stats
 * Returns vector store and cache statistics.
 */
export async function ragStats(): Promise<RagStatsResponse> {
  return apiFetch<RagStatsResponse>("/rag/stats");
}

/**
 * POST /rag/clear
 * Resets the RAG vector store.
 */
export async function ragClear(): Promise<RagClearResponse> {
  return apiFetch<RagClearResponse>("/rag/clear", { method: "POST" });
}

/**
 * GET /rag/groq/analyze
 * AI-powered analysis of retrieved logs using Groq LLM.
 */
export async function ragGroqAnalyze(
  query: string,
  k = 15,
  model: GroqModel = "llama-3.3-70b-versatile",
  temperature = 0.7,
  maxTokens = 1024
): Promise<RagAnalyzeResponse> {
  const params = new URLSearchParams({
    query,
    k: String(k),
    model,
    temperature: String(temperature),
    max_tokens: String(maxTokens),
  });
  return apiFetch<RagAnalyzeResponse>(`/rag/groq/analyze?${params}`);
}

/**
 * POST /rag/groq/chat
 * Interactive chat with Groq, optionally backed by security log context.
 * This is the primary endpoint consumed by the chatbot UI.
 */
export async function ragGroqChat(
  message: string,
  logContext = true,
  k = 10,
  model: GroqModel = "llama-3.3-70b-versatile"
): Promise<RagChatResponse> {
  return apiFetch<RagChatResponse>("/rag/groq/chat", {
    method: "POST",
    body: JSON.stringify({ message, log_context: logContext, k, model }),
  });
}
