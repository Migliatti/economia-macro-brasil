import { Header } from "@/components/Header";
import { HistoricoChart } from "@/components/HistoricoChart";
import { getSeriesRange } from "@/lib/bcb";
import { INDICATOR_ORDER, type IndicatorKey } from "@/lib/indicators";
import type { SeriesPoint } from "@/lib/bcb";

export const revalidate = 3600;

async function loadData() {
  const entries = await Promise.all(
    INDICATOR_ORDER.map(async (key) => [key, await getSeriesRange(key, 365 * 5)] as const),
  );
  return Object.fromEntries(entries) as Record<IndicatorKey, SeriesPoint[]>;
}

const MONTH_ABBR = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function detectCycleEvents(selicSeries: SeriesPoint[]): Array<{ label: string; desc: string }> {
  if (selicSeries.length < 5) return [];

  const changes: Array<{ date: string; dir: "up" | "down" }> = [];
  for (let i = 1; i < selicSeries.length; i++) {
    const delta = selicSeries[i].value - selicSeries[i - 1].value;
    if (Math.abs(delta) > 0.01) {
      changes.push({ date: selicSeries[i].date, dir: delta > 0 ? "up" : "down" });
    }
  }

  const events: Array<{ label: string; desc: string }> = [];
  let prevDir: "up" | "down" | null = null;
  let upCount = 0;
  let downCount = 0;

  for (const change of changes) {
    if (change.dir !== prevDir) {
      const [y, m] = change.date.split("-");
      const label = `${MONTH_ABBR[parseInt(m) - 1]}/${y.slice(2)}`;
      let desc: string;
      if (change.dir === "up") {
        upCount++;
        desc = upCount === 1 ? "Início ciclo de alta Copom" : "Retomada da alta";
      } else {
        downCount++;
        desc = downCount === 1 ? "Início do afrouxamento" : "Início ciclo de corte";
      }
      events.push({ label, desc });
      prevDir = change.dir;
    }
  }

  return events;
}

export default async function HistoricoPage() {
  const initial = await loadData();
  const cycleEvents = detectCycleEvents(initial.selic);

  return (
    <div className="relative z-10 mx-auto flex max-w-[1680px] flex-col gap-5 p-5 md:p-8">
      <Header lastUpdate={new Date()} />

      <div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-[color:var(--text-muted)]">
          ANÁLISE
        </div>
        <h1 className="mt-1 text-2xl font-medium text-[color:var(--text-primary)]">
          Histórico &amp; Comparações
        </h1>
        <p className="mt-1 text-sm text-[color:var(--text-muted)]">
          Sobreponha séries, ajuste a janela e normalize os dados para comparação.
        </p>
      </div>

      <HistoricoChart initial={initial} />

      {cycleEvents.length > 0 && (
        <div className="glass-panel rounded-xl p-5">
          <div className="font-mono text-[10px] tracking-[0.2em] text-[color:var(--text-muted)]">
            EVENTOS DO PERÍODO
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {cycleEvents.map((e) => (
              <div
                key={e.label}
                className="flex items-center gap-2 rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] px-3 py-2"
              >
                <span className="font-mono text-[10px] font-medium text-[color:var(--color-down)]">
                  {e.label}
                </span>
                <span className="font-mono text-[11px] text-[color:var(--text-muted)]">
                  {e.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-4 font-mono text-[10px] tracking-wider text-[color:var(--text-muted)]">
        <p>
          Fontes: BCB/SGS (Selic 432 · CDI 12 · IPCA 433 · IPCA 12M 13522 · PTAX 1).
          Dados públicos com atualização horária. Esta é uma ferramenta de monitoramento,
          não constitui recomendação de investimento.
        </p>
      </footer>
    </div>
  );
}
