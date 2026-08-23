"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BodyMeasurement } from "@/types/BodyMeasurement";

const METRICS = [
  { key: "weightKg", label: "체중", unit: "kg" },
  { key: "skeletalMuscleMassKg", label: "골격근량", unit: "kg" },
  { key: "bodyFatPercent", label: "체지방률", unit: "%" },
  { key: "bmi", label: "BMI", unit: "" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

export function BodyTrendChart({ measurements }: { measurements: BodyMeasurement[] }) {
  const [metric, setMetric] = useState<MetricKey>("weightKg");
  const activeMetric = METRICS.find((m) => m.key === metric)!;

  const chronological = [...measurements].reverse();
  const data = chronological
    .filter((m) => m[metric] !== undefined)
    .map((m) => ({
      date: new Date(m.measuredAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
      value: m[metric] as number,
    }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m.key)}
            className={`rounded-md px-2 py-1 text-xs ${
              metric === m.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {activeMetric.label} 기록이 없습니다.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              tick={{ fontSize: 12 }}
              unit={activeMetric.unit}
              width={50}
            />
            <Tooltip formatter={(value) => [`${value}${activeMetric.unit}`, activeMetric.label]} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-primary, #2563eb)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
