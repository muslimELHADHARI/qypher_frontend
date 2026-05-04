"use client";

import { useState } from "react";
import {
    X,
    Upload,
    Search,
    BarChart3,
    Trash2,
    Sparkles,
    Loader2,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import {
    ragIngest,
    ragQuery,
    ragStats,
    ragClear,
    ragGroqAnalyze,
    type GroqModel,
    type RagStatsResponse,
} from "@/lib/services/ragService";

interface TabProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    icon: React.ReactNode;
}

function Tab({ active, onClick, children, icon }: TabProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${active
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent"
                }`}
        >
            {icon}
            {children}
        </button>
    );
}

interface RAGManagementPanelProps {
    onClose: () => void;
}

export function RAGManagementPanel({ onClose }: RAGManagementPanelProps) {
    const [activeTab, setActiveTab] = useState<"ingest" | "query" | "stats" | "analyze" | "clear">(
        "ingest"
    );
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Ingest
    const [ingestLogType, setIngestLogType] = useState<"all" | "qsh" | "suricata" | "zeek">("all");
    const [ingestLimit, setIngestLimit] = useState(500);

    // Query
    const [queryText, setQueryText] = useState("");
    const [queryType, setQueryType] = useState<"general" | "ip" | "severity" | "threat">("general");
    const [queryK, setQueryK] = useState(10);
    const [queryFormat, setQueryFormat] = useState<"user" | "llm">("user");
    const [queryResults, setQueryResults] = useState<any>(null);

    // Analyze
    const [analyzeQuery, setAnalyzeQuery] = useState("");
    const [analyzeK, setAnalyzeK] = useState(15);
    const [analyzeModel, setAnalyzeModel] = useState<GroqModel>("llama-3.3-70b-versatile");
    const [analyzeTemp, setAnalyzeTemp] = useState(0.7);
    const [analyzeTokens, setAnalyzeTokens] = useState(1024);
    const [analyzeResults, setAnalyzeResults] = useState<any>(null);

    // Stats
    const [statsData, setStatsData] = useState<RagStatsResponse | null>(null);

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleIngest = async () => {
        try {
            setLoading(true);
            const result = await ragIngest(ingestLogType, ingestLimit);
            showMessage("success", `✓ Ingested ${result.ingested_count} logs (${result.log_type})`);
        } catch (error: any) {
            showMessage("error", `✗ Ingest failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleQuery = async () => {
        if (!queryText.trim()) {
            showMessage("error", "Query cannot be empty");
            return;
        }
        try {
            setLoading(true);
            const result = await ragQuery(queryText, queryType, queryK, queryFormat);
            setQueryResults(result);
            showMessage("success", `✓ Retrieved ${result.logs?.length || 0} logs`);
        } catch (error: any) {
            showMessage("error", `✗ Query failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGetStats = async () => {
        try {
            setLoading(true);
            const result = await ragStats();
            setStatsData(result);
            showMessage("success", "✓ Stats retrieved");
        } catch (error: any) {
            showMessage("error", `✗ Stats failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!analyzeQuery.trim()) {
            showMessage("error", "Query cannot be empty");
            return;
        }
        try {
            setLoading(true);
            const result = await ragGroqAnalyze(analyzeQuery, analyzeK, analyzeModel, analyzeTemp, analyzeTokens);
            setAnalyzeResults(result);
            showMessage("success", `✓ Analysis complete (${result.retrieved_logs_count} logs used)`);
        } catch (error: any) {
            showMessage("error", `✗ Analysis failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (!window.confirm("⚠️ This will clear all ingested logs from the RAG system. Continue?")) {
            return;
        }
        try {
            setLoading(true);
            await ragClear();
            setStatsData(null);
            setQueryResults(null);
            showMessage("success", "✓ RAG system cleared");
        } catch (error: any) {
            showMessage("error", `✗ Clear failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card border border-border/50 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-secondary/30">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Sparkles size={18} className="text-primary" />
                        RAG Management
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-secondary/60 rounded-lg transition-colors"
                    >
                        <X size={18} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 px-6 py-4 border-b border-border/50 overflow-x-auto">
                    <Tab
                        active={activeTab === "ingest"}
                        onClick={() => setActiveTab("ingest")}
                        icon={<Upload size={14} />}
                    >
                        Ingest
                    </Tab>
                    <Tab
                        active={activeTab === "query"}
                        onClick={() => setActiveTab("query")}
                        icon={<Search size={14} />}
                    >
                        Query
                    </Tab>
                    <Tab
                        active={activeTab === "analyze"}
                        onClick={() => setActiveTab("analyze")}
                        icon={<Sparkles size={14} />}
                    >
                        Analyze
                    </Tab>
                    <Tab
                        active={activeTab === "stats"}
                        onClick={() => setActiveTab("stats")}
                        icon={<BarChart3 size={14} />}
                    >
                        Stats
                    </Tab>
                    <Tab
                        active={activeTab === "clear"}
                        onClick={() => setActiveTab("clear")}
                        icon={<Trash2 size={14} />}
                    >
                        Clear
                    </Tab>
                </div>

                {/* Message */}
                {message && (
                    <div
                        className={`mx-6 mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${message.type === "success"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                            }`}
                    >
                        {message.type === "success" ? (
                            <CheckCircle size={14} />
                        ) : (
                            <AlertCircle size={14} />
                        )}
                        {message.text}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* INGEST TAB */}
                    {activeTab === "ingest" && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-foreground block mb-2">
                                    Log Type
                                </label>
                                <select
                                    value={ingestLogType}
                                    onChange={(e) =>
                                        setIngestLogType(e.target.value as "all" | "qsh" | "suricata" | "zeek")
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm"
                                >
                                    <option value="all">All Logs</option>
                                    <option value="qsh">QSH Logs</option>
                                    <option value="suricata">Suricata Logs</option>
                                    <option value="zeek">Zeek Logs</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-foreground block mb-2">
                                    Limit: {ingestLimit}
                                </label>
                                <input
                                    type="range"
                                    min="10"
                                    max="1000"
                                    step="10"
                                    value={ingestLimit}
                                    onChange={(e) => setIngestLimit(Number(e.target.value))}
                                    className="w-full h-1.5 bg-secondary rounded-full cursor-pointer"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Max logs to ingest (10-1000)
                                </p>
                            </div>

                            <button
                                onClick={handleIngest}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                Ingest Logs
                            </button>
                        </div>
                    )}

                    {/* QUERY TAB */}
                    {activeTab === "query" && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-foreground block mb-2">Query</label>
                                <textarea
                                    value={queryText}
                                    onChange={(e) => setQueryText(e.target.value)}
                                    placeholder="Enter your search query..."
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm resize-none h-24"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-foreground block mb-2">
                                        Query Type
                                    </label>
                                    <select
                                        value={queryType}
                                        onChange={(e) =>
                                            setQueryType(e.target.value as "general" | "ip" | "severity" | "threat")
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm"
                                    >
                                        <option value="general">General</option>
                                        <option value="ip">IP-Based</option>
                                        <option value="severity">Severity</option>
                                        <option value="threat">Threat</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-foreground block mb-2">
                                        Results (k): {queryK}
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={queryK}
                                        onChange={(e) => setQueryK(Number(e.target.value))}
                                        className="w-full h-1.5 bg-secondary rounded-full cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-foreground block mb-2">Format</label>
                                <div className="flex gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                                        <input
                                            type="radio"
                                            name="format"
                                            value="user"
                                            checked={queryFormat === "user"}
                                            onChange={(e) => setQueryFormat(e.target.value as "user" | "llm")}
                                            className="w-3 h-3"
                                        />
                                        <span className="text-xs text-foreground">User Friendly</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                                        <input
                                            type="radio"
                                            name="format"
                                            value="llm"
                                            checked={queryFormat === "llm"}
                                            onChange={(e) => setQueryFormat(e.target.value as "user" | "llm")}
                                            className="w-3 h-3"
                                        />
                                        <span className="text-xs text-foreground">LLM Format</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleQuery}
                                disabled={loading || !queryText.trim()}
                                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                Execute Query
                            </button>

                            {queryResults && (
                                <div className="mt-4 p-4 bg-secondary/30 rounded-lg border border-border/50 max-h-48 overflow-y-auto">
                                    <p className="text-xs font-semibold text-foreground mb-2">Summary:</p>
                                    <p className="text-xs text-muted-foreground">{queryResults.summary}</p>
                                    <p className="text-xs text-primary font-semibold mt-3">
                                        {queryResults.logs?.length || 0} logs retrieved
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ANALYZE TAB */}
                    {activeTab === "analyze" && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-foreground block mb-2">Query</label>
                                <textarea
                                    value={analyzeQuery}
                                    onChange={(e) => setAnalyzeQuery(e.target.value)}
                                    placeholder="Enter your analysis question..."
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm resize-none h-20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-foreground block mb-2">
                                        Logs (k): {analyzeK}
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={analyzeK}
                                        onChange={(e) => setAnalyzeK(Number(e.target.value))}
                                        className="w-full h-1.5 bg-secondary rounded-full cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-foreground block mb-2">Model</label>
                                    <select
                                        value={analyzeModel}
                                        onChange={(e) => setAnalyzeModel(e.target.value as GroqModel)}
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm"
                                    >
                                        <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                                        <option value="llama2-70b-4096">Llama 2 70B</option>
                                        <option value="llama3-8b-8192">Llama 3 8B</option>
                                        <option value="gemma-7b-it">Gemma 7B</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-foreground block mb-2">
                                        Temperature: {analyzeTemp.toFixed(1)}
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={analyzeTemp}
                                        onChange={(e) => setAnalyzeTemp(Number(e.target.value))}
                                        className="w-full h-1.5 bg-secondary rounded-full cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-foreground block mb-2">
                                        Max Tokens: {analyzeTokens}
                                    </label>
                                    <input
                                        type="range"
                                        min="256"
                                        max="4096"
                                        step="256"
                                        value={analyzeTokens}
                                        onChange={(e) => setAnalyzeTokens(Number(e.target.value))}
                                        className="w-full h-1.5 bg-secondary rounded-full cursor-pointer"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={loading || !analyzeQuery.trim()}
                                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                Analyze
                            </button>

                            {analyzeResults && (
                                <div className="mt-4 p-4 bg-secondary/30 rounded-lg border border-border/50 max-h-48 overflow-y-auto">
                                    <p className="text-xs font-semibold text-foreground mb-2">Analysis:</p>
                                    <p className="text-xs text-muted-foreground line-clamp-6">
                                        {analyzeResults.analysis}
                                    </p>
                                    <p className="text-xs text-primary font-semibold mt-3">
                                        Used {analyzeResults.retrieved_logs_count} logs
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STATS TAB */}
                    {activeTab === "stats" && (
                        <div className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                                View current RAG system statistics and cache status.
                            </p>

                            <button
                                onClick={handleGetStats}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
                                Fetch Stats
                            </button>

                            {statsData && (
                                <div className="p-4 bg-secondary/30 rounded-lg border border-border/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-foreground">Vector Count:</span>
                                        <span className="text-sm font-bold text-primary">
                                            {statsData.stats.vector_count}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-foreground">
                                            Embedding Dimension:
                                        </span>
                                        <span className="text-sm font-bold text-primary">
                                            {statsData.stats.embedding_dimension}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-foreground">Cache Size:</span>
                                        <span className="text-sm font-bold text-primary">
                                            {statsData.stats.cache_size}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CLEAR TAB */}
                    {activeTab === "clear" && (
                        <div className="space-y-4">
                            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                                <p className="text-xs font-semibold text-destructive mb-2">⚠️ Danger Zone</p>
                                <p className="text-xs text-muted-foreground">
                                    This action will permanently delete all ingested logs from the RAG vector store.
                                    This cannot be undone.
                                </p>
                            </div>

                            <button
                                onClick={handleClear}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-destructive text-white rounded-lg font-semibold text-sm hover:bg-destructive/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                Clear RAG System
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
