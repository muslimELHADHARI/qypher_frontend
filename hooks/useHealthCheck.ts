"use client";

import { useEffect, useState, useCallback } from "react";

export interface ServiceHealth {
    label: string;
    status: string;
    color: string;
}

export interface HealthCheckResponse {
    status: string;
    [key: string]: any;
}

export function useHealthCheck(pollIntervalMs = 5000) {
    const [services, setServices] = useState<ServiceHealth[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHealthData = useCallback(async () => {
        try {
            // Fetch all health endpoints
            const [suricataRes, zeekRes, detectionRes, mlRes] = await Promise.allSettled([
                fetch("http://localhost:8000/health/suricata"),
                fetch("http://localhost:8000/health/zeek"),
                fetch("http://localhost:8000/health/detection-suricata"),
                fetch("http://localhost:8000/health/ml-detection"),
            ]);

            const serviceStatus: ServiceHealth[] = [];

            // Suricata
            if (suricataRes.status === "fulfilled" && suricataRes.value.ok) {
                const data: any = await suricataRes.value.json();
                serviceStatus.push({
                    label: "Suricata",
                    status: data.status === "RUNNING" ? "Running" : "Offline",
                    color: data.status === "RUNNING" ? "text-emerald-500" : "text-rose-500",
                });
            } else {
                serviceStatus.push({
                    label: "Suricata",
                    status: "Offline",
                    color: "text-rose-500",
                });
            }

            // Zeek
            if (zeekRes.status === "fulfilled" && zeekRes.value.ok) {
                const data: any = await zeekRes.value.json();
                serviceStatus.push({
                    label: "Zeek",
                    status: data.status === "RUNNING" ? "Active" : "Offline",
                    color: data.status === "RUNNING" ? "text-emerald-400" : "text-rose-500",
                });
            } else {
                serviceStatus.push({
                    label: "Zeek",
                    status: "Offline",
                    color: "text-rose-500",
                });
            }

            // Suricata Detection
            if (detectionRes.status === "fulfilled" && detectionRes.value.ok) {
                const data: any = await detectionRes.value.json();
                serviceStatus.push({
                    label: "Suricata Detection",
                    status: data.status === "RUNNING" ? "Monitoring" : "Offline",
                    color: data.status === "RUNNING" ? "text-emerald-500" : "text-rose-500",
                });
            } else {
                serviceStatus.push({
                    label: "Suricata Detection",
                    status: "Offline",
                    color: "text-rose-500",
                });
            }

            // ML Detection
            if (mlRes.status === "fulfilled" && mlRes.value.ok) {
                const data: any = await mlRes.value.json();
                serviceStatus.push({
                    label: "ML Detection",
                    status: data.status === "RUNNING" ? "Active" : "Idle",
                    color: data.status === "RUNNING" ? "text-emerald-500" : "text-yellow-500",
                });
            } else {
                serviceStatus.push({
                    label: "ML Detection",
                    status: "Idle",
                    color: "text-yellow-500",
                });
            }

            setServices(serviceStatus);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load health data");
            // Keep previous services on error
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealthData();
        const interval = setInterval(fetchHealthData, pollIntervalMs);
        return () => clearInterval(interval);
    }, [fetchHealthData, pollIntervalMs]);

    return { services, loading, error, refresh: fetchHealthData };
}
