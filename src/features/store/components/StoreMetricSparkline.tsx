"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { StoreDashboardDayMetric } from "@server/store/store.types";

interface StoreMetricSparklineProps {
  data: StoreDashboardDayMetric[];
  color?: string;
  className?: string;
}

export function StoreMetricSparkline({
  data,
  color = "hsl(var(--primary))",
  className,
}: StoreMetricSparklineProps) {
  const hasData = data.some((point) => point.value > 0);
  if (!hasData) return null;

  const chartData = data.map((point) => ({
    date: point.date,
    value: point.value,
  }));

  return (
    <div className={className ?? "h-10 w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill="url(#sparklineFill)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
