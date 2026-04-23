"use client";

import { useEffect, useState, useCallback } from "react";
import { StatsResponse } from "@/types/security";

export function useStats(pollIntervalMs = 5000) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StatsResponse = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchStats, pollIntervalMs]);

  return { stats, loading, error, refresh: fetchStats };
}
