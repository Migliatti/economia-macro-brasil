import { cn } from "@/lib/utils";
import { formatDate, formatPct, formatSignedPct } from "@/lib/format";
import { COPOM_MEETINGS } from "@/lib/copom";
import type { SeriesPoint } from "@/lib/bcb";

function rateAtOrBefore(series: SeriesPoint[], iso: string): number | null {
  let found: number | null = null;
  for (const p of series) {
    if (p.date <= iso) found = p.value;
    else break;
  }
  return found;
}

export function CopomDecisions({
  selicSeries,
  limit = 8,
}: {
  selicSeries: SeriesPoint[];
  limit?: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const past = COPOM_MEETINGS.filter((m) => m.date <= today)
    .slice(-limit)
    .reverse();

  const rows = past.map((m, idx, arr) => {
    const rate = rateAtOrBefore(selicSeries, m.date);
    const prev = arr[idx + 1];
    const prevRate = prev ? rateAtOrBefore(selicSeries, prev.date) : null;
    const change = rate !== null && prevRate !== null ? rate - prevRate : null;
    return { ...m, rate, change };
  });

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
        DECISÕES COPOM
      </div>
      <div className="mt-1 text-lg font-medium text-[color:var(--text-primary)]">
        Últimas {limit} reuniões
      </div>

      <div className="mt-4 divide-y divide-[color:var(--grid-line)]">
        {rows.map((m) => (
          <div
            key={m.number}
            className="grid grid-cols-[1fr_auto_auto] gap-3 py-2.5 font-mono text-xs items-baseline"
          >
            <span className="text-[color:var(--text-muted)]">
              {formatDate(m.date)}
            </span>
            <span
              className={cn(
                "text-right",
                m.change !== null && m.change > 0 && "text-[color:var(--color-down)]",
                m.change !== null && m.change < 0 && "text-[color:var(--color-up)]",
                (m.change === null || m.change === 0) && "text-[color:var(--text-muted)]",
              )}
            >
              {m.change !== null && m.change !== 0
                ? `${formatSignedPct(m.change)} p.p.`
                : m.change === 0
                ? "ESTÁVEL"
                : "—"}
            </span>
            <span className="w-16 text-right tabular-nums text-[color:var(--text-primary)]">
              {m.rate !== null ? formatPct(m.rate) : "—"}
            </span>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="py-3 text-xs font-mono text-[color:var(--text-muted)]">
            Dados insuficientes na janela carregada.
          </p>
        )}
      </div>
    </div>
  );
}
