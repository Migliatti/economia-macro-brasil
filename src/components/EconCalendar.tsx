import { CalendarDays } from "lucide-react";
import { COPOM_MEETINGS } from "@/lib/copom";
import { formatDate } from "@/lib/format";

type CalEvent = {
  date: string;
  label: string;
  kind: "copom" | "inflation" | "focus" | "gdp";
};

const MONTH_PT = [
  "janeiro","fevereiro","março","abril","maio","junho",
  "julho","agosto","setembro","outubro","novembro","dezembro",
];

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function nextMonday(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return d;
}

function generateDynamicEvents(today: Date): CalEvent[] {
  const todayIso = today.toISOString().slice(0, 10);
  const year = today.getFullYear();
  const events: CalEvent[] = [];

  // IPCA: released ~9th of the following month (IBGE)
  for (let i = 0; i < 5; i++) {
    const rawMonth = today.getMonth() + i;
    const refYear = year + Math.floor(rawMonth / 12);
    const refMonth = rawMonth % 12;
    const releaseYear = refMonth === 11 ? refYear + 1 : refYear;
    const releaseMonth = refMonth === 11 ? 0 : refMonth + 1;
    const date = isoDate(releaseYear, releaseMonth, 9);
    if (date > todayIso) {
      events.push({ date, label: `IPCA ${MONTH_PT[refMonth]} · IBGE`, kind: "inflation" });
    }
  }

  // Focus Report: every Monday (BCB Market Readout)
  let monday = nextMonday(today);
  for (let i = 0; i < 5; i++) {
    events.push({ date: monday.toISOString().slice(0, 10), label: "Relatório Focus · BCB", kind: "focus" });
    const next = new Date(monday);
    next.setDate(next.getDate() + 7);
    monday = next;
  }

  // PIB: approximate IBGE quarterly releases (Jun/Sep/Dec/Mar)
  const pibReleases: [string, string][] = [
    [isoDate(year, 5, 3),     `PIB 1º tri ${year} · IBGE`],
    [isoDate(year, 8, 2),     `PIB 2º tri ${year} · IBGE`],
    [isoDate(year, 11, 2),    `PIB 3º tri ${year} · IBGE`],
    [isoDate(year + 1, 2, 3), `PIB 4º tri ${year} · IBGE`],
    [isoDate(year + 1, 5, 3), `PIB 1º tri ${year + 1} · IBGE`],
  ];
  for (const [date, label] of pibReleases) {
    if (date > todayIso) events.push({ date, label, kind: "gdp" });
  }

  return events;
}

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
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  const copomEvents: CalEvent[] = COPOM_MEETINGS.filter(
    (m) => m.date >= todayIso,
  ).map((m) => ({
    date: m.date,
    label: `Copom #${m.number} · decisão`,
    kind: "copom",
  }));

  const all = [...copomEvents, ...generateDynamicEvents(today)]
    .filter((e) => e.date >= todayIso)
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
        COPOM · Focus · IBGE · BCB · datas aproximadas
      </div>
    </div>
  );
}
