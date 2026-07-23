"use client";

import { useEffect, useMemo, useState } from "react";
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
import { ErrorCard } from "@/components/error-card";
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
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error?.message ?? "Analytics could not be loaded");
        }
        return body;
      })
      .then(setData)
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "Analytics could not be loaded");
      });
  }, []);

  const insights = useMemo(() => {
    if (!data) return null;
    const total = data.byClass.reduce((sum, item) => sum + item.count, 0);
    const topClass = [...data.byClass].sort((a, b) => b.count - a.count)[0];
    const high = data.byConfidence.find((item) => item.level === "high")?.count ?? 0;
    const topTeam = [...data.byTeam].sort((a, b) => b.count - a.count)[0];
    return {
      topClass,
      highPct: total ? Math.round((high / total) * 100) : 0,
      topTeam,
    };
  }, [data]);

  if (loadError) {
    return <ErrorCard title="Analytics unavailable" message={loadError} />;
  }

  if (!data || !insights) {
    return (
      <div className="grid animate-pulse gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
        ))}
        <div className="h-80 rounded-xl border border-slate-200 bg-slate-100 sm:col-span-3 dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-500">Primary concentration</p>
          <p className="mt-2 text-lg font-bold text-slate-950 dark:text-white">
            {insights.topClass?.ciClass ?? "No class data"}
          </p>
          <p className="mt-1 text-xs text-slate-500">{insights.topClass?.count ?? 0} findings in the largest CI class</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-500">Decision readiness</p>
          <p className="mt-2 text-lg font-bold text-slate-950 dark:text-white">{insights.highPct}% high confidence</p>
          <p className="mt-1 text-xs text-slate-500">Recommendations with the strongest review signal</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-500">Most recommended</p>
          <p className="mt-2 truncate text-lg font-bold text-slate-950 dark:text-white">{insights.topTeam?.team ?? "No team data"}</p>
          <p className="mt-1 text-xs text-slate-500">{insights.topTeam?.count ?? 0} recommendations</p>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ownership findings by CI class</CardTitle>
          <p className="text-xs text-slate-500">Where the current remediation burden is concentrated.</p>
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
          <CardTitle>Recommendation confidence</CardTitle>
          <p className="text-xs text-slate-500">How much evidence supports the proposed action.</p>
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
          <CardTitle>Recommendation distribution by team</CardTitle>
          <p className="text-xs text-slate-500">Teams receiving the largest share of proposed ownership.</p>
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
