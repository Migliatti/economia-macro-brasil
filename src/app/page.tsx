import { Header } from "@/components/Header";
import { IndicatorCard } from "@/components/IndicatorCard";
import { HistoricalChart } from "@/components/HistoricalChart";
import { CopomPanel } from "@/components/CopomPanel";
import { RealRateBar } from "@/components/RealRateBar";
import { getSeriesRange } from "@/lib/bcb";
import {
  INDICATOR_ORDER,
  INDICATORS,
  type IndicatorKey,
} from "@/lib/indicators";
import type { SeriesPoint } from "@/lib/bcb";

export const revalidate = 3600;

async function loadData() {
  // 180 days = default 6M chart seed and covers Selic/CDI delta window.
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

  const selicLatest = histories.selic[histories.selic.length - 1]?.value ?? 0;
  const ipca12mLatest = histories.ipca12m[histories.ipca12m.length - 1]?.value ?? 0;

  return (
    <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5 p-5 md:p-8">
      <Header lastUpdate={new Date()} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      <RealRateBar selic={selicLatest} ipca12m={ipca12mLatest} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <HistoricalChart initial={histories} />
        <CopomPanel selicSeries={histories.selic} />
      </section>

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
