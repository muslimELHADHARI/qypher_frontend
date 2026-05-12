"use client";

import React, { useMemo, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Legend,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";

interface AttackVectorsProps {
    data: Array<{ name: string; value: number }>;
    totalVectors: number;
    stats?: any;
}

const COLORS = ["#10b981", "#f59e0b", "#f43f5e", "#6366f1", "#8b5cf6"];

export function AttackVectorsDisplay({
    data,
    totalVectors,
    stats,
}: AttackVectorsProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const totalValue = useMemo(() => {
        return data.reduce((sum, item) => sum + item.value, 0);
    }, [data]);

    const dataWithPercentage = useMemo(() => {
        return data.map((item) => ({
            ...item,
            percentage: ((item.value / totalValue) * 100).toFixed(1),
        }));
    }, [data, totalValue]);

    const topVector = useMemo(() => {
        return data.length > 0 ? data[0] : null;
    }, [data]);

    return (
        <div className="enterprise-card p-6 flex flex-col h-full">
            {/* Header */}
            <div className="mb-6 border-b border-border/50 pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/30">
                                <AlertTriangle size={14} className="text-orange-500" />
                            </span>
                            Top Attack Vectors
                        </h2>
                        <p className="text-xs text-muted-foreground mt-2">
                            Distribution of the most frequent attack patterns detected.
                        </p>
                    </div>
                    {topVector && (
                        <div className="flex flex-col items-end gap-1">
                            <div className="text-right">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                    Leading Threat
                                </p>
                                <p className="text-sm font-bold text-foreground mt-1">
                                    {topVector.name}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6">
                {/* Chart Section */}
                <div className="flex-1 flex items-center justify-center relative min-h-[320px]">
                    {data.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        {COLORS.map((color, idx) => (
                                            <linearGradient
                                                key={`grad-${idx}`}
                                                id={`colorGradient${idx}`}
                                                x1="0%"
                                                y1="0%"
                                                x2="100%"
                                                y2="100%"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor={color}
                                                    stopOpacity={0.8}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor={color}
                                                    stopOpacity={0.5}
                                                />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={120}
                                        paddingAngle={6}
                                        dataKey="value"
                                        nameKey="name"
                                        stroke="var(--card)"
                                        strokeWidth={3}
                                        onMouseEnter={(_, index) => setHoveredIndex(index)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={`url(#colorGradient${index % COLORS.length})`}
                                                opacity={
                                                    hoveredIndex === null || hoveredIndex === index
                                                        ? 1
                                                        : 0.4
                                                }
                                                style={{ transition: "opacity 0.3s ease" }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--card)",
                                            borderColor: "var(--primary)",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
                                            border: "1px solid var(--border)",
                                        }}
                                        itemStyle={{
                                            fontWeight: 600,
                                            color: "var(--foreground)",
                                        }}
                                        formatter={(value: number, name: string, props: any) => [
                                            `${value} incidents`,
                                            props.payload.name,
                                        ]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Display */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <p className="text-4xl font-black text-foreground tracking-tight">
                                        {data.length}
                                    </p>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-2">
                                        Active Vectors
                                    </p>
                                    <div className="flex items-center justify-center gap-1 mt-3 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                                        <TrendingUp size={12} className="text-primary" />
                                        <span className="text-[10px] font-semibold text-primary">
                                            {totalValue.toLocaleString()} events
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                            <AlertTriangle size={32} className="opacity-50" />
                            <p className="text-sm font-semibold">No attack data available</p>
                        </div>
                    )}
                </div>

                {/* Legend Section with Stats */}
                <div className="w-full lg:w-56 flex flex-col justify-center">
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                            Vector Breakdown
                        </p>
                        {dataWithPercentage.map((item, index) => (
                            <div
                                key={index}
                                className={`group p-3 rounded-lg border border-border/30 cursor-pointer transition-all ${hoveredIndex === index
                                        ? "bg-primary/5 border-primary/50 shadow-md"
                                        : "hover:bg-muted/30 hover:border-border/60"
                                    }`}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-card"
                                            style={{
                                                background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                                                ringColor: COLORS[index % COLORS.length],
                                            }}
                                        />
                                        <span className="text-xs font-semibold text-foreground truncate">
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-primary whitespace-nowrap">
                                        {item.percentage}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        {item.value.toLocaleString()} incidents
                                    </span>
                                    <span className="text-[9px] font-semibold text-muted-foreground/70">
                                        #{index + 1}
                                    </span>
                                </div>
                                {/* Progress bar */}
                                <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{
                                            width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`,
                                            background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Stats */}
            {data.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border/50 grid grid-cols-3 gap-3">
                    <div className="text-center">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Avg per Vector
                        </p>
                        <p className="text-lg font-bold text-foreground mt-1">
                            {Math.round(totalValue / data.length).toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center border-l border-r border-border/30">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Total Detected
                        </p>
                        <p className="text-lg font-bold text-foreground mt-1">
                            {totalValue.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Detection Rate
                        </p>
                        <p className="text-lg font-bold text-primary mt-1">
                            100%
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
