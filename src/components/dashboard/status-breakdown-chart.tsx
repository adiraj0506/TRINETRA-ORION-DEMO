"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { StateStats } from "@/lib/stats";

export function StatusBreakdownChart({ data }: { data: StateStats[] }) {
  const chartData = data.map((s) => ({
    name: s.code,
    Approved: s.approved,
    Pending: s.pending,
    Rejected: s.rejected,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
        <XAxis
          dataKey="name"
          tick={{ fill: "var(--color-ink-soft)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-line)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--color-ink-soft)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-line)" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-paper-raised)",
            border: "1px solid var(--color-line)",
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Approved" stackId="s" fill="var(--color-approved)" />
        <Bar dataKey="Pending" stackId="s" fill="var(--color-pending)" />
        <Bar
          dataKey="Rejected"
          stackId="s"
          fill="var(--color-rejected)"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
