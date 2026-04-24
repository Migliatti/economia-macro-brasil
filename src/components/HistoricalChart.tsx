"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "@/lib/bcb";
import { PERIOD_PRESETS, type PeriodKey } from "@/lib/bcb";
import {
  INDICATOR_ORDER,
  INDICATORS,
  type IndicatorKey,
} from "@/lib/indicators";
import { formatBRL, formatDate, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  initial: Record<IndicatorKey, SeriesPoint[]>;
};

function formatByUnit(value: number, unit: string) {
  if (unit === "currency-brl") return formatBRL(value);
  return formatPct(value);
}

export function HistoricalChart({ initial }: Props) {
  const [indicator, setIndicator] = useState<IndicatorKey>("selic");
  const [period, setPeriod] = useState<PeriodKey>("6m");
  const [data, setData] = useState<SeriesPoint[]>(initial.selic);
  const [cache, setCache] = useState<Record<string, SeriesPoint[]>>(() => ({
    "selic:6m": initial.selic,
    "cdi:6m": initial.cdi,
    "ipca:6m": initial.ipca,
    "ipca12m:6m": initial.ipca12m,
    "cambio:6m": initial.cambio,
  }));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const cacheKey = `${indicator}:${period}`;
    if (cache[cacheKey]) {
      setData(cache[cacheKey]);
      return;
    }
    const days = PERIOD_PRESETS.find((p) => p.key === period)!.days;
    startTransition(async () => {
      const res = await fetch(`/api/series/${indicator}?days=${days}`);
      if (!res.ok) return;
      const json = (await res.json()) as { data: SeriesPoint[] };
      setCache((prev) => ({ ...prev, [cacheKey]: json.data }));
      setData(json.data);
    });
  }, [indicator, period, cache]);

  const meta = INDICATORS[indicator];
  const color =
    indicator === "selic"
      ? "#3ee6a8"
      : indicator === "cdi"
      ? "#60a5fa"
      : indicator === "ipca"
      ? "#f59e0b"
      : indicator === "ipca12m"
      ? "#fb923c"
      : "#c084fc";

  const latest = data[data.length - 1]?.value;
  const first = data[0]?.value;
  const delta = latest && first ? latest - first : 0;

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
            SÉRIE HISTÓRICA
          </div>
          <div className="mt-1 text-lg font-medium text-[color:var(--text-primary)]">
            {meta.label}
          </div>
          <div className="mt-0.5 text-xs text-[color:var(--text-muted)]">
            {meta.description}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="font-mono text-2xl tabular-nums text-[color:var(--text-primary)]">
            {latest !== undefined && formatByUnit(latest, meta.unit)}
          </div>
          <div
            className={cn(
              "font-mono text-xs",
              delta > 0 && "text-[color:var(--color-up)]",
              delta < 0 && "text-[color:var(--color-down)]",
              delta === 0 && "text-[color:var(--text-muted)]",
            )}
          >
            {delta > 0 ? "+" : ""}
            {meta.unit === "currency-brl"
              ? formatBRL(delta)
              : `${delta.toFixed(2)} p.p.`} no período
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {INDICATOR_ORDER.map((k) => (
            <button
              key={k}
              onClick={() => setIndicator(k)}
              className={cn(
                "rounded-md px-3 py-1 font-mono text-xs tracking-wider transition-colors",
                indicator === k
                  ? "bg-[color:var(--btn-active)] text-[color:var(--text-primary)]"
                  : "text-[color:var(--text-muted)] hover:bg-[color:var(--btn-hover)] hover:text-[color:var(--text-primary)]",
              )}
            >
              {INDICATORS[k].shortLabel}
            </button>
          ))}
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

      <div className={cn("mt-4 h-72 w-full transition-opacity", isPending && "opacity-50")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${indicator}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--grid-line)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
              tickFormatter={(d) => {
                const [y, m] = (d as string).split("-");
                return `${m}/${y.slice(2)}`;
              }}
              tickLine={false}
              axisLine={{ stroke: "var(--grid-line)" }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              width={50}
              tickFormatter={(v) =>
                meta.unit === "currency-brl" ? Number(v).toFixed(2) : Number(v).toFixed(1)
              }
            />
            <Tooltip
              contentStyle={{
                background: "var(--tooltip-bg)",
                border: "1px solid var(--border-accent)",
                borderRadius: 8,
                fontFamily: "var(--font-geist-mono)",
                fontSize: 12,
              }}
              labelFormatter={(label) => formatDate(label as string)}
              formatter={(value) => [formatByUnit(Number(value), meta.unit), meta.shortLabel]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#fill-${indicator})`}
              dot={
                indicator === "ipca" || indicator === "ipca12m"
                  ? (props: any) => {
                      const { cx, cy, index } = props;
                      if (index === 0 || !data[index - 1]) return <circle cx={cx} cy={cy} r={0} />;
                      if (Math.abs(data[index].value - data[index - 1].value) < 0.001) return <circle cx={cx} cy={cy} r={0} />;
                      return <circle cx={cx} cy={cy} r={3} fill={color} stroke="#05080d" strokeWidth={1.5} />;
                    }
                  : false
              }
              activeDot={{ r: 6, fill: color, stroke: "#05080d", strokeWidth: 2, style: { filter: `drop-shadow(0 0 6px ${color})` } }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
