"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeightLog } from "@/types/WeightLog";

export function WeightTrendChart({ logs }: { logs: WeightLog[] }) {
  const data = logs.map((log) => ({
    date: new Date(log.loggedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
    weightKg: log.weightKg,
  }));

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        선택한 기간에 체중 기록이 없습니다.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis
          domain={["dataMin - 2", "dataMax + 2"]}
          tick={{ fontSize: 12 }}
          unit="kg"
          width={50}
        />
        <Tooltip formatter={(value) => [`${value}kg`, "체중"]} />
        <Line
          type="monotone"
          dataKey="weightKg"
          stroke="var(--color-primary, #2563eb)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
