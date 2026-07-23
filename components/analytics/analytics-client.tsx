"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsData } from "@/lib/types";

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "#10b981",
  medium: "#f59e0b",
  low: "#f43f5e",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

const CHART_COLORS = [
  "#2563eb",
  "#8b5cf6",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return <p className="text-sm text-zinc-400">Loading analytics…</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ownership Issues by CI Class</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byClass}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
              <XAxis dataKey="ciClass" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.byClass.map((entry, index) => (
                  <Cell
                    key={entry.ciClass}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommendation Confidence</CardTitle>
        </CardHeader>
        <CardContent className="flex h-72 flex-col">
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.byConfidence}
                  dataKey="count"
                  nameKey="level"
                  innerRadius={48}
                  outerRadius={82}
                >
                  {data.byConfidence.map((entry) => (
                    <Cell key={entry.level} fill={CONFIDENCE_COLORS[entry.level]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    CONFIDENCE_LABELS[String(name)] ?? String(name),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
            {data.byConfidence.map((entry) => (
              <div key={entry.level} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CONFIDENCE_COLORS[entry.level] }}
                />
                <span className="text-zinc-600 dark:text-zinc-300">
                  {CONFIDENCE_LABELS[entry.level]}:{" "}
                  <span className="font-semibold tabular-nums">{entry.count}</span>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recommendation Distribution by Team</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byTeam} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="team" width={120} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.byTeam.map((entry, index) => (
                  <Cell
                    key={entry.team}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
