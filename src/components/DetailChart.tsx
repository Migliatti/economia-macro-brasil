"use client";

import { useState, useEffect, useTransition } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SeriesPoint } from "@/lib/bcb";
import { formatDate, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IndicatorMeta } from "@/lib/indicators";

type PeriodPreset = { key: string; label: string; days: number };

const PRESETS: PeriodPreset[] = [
  { key: "1m", label: "1M", days: 30 },
  { key: "1y", label: "1A", days: 365 },
  { key: "5y", label: "5A", days: 365 * 5 },
];

type MergedPoint = { date: string; main: number | null; ipca12m: number | null };

function merge(main: SeriesPoint[], ipca12m: SeriesPoint[]): MergedPoint[] {
  const im = new Map(ipca12m.map((p) => [p.date, p.value]));
  const all = new Set([...main.map((p) => p.date), ...ipca12m.map((p) => p.date)]);
  const mm = new Map(main.map((p) => [p.date, p.value]));
  return Array.from(all)
    .sort()
    .map((date) => ({
      date,
      main: mm.get(date) ?? null,
      ipca12m: im.get(date) ?? null,
    }));
}

type Props = {
  meta: IndicatorMeta;
  initialMain: SeriesPoint[];
  initialIpca12m: SeriesPoint[];
};

export function DetailChart({ meta, initialMain, initialIpca12m }: Props) {
  const [period, setPeriod] = useState<string>("1y");
  const [data, setData] = useState<MergedPoint[]>(() =>
    merge(initialMain, initialIpca12m),
  );
  const [cache, setCache] = useState<Record<string, MergedPoint[]>>(() => ({
    "1y": merge(initialMain, initialIpca12m),
  }));
  const [isPending, startTransition] = useTransition();

  const showIpca = meta.key === "selic" || meta.key === "cdi";

  useEffect(() => {
    if (cache[period]) {
      setData(cache[period]);
      return;
    }
    const days = PRESETS.find((p) => p.key === period)!.days;
    startTransition(async () => {
      const [mr, ir] = await Promise.all([
        fetch(`/api/series/${meta.key}?days=${days}`),
        showIpca ? fetch(`/api/series/ipca12m?days=${days}`) : Promise.resolve(null),
      ]);
      if (!mr.ok) return;
      const mj = await mr.json();
      const ij = ir && ir.ok ? await ir.json() : { data: [] };
      const merged = merge(mj.data, ij.data);
      setCache((prev) => ({ ...prev, [period]: merged }));
      setData(merged);
    });
  }, [period, cache, meta.key, showIpca]);

  const latest = data[data.length - 1];
  const isCurrency = meta.unit === "currency-brl";

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
            HISTÓRICO
          </div>
          <div className="mt-1 text-lg font-medium text-[color:var(--text-primary)]">
            {meta.label}
            {showIpca && (
              <span className="ml-2 text-sm font-normal text-[color:var(--text-muted)]">
                vs IPCA 12M
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-md px-3 py-1 font-mono text-xs transition-colors",
                period === p.key
                  ? "bg-[color:var(--btn-active)] text-[color:var(--text-primary)]"
                  : "text-[color:var(--text-muted)] hover:bg-[color:var(--btn-hover)] hover:text-[color:var(--text-primary)]",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {latest && showIpca && (
        <div className="mt-3 flex gap-5 font-mono text-xs">
          <span className="text-[color:var(--color-up)]">
            {meta.shortLabel}{" "}
            {latest.main !== null
              ? `${latest.main.toFixed(2)}%`
              : "—"}
          </span>
          <span className="text-orange-400">
            IPCA 12M{" "}
            {latest.ipca12m !== null ? `${latest.ipca12m.toFixed(2)}%` : "—"}
          </span>
        </div>
      )}

      <div className={cn("mt-4 h-72 w-full transition-opacity", isPending && "opacity-50")}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid
              stroke="var(--grid-line)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{
                fill: "var(--text-muted)",
                fontSize: 10,
                fontFamily: "var(--font-geist-mono)",
              }}
              tickFormatter={(d) => {
                const [y, m] = (d as string).split("-");
                return `${m}/${y.slice(2)}`;
              }}
              tickLine={false}
              axisLine={{ stroke: "var(--grid-line)" }}
              minTickGap={48}
            />
            <YAxis
              tick={{
                fill: "var(--text-muted)",
                fontSize: 10,
                fontFamily: "var(--font-geist-mono)",
              }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              width={50}
              tickFormatter={(v) =>
                isCurrency ? Number(v).toFixed(2) : `${Number(v).toFixed(1)}%`
              }
            />
            <Tooltip
              contentStyle={{
                background: "var(--tooltip-bg)",
                border: "1px solid var(--border-accent)",
                borderRadius: 8,
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11,
              }}
              labelFormatter={(l) => formatDate(l as string)}
              formatter={(value, name) => [
                value !== null
                  ? isCurrency
                    ? Number(value).toFixed(4)
                    : formatPct(Number(value))
                  : "—",
                name === "main" ? meta.shortLabel : "IPCA 12M",
              ]}
            />
            <Line
              type="monotone"
              dataKey="main"
              stroke="var(--color-up)"
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            {showIpca && (
              <Line
                type="monotone"
                dataKey="ipca12m"
                stroke="#fb923c"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
