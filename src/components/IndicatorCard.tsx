import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Sparkline } from "./Sparkline";
import type { SeriesPoint } from "@/lib/bcb";
import type { IndicatorMeta } from "@/lib/indicators";
import {
  formatBRL,
  formatDate,
  formatPct,
  formatSignedPct,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  meta: IndicatorMeta;
  latest: SeriesPoint;
  history: SeriesPoint[];
};

function formatValue(value: number, unit: IndicatorMeta["unit"]) {
  if (unit === "currency-brl") return formatBRL(value);
  return formatPct(value);
}

function findReferencePoint(
  meta: IndicatorMeta,
  history: SeriesPoint[],
): SeriesPoint | null {
  if (history.length < 2) return null;
  const latestIdx = history.length - 1;
  if (meta.delta.kind === "previous-point") {
    return history[latestIdx - 1];
  }
  // days-ago: walk back to find the first point whose date is <= target
  const latestDate = new Date(history[latestIdx].date + "T00:00:00");
  const target = new Date(latestDate);
  target.setDate(target.getDate() - meta.delta.days);
  const targetIso = target.toISOString().slice(0, 10);
  for (let i = latestIdx - 1; i >= 0; i--) {
    if (history[i].date <= targetIso) return history[i];
  }
  // fall back to oldest available point
  return history[0];
}

function computeDelta(latest: number, ref: number, unit: IndicatorMeta["unit"]) {
  if (unit === "currency-brl") {
    return { display: ((latest - ref) / ref) * 100, suffix: "%" };
  }
  return { display: latest - ref, suffix: " p.p." };
}

export function IndicatorCard({ meta, latest, history }: Props) {
  const reference = findReferencePoint(meta, history);
  const delta = reference ? computeDelta(latest.value, reference.value, meta.unit) : null;
  const direction = delta
    ? delta.display > 0.001
      ? "up"
      : delta.display < -0.001
      ? "down"
      : "flat"
    : "flat";

  const color =
    direction === "up"
      ? "var(--color-up)"
      : direction === "down"
      ? "var(--color-down)"
      : "var(--color-flat)";

  const DeltaIcon =
    direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : ArrowRight;

  return (
    <div className="group glass-panel relative flex flex-col gap-3 rounded-xl p-5 transition-all hover:border-[color:var(--border-accent)]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
            {meta.shortLabel}
          </div>
          <div className="mt-1 text-sm font-medium text-[color:var(--text-primary)]">
            {meta.label}
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs",
            direction === "up" && "bg-[color:var(--bg-up)] text-[color:var(--color-up)]",
            direction === "down" && "bg-[color:var(--bg-down)] text-[color:var(--color-down)]",
            direction === "flat" && "bg-[color:var(--bg-flat)] text-[color:var(--color-flat)]",
          )}
        >
          <DeltaIcon className="h-3 w-3" strokeWidth={2.5} />
          {delta ? (
            <span>
              {formatSignedPct(delta.display).replace("%", "")}
              {delta.suffix}
            </span>
          ) : (
            <span>—</span>
          )}
        </div>
      </div>

      <div className="font-mono">
        <div className="text-3xl font-semibold text-[color:var(--text-primary)] tabular-nums">
          {formatValue(latest.value, meta.unit)}
        </div>
        <div className="mt-0.5 text-[10px] text-[color:var(--text-muted)]">
          {meta.unit === "percent-annual"
            ? `% a.a. · ${meta.delta.label}`
            : meta.unit === "percent-monthly"
            ? `variação mensal · ${meta.delta.label}`
            : meta.delta.label}
        </div>
      </div>

      <Sparkline data={history} color={color} />

      <div className="flex items-center justify-between text-[10px] font-mono text-[color:var(--text-muted)]">
        <span>ref {formatDate(latest.date)}</span>
        <span className="uppercase tracking-wider">
          {meta.frequency === "daily" ? "diário" : "mensal"}
        </span>
      </div>
    </div>
  );
}
