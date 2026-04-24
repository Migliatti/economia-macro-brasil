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
import { PERIOD_PRESETS, type PeriodKey } from "@/lib/bcb";
import { formatDate, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  initial: {
    selic: SeriesPoint[];
    cdi: SeriesPoint[];
    ipca12m: SeriesPoint[];
  };
};

type MergedPoint = {
  date: string;
  selic: number | null;
  cdi: number | null;
  ipca12m: number | null;
};

function mergeByDate(
  selic: SeriesPoint[],
  cdi: SeriesPoint[],
  ipca12m: SeriesPoint[],
): MergedPoint[] {
  const allDates = new Set([
    ...selic.map((p) => p.date),
    ...cdi.map((p) => p.date),
    ...ipca12m.map((p) => p.date),
  ]);
  const sm = Object.fromEntries(selic.map((p) => [p.date, p.value]));
  const cm = Object.fromEntries(cdi.map((p) => [p.date, p.value]));
  const im = Object.fromEntries(ipca12m.map((p) => [p.date, p.value]));
  return Array.from(allDates)
    .sort()
    .map((date) => ({
      date,
      selic: sm[date] ?? null,
      cdi: cm[date] ?? null,
      ipca12m: im[date] ?? null,
    }));
}

function LegendDot({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <svg width="16" height="8" viewBox="0 0 16 8" className="inline-block">
      <line
        x1="0"
        y1="4"
        x2="16"
        y2="4"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={dashed ? "4 2" : undefined}
      />
    </svg>
  );
}

export function OverlayChart({ initial }: Props) {
  const [period, setPeriod] = useState<PeriodKey>("6m");
  const [data, setData] = useState<MergedPoint[]>(() =>
    mergeByDate(initial.selic, initial.cdi, initial.ipca12m),
  );
  const [cache, setCache] = useState<Record<string, MergedPoint[]>>(() => ({
    "6m": mergeByDate(initial.selic, initial.cdi, initial.ipca12m),
  }));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (cache[period]) {
      setData(cache[period]);
      return;
    }
    const days = PERIOD_PRESETS.find((p) => p.key === period)!.days;
    startTransition(async () => {
      const [sr, cr, ir] = await Promise.all([
        fetch(`/api/series/selic?days=${days}`),
        fetch(`/api/series/cdi?days=${days}`),
        fetch(`/api/series/ipca12m?days=${days}`),
      ]);
      if (!sr.ok || !cr.ok || !ir.ok) return;
      const [sj, cj, ij] = await Promise.all([sr.json(), cr.json(), ir.json()]);
      const merged = mergeByDate(sj.data, cj.data, ij.data);
      setCache((prev) => ({ ...prev, [period]: merged }));
      setData(merged);
    });
  }, [period, cache]);

  const latest = data[data.length - 1];

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
            COMPARAÇÃO HISTÓRICA
          </div>
          <div className="mt-1 text-lg font-medium text-[color:var(--text-primary)]">
            Selic vs CDI vs IPCA 12M
          </div>
        </div>
        <div className="flex gap-1">
          {PERIOD_PRESETS.map((p) => (
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

      {latest && (
        <div className="mt-3 flex flex-wrap gap-5 font-mono text-xs">
          <span className="text-[color:var(--color-up)]">
            SELIC {latest.selic !== null ? formatPct(latest.selic) : "—"}
          </span>
          <span className="text-blue-400">
            CDI {latest.cdi !== null ? formatPct(latest.cdi) : "—"}
          </span>
          <span className="text-orange-400">
            IPCA 12M {latest.ipca12m !== null ? formatPct(latest.ipca12m) : "—"}
          </span>
          {latest.selic !== null && latest.ipca12m !== null && (
            <span className="ml-auto text-[color:var(--text-muted)]">
              spread {formatPct(latest.selic - latest.ipca12m)} real
            </span>
          )}
        </div>
      )}

      <div className={cn("mt-4 h-60 w-full transition-opacity", isPending && "opacity-50")}>
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
              width={46}
              tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
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
                value !== null ? formatPct(Number(value)) : "—",
                name === "selic" ? "SELIC" : name === "cdi" ? "CDI" : "IPCA 12M",
              ]}
            />
            <Line
              type="monotone"
              dataKey="selic"
              stroke="var(--color-up)"
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="cdi"
              stroke="#60a5fa"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="ipca12m"
              stroke="#fb923c"
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex gap-5 font-mono text-[10px] text-[color:var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <LegendDot color="var(--color-up)" />
          SELIC
        </span>
        <span className="flex items-center gap-1.5">
          <LegendDot color="#60a5fa" dashed />
          CDI
        </span>
        <span className="flex items-center gap-1.5">
          <LegendDot color="#fb923c" />
          IPCA 12M
        </span>
      </div>
    </div>
  );
}
