import { CalendarDays, Gavel } from "lucide-react";
import { COPOM_MEETINGS, getNextMeeting, getPastMeetings } from "@/lib/copom";
import { formatDate, formatPct, formatSignedPct } from "@/lib/format";
import type { SeriesPoint } from "@/lib/bcb";
import { cn } from "@/lib/utils";

function daysUntil(dateIso: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateIso + "T00:00:00");
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function rateAtOrBefore(series: SeriesPoint[], iso: string): number | null {
  // series is chronological; find last entry with date <= iso
  let found: number | null = null;
  for (const p of series) {
    if (p.date <= iso) found = p.value;
    else break;
  }
  return found;
}

export function CopomPanel({ selicSeries }: { selicSeries: SeriesPoint[] }) {
  const next = getNextMeeting();
  const past = getPastMeetings(new Date(), 4);

  // Compute rate at each past meeting date and delta vs previous meeting
  const pastWithRates = past.map((m, idx, arr) => {
    const rate = rateAtOrBefore(selicSeries, m.date);
    const prevMeeting = arr[idx + 1]; // arr is reversed (newest first), so "previous" meeting is next in array
    const prevRate = prevMeeting
      ? rateAtOrBefore(selicSeries, prevMeeting.date)
      : null;
    const change = rate !== null && prevRate !== null ? rate - prevRate : null;
    return { ...m, rate, change };
  });

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
            COPOM
          </div>
          <div className="mt-1 text-lg font-medium text-[color:var(--text-primary)]">
            Calendário e decisões
          </div>
        </div>
        <Gavel className="h-5 w-5 text-[color:var(--text-muted)]" />
      </div>

      {next && (
        <div className="mt-4 rounded-lg border border-[color:var(--border-accent)] bg-[color:var(--bg-highlight)] p-4">
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-[color:var(--text-muted)]">
            <CalendarDays className="h-3 w-3" />
            PRÓXIMA REUNIÃO
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-xl tabular-nums text-[color:var(--text-primary)]">
              {formatDate(next.date)}
            </span>
            <span className="font-mono text-xs text-[color:var(--text-muted)]">
              em {daysUntil(next.date)} dias · #{next.number}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
          HISTÓRICO RECENTE
        </div>
        <ul className="mt-2 divide-y divide-[color:var(--grid-line)]">
          {pastWithRates.map((m) => (
            <li
              key={m.number}
              className="flex items-center justify-between py-2 font-mono text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-[color:var(--text-muted)]">#{m.number}</span>
                <span className="text-[color:var(--text-primary)]">
                  {formatDate(m.date)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {m.change !== null && (
                  <span
                    className={cn(
                      "text-[10px] tracking-wider",
                      m.change > 0 && "text-[color:var(--color-down)]",
                      m.change < 0 && "text-[color:var(--color-up)]",
                      m.change === 0 && "text-[color:var(--text-muted)]",
                    )}
                  >
                    {m.change !== 0
                      ? `${formatSignedPct(m.change)} p.p.`
                      : "ESTÁVEL"}
                  </span>
                )}
                <span className="w-16 text-right tabular-nums text-[color:var(--text-primary)]">
                  {m.rate !== null ? formatPct(m.rate) : "—"}
                </span>
              </div>
            </li>
          ))}
          {pastWithRates.length === 0 && (
            <li className="py-2 font-mono text-xs text-[color:var(--text-muted)]">
              Dados indisponíveis
            </li>
          )}
        </ul>
      </div>

      <div className="mt-4 border-t border-[color:var(--grid-line)] pt-3 text-[10px] font-mono text-[color:var(--text-muted)]">
        <p>
          Calendário {COPOM_MEETINGS[0].date.slice(0, 4)}–
          {COPOM_MEETINGS[COPOM_MEETINGS.length - 1].date.slice(0, 4)} · taxa
          vigente conforme SGS 432.
        </p>
        <p className="mt-1">Meta de inflação BC · 2026: 3,00% ± 1,5 p.p.</p>
      </div>
    </div>
  );
}
