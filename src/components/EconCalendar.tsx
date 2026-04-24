import { CalendarDays } from "lucide-react";
import { COPOM_MEETINGS } from "@/lib/copom";
import { formatDate } from "@/lib/format";

type CalEvent = {
  date: string;
  label: string;
  kind: "copom" | "inflation" | "focus" | "gdp";
};

// Static upcoming scheduled releases for 2026. Dates are approximate
// (IBGE typically releases IPCA around the 9th–12th of the following month).
const STATIC_EVENTS: CalEvent[] = [
  { date: "2026-04-28", label: "Relatório Focus · BCB", kind: "focus" },
  { date: "2026-05-12", label: "IPCA abril · IBGE", kind: "inflation" },
  { date: "2026-05-05", label: "Relatório Focus · BCB", kind: "focus" },
  { date: "2026-06-09", label: "IPCA maio · IBGE", kind: "inflation" },
  { date: "2026-06-16", label: "Relatório Focus · BCB", kind: "focus" },
  { date: "2026-07-09", label: "IPCA junho · IBGE", kind: "inflation" },
  { date: "2026-05-28", label: "PIB 1º tri 2026 · IBGE", kind: "gdp" },
  { date: "2026-09-01", label: "PIB 2º tri 2026 · IBGE", kind: "gdp" },
];

const KIND_META: Record<
  CalEvent["kind"],
  { color: string; dot: string; label: string }
> = {
  copom: {
    color: "text-[color:var(--color-down)]",
    dot: "bg-[color:var(--color-down)]",
    label: "COPOM",
  },
  inflation: {
    color: "text-[color:var(--color-up)]",
    dot: "bg-[color:var(--color-up)]",
    label: "INFLAÇÃO",
  },
  focus: {
    color: "text-[color:var(--text-muted)]",
    dot: "bg-[color:var(--text-muted)]",
    label: "FOCUS",
  },
  gdp: {
    color: "text-blue-400",
    dot: "bg-blue-400",
    label: "PIB",
  },
};

function daysUntil(dateIso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateIso + "T00:00:00");
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function EconCalendar() {
  const today = new Date().toISOString().slice(0, 10);

  const copomEvents: CalEvent[] = COPOM_MEETINGS.filter(
    (m) => m.date >= today,
  ).map((m) => ({
    date: m.date,
    label: `Copom #${m.number} · decisão`,
    kind: "copom",
  }));

  const all = [...copomEvents, ...STATIC_EVENTS]
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  return (
    <div className="glass-panel flex flex-col rounded-xl p-5">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-[color:var(--text-muted)]" />
        <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
          AGENDA ECONÔMICA
        </div>
      </div>

      <ul className="mt-4 flex-1 divide-y divide-[color:var(--grid-line)]">
        {all.map((ev) => {
          const meta = KIND_META[ev.kind];
          const days = daysUntil(ev.date);
          return (
            <li key={ev.date + ev.label} className="flex items-start gap-3 py-2.5">
              <span
                className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${meta.dot}`}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-xs text-[color:var(--text-primary)]">
                  {ev.label}
                </div>
                <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-[color:var(--text-muted)]">
                  <span>{formatDate(ev.date)}</span>
                  <span>·</span>
                  <span className={days <= 7 ? meta.color : ""}>
                    em {days}d
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 border-t border-[color:var(--grid-line)] pt-3 font-mono text-[10px] text-[color:var(--text-muted)]">
        COPOM · Focus · IBGE · BCB
      </div>
    </div>
  );
}
