import { Header } from "@/components/Header";
import { IndicatorCard } from "@/components/IndicatorCard";
import { HistoricalChart } from "@/components/HistoricalChart";
import { CopomPanel } from "@/components/CopomPanel";
import { getSeriesRange } from "@/lib/bcb";
import {
  INDICATOR_ORDER,
  INDICATORS,
  type IndicatorKey,
} from "@/lib/indicators";
import type { SeriesPoint } from "@/lib/bcb";

export const revalidate = 3600;

async function loadData() {
  // Fetch 180 days (6M preset) so the server-side seed matches the chart's
  // default period exactly — and 180 days covers the Selic/CDI delta window too.
  const historyEntries = await Promise.all(
    INDICATOR_ORDER.map(async (key) => {
      const data = await getSeriesRange(key, 180);
      return [key, data] as const;
    }),
  );

  return {
    histories: Object.fromEntries(historyEntries) as Record<
      IndicatorKey,
      SeriesPoint[]
    >,
  };
}

export default async function Home() {
  const { histories } = await loadData();

  return (
    <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5 p-5 md:p-8">
      <Header lastUpdate={new Date()} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {INDICATOR_ORDER.map((key) => {
          const series = histories[key];
          const latest = series[series.length - 1];
          return (
            <IndicatorCard
              key={key}
              meta={INDICATORS[key]}
              latest={latest}
              history={series}
            />
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <HistoricalChart initial={histories} />
        <CopomPanel selicSeries={histories.selic} />
      </section>

      <footer className="mt-4 font-mono text-[10px] tracking-wider text-[color:var(--text-muted)]">
        <p>
          Fontes: BCB/SGS (Selic 432 · CDI 12 · IPCA 433 · PTAX 1). Dados
          públicos com atualização horária. Esta é uma ferramenta de monitoramento,
          não constitui recomendação de investimento.
        </p>
      </footer>
    </div>
  );
}
