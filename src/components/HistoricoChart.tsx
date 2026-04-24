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
import { INDICATORS, INDICATOR_ORDER, type IndicatorKey } from "@/lib/indicators";
import { formatDate, formatPct, formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

type NormMode = "abs" | "base100" | "pct";

type Props = {
  initial: Record<IndicatorKey, SeriesPoint[]>;
};

type Row = { date: string } & Partial<Record<IndicatorKey, number>>;

const COLORS: Record<IndicatorKey, string> = {
  selic: "var(--color-up)",
  cdi: "#60a5fa",
  ipca: "#f59e0b",
  ipca12m: "#fb923c",
  cambio: "#c084fc",
};

function normalise(
  series: SeriesPoint[],
  mode: NormMode,
): Map<string, number> {
  if (mode === "abs") return new Map(series.map((p) => [p.date, p.value]));
  const base = series[0]?.value;
  if (!base) return new Map();
  return new Map(
    series.map((p) => [
      p.date,
      mode === "base100" ? (p.value / base) * 100 : ((p.value - base) / base) * 100,
    ]),
  );
}

function mergeAll(
  data: Partial<Record<IndicatorKey, SeriesPoint[]>>,
  active: Set<IndicatorKey>,
  mode: NormMode,
): Row[] {
  const all = new Set<string>();
  for (const k of active) {
    (data[k] ?? []).forEach((p) => all.add(p.date));
  }
  const maps: Partial<Record<IndicatorKey, Map<string, number>>> = {};
  for (const k of active) maps[k] = normalise(data[k] ?? [], mode);

  return Array.from(all)
    .sort()
    .map((date) => {
      const row: Row = { date };
      for (const k of active) row[k] = maps[k]?.get(date);
      return row;
    });
}

export function HistoricoChart({ initial }: Props) {
  const [period, setPeriod] = useState<PeriodKey>("5y");
  const [norm, setNorm] = useState<NormMode>("abs");
  const [active, setActive] = useState<Set<IndicatorKey>>(
    new Set(["selic", "ipca12m", "cdi", "cambio"]),
  );
  const [seriesData, setSeriesData] = useState<
    Partial<Record<IndicatorKey, SeriesPoint[]>>
  >(() => {
    const d: Partial<Record<IndicatorKey, SeriesPoint[]>> = {};
    INDICATOR_ORDER.forEach((k) => (d[k] = initial[k]));
    return d;
  });
  const [cache, setCache] = useState<
    Partial<Record<string, Partial<Record<IndicatorKey, SeriesPoint[]>>>>
  >({ "5y": Object.fromEntries(INDICATOR_ORDER.map((k) => [k, initial[k]])) as Record<IndicatorKey, SeriesPoint[]> });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (cache[period]) {
      setSeriesData(cache[period]!);
      return;
    }
    const days = PERIOD_PRESETS.find((p) => p.key === period)!.days;
    startTransition(async () => {
      const entries = await Promise.all(
        INDICATOR_ORDER.map(async (k) => {
          const res = await fetch(`/api/series/${k}?days=${days}`);
          if (!res.ok) return [k, [] as SeriesPoint[]] as const;
          const j = await res.json();
          return [k, j.data as SeriesPoint[]] as const;
        }),
      );
      const sd = Object.fromEntries(entries) as Record<IndicatorKey, SeriesPoint[]>;
      setCache((prev) => ({ ...prev, [period]: sd }));
      setSeriesData(sd);
    });
  }, [period, cache]);

  const data = mergeAll(seriesData, active, norm);

  const toggleKey = (k: IndicatorKey) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(k) && next.size > 1) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const yLabel = norm === "abs" ? undefined : norm === "base100" ? "base 100" : "% var.";

  return (
    <div className="glass-panel rounded-xl p-5">
      {/* Control bar */}
      <div className="flex flex-wrap items-start gap-6 pb-4 border-b border-[color:var(--grid-line)]">
        {/* Series toggles */}
        <div>
          <div className="mb-2 font-mono text-[9px] tracking-[0.15em] text-[color:var(--text-muted)]">
            SÉRIES
          </div>
          <div className="flex flex-wrap gap-2">
            {INDICATOR_ORDER.map((k) => (
              <button
                key={k}
                onClick={() => toggleKey(k)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] transition-colors",
                  active.has(k)
                    ? "border-transparent bg-[color:var(--btn-active)] text-[color:var(--text-primary)]"
                    : "border-[color:var(--panel-border)] text-[color:var(--text-muted)] hover:border-[color:var(--border-accent)]",
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: COLORS[k] }}
                />
                {INDICATORS[k].shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Period */}
        <div>
          <div className="mb-2 font-mono text-[9px] tracking-[0.15em] text-[color:var(--text-muted)]">
            PERÍODO
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

        {/* Normalise */}
        <div>
          <div className="mb-2 font-mono text-[9px] tracking-[0.15em] text-[color:var(--text-muted)]">
            NORMALIZAR
          </div>
          <div className="flex gap-1">
            {(
              [
                { key: "abs", label: "abs" },
                { key: "base100", label: "base 100" },
                { key: "pct", label: "% var." },
              ] as const
            ).map((o) => (
              <button
                key={o.key}
                onClick={() => setNorm(o.key)}
                className={cn(
                  "rounded-md px-3 py-1 font-mono text-xs transition-colors",
                  norm === o.key
                    ? "bg-[color:var(--btn-active)] text-[color:var(--text-primary)]"
                    : "text-[color:var(--text-muted)] hover:bg-[color:var(--btn-hover)] hover:text-[color:var(--text-primary)]",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className={cn("mt-4 h-80 w-full transition-opacity", isPending && "opacity-50")}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
              minTickGap={60}
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
              width={norm !== "abs" ? 50 : 55}
              tickFormatter={(v) => {
                if (norm !== "abs") return `${Number(v).toFixed(1)}${norm === "base100" ? "" : "%"}`;
                return Number(v).toFixed(1);
              }}
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
              formatter={(value, name) => {
                const k = name as IndicatorKey;
                const v = Number(value);
                if (norm !== "abs") return [`${v.toFixed(2)}${norm === "pct" ? "%" : ""}`, INDICATORS[k]?.shortLabel ?? name];
                const meta = INDICATORS[k];
                if (!meta) return [v.toFixed(2), name];
                return [
                  meta.unit === "currency-brl"
                    ? formatBRL(v)
                    : formatPct(v),
                  meta.shortLabel,
                ];
              }}
            />
            {INDICATOR_ORDER.filter((k) => active.has(k)).map((k) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={COLORS[k]}
                strokeWidth={k === "selic" ? 2 : 1.5}
                strokeDasharray={k === "cdi" ? "5 3" : undefined}
                dot={(props: any) => {
                  const { cx, cy, index } = props;
                  if (index === 0 || !data[index - 1]) return <circle cx={cx} cy={cy} r={0} />;
                  const prev = data[index - 1][k];
                  const curr = data[index][k];
                  if (prev === undefined || curr === undefined || Math.abs(curr - prev) < 0.001) return <circle cx={cx} cy={cy} r={0} />;
                  return <circle cx={cx} cy={cy} r={3} fill={COLORS[k]} stroke="#05080d" strokeWidth={1.5} />;
                }}
                activeDot={{ r: 6, fill: COLORS[k], stroke: "#05080d", strokeWidth: 2, style: { filter: `drop-shadow(0 0 6px ${COLORS[k]})` } }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-5 font-mono text-[10px] text-[color:var(--text-muted)]">
        {INDICATOR_ORDER.filter((k) => active.has(k)).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <svg width="16" height="8" viewBox="0 0 16 8" className="inline-block">
              <line
                x1="0" y1="4" x2="16" y2="4"
                stroke={COLORS[k]}
                strokeWidth="2"
                strokeDasharray={k === "cdi" ? "4 2" : undefined}
              />
            </svg>
            {INDICATORS[k].shortLabel}
          </span>
        ))}
        {yLabel && (
          <span className="ml-auto text-[color:var(--text-muted)]">{yLabel}</span>
        )}
      </div>
    </div>
  );
}
