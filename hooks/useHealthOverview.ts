"use client";

import { useEffect, useState, useCallback } from "react";

export interface HealthOverview {
    timestamp: string;
    overall_status: string;
    all_tools_running: boolean;
    tools: {
        [key: string]: {
            running: boolean;
            status: string;
        };
    };
}

export function useHealthOverview(pollIntervalMs = 5000) {
    const [health, setHealth] = useState<HealthOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHealthOverview = useCallback(async () => {
        try {
            const res = await fetch("http://localhost:8000/health");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: HealthOverview = await res.json();
            setHealth(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load health overview");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealthOverview();
        const interval = setInterval(fetchHealthOverview, pollIntervalMs);
        return () => clearInterval(interval);
    }, [fetchHealthOverview, pollIntervalMs]);

    return { health, loading, error, refresh: fetchHealthOverview };
}
