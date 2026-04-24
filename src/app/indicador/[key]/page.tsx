import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { DetailChart } from "@/components/DetailChart";
import { CopomDecisions } from "@/components/CopomDecisions";
import { FocusProjections } from "@/components/FocusProjections";
import { CorrelationBars } from "@/components/CorrelationBars";
import { RealRateBar } from "@/components/RealRateBar";
import { getSeriesRange } from "@/lib/bcb";
import { getNextMeeting } from "@/lib/copom";
import {
  INDICATORS,
  INDICATOR_ORDER,
  type IndicatorKey,
} from "@/lib/indicators";
import {
  formatBRL,
  formatDate,
  formatPct,
  formatSignedPct,
} from "@/lib/format";
import type { SeriesPoint } from "@/lib/bcb";

export const revalidate = 3600;

export async function generateStaticParams() {
  return INDICATOR_ORDER.map((key) => ({ key }));
}

function computeCorrelation(a: SeriesPoint[], b: SeriesPoint[]): number {
  const bMap = new Map(b.map((p) => [p.date, p.value]));
  const pairs: [number, number][] = a
    .filter((p) => bMap.has(p.date))
    .map((p) => [p.value, bMap.get(p.date)!]);
  if (pairs.length < 5) return 0;
  const n = pairs.length;
  const xm = pairs.reduce((s, p) => s + p[0], 0) / n;
  const ym = pairs.reduce((s, p) => s + p[1], 0) / n;
  const num = pairs.reduce((s, p) => s + (p[0] - xm) * (p[1] - ym), 0);
  const dx = Math.sqrt(pairs.reduce((s, p) => s + (p[0] - xm) ** 2, 0));
  const dy = Math.sqrt(pairs.reduce((s, p) => s + (p[1] - ym) ** 2, 0));
  if (dx === 0 || dy === 0) return 0;
  return num / (dx * dy);
}

function daysUnchanged(series: SeriesPoint[]): number {
  if (series.length < 2) return 0;
  const latest = series[series.length - 1];
  let i = series.length - 2;
  while (i >= 0 && series[i].value === latest.value) i--;
  const changeDate = new Date((series[i + 1]?.date ?? series[0].date) + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((now.getTime() - changeDate.getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(dateIso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((new Date(dateIso + "T00:00:00").getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

async function loadData(key: IndicatorKey) {
  const entries = await Promise.all(
    INDICATOR_ORDER.map(async (k) => [k, await getSeriesRange(k, 365)] as const),
  );
  return Object.fromEntries(entries) as Record<IndicatorKey, SeriesPoint[]>;
}

export default async function IndicatorDetail({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!(key in INDICATORS)) notFound();

  const indicatorKey = key as IndicatorKey;
  const meta = INDICATORS[indicatorKey];
  const histories = await loadData(indicatorKey);
  const series = histories[indicatorKey];

  if (series.length === 0) notFound();

  const latest = series[series.length - 1];
  const isCurrency = meta.unit === "currency-brl";

  const selicLatest = histories.selic[histories.selic.length - 1]?.value ?? 0;
  const ipca12mLatest = histories.ipca12m[histories.ipca12m.length - 1]?.value ?? 0;
  const cdiLatest = histories.cdi[histories.cdi.length - 1]?.value ?? 0;

  const avgValue = series.reduce((s, p) => s + p.value, 0) / series.length;
  const minValue = Math.min(...series.map((p) => p.value));
  const maxValue = Math.max(...series.map((p) => p.value));

  const nextMeeting = getNextMeeting();

  const correlationEntries = INDICATOR_ORDER.filter((k) => k !== indicatorKey).map((k) => ({
    key: k,
    value: computeCorrelation(series, histories[k]),
  }));

  return (
    <div className="relative z-10 mx-auto flex max-w-[1680px] flex-col gap-5 p-5 md:p-8">
      <Header lastUpdate={new Date()} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-mono text-xs text-[color:var(--text-muted)]">
        <Link href="/" className="hover:text-[color:var(--text-primary)] transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[color:var(--text-primary)] font-medium">
          {meta.shortLabel}
        </span>
      </nav>

      {/* Hero */}
      <div className="glass-panel rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] text-[color:var(--text-muted)]">
              {meta.unit === "percent-annual"
                ? "TAXA ANUAL"
                : meta.unit === "percent-monthly"
                ? "VARIAÇÃO MENSAL"
                : "CÂMBIO · PTAX"}
              {" · BCB/SGS"}
            </div>
            <h1 className="mt-2 font-mono text-5xl font-bold tracking-tight text-[color:var(--text-primary)]">
              {meta.shortLabel}
            </h1>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              {meta.description}
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-6xl font-semibold tabular-nums text-[color:var(--text-primary)]">
              {isCurrency
                ? formatBRL(latest.value)
                : formatPct(latest.value)}
            </div>
            <div className="mt-1 font-mono text-sm text-[color:var(--text-muted)]">
              ref {formatDate(latest.date)}
            </div>
          </div>
        </div>

        {/* Stat row */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[color:var(--grid-line)] pt-5 sm:grid-cols-3 lg:grid-cols-6">
          {indicatorKey === "selic" ? (
            <>
              <StatCell label="META COPOM" value={formatPct(selicLatest)} />
              <StatCell label="OVER (CDI)" value={formatPct(cdiLatest)} />
              <StatCell
                label="SELIC REAL"
                value={formatSignedPct(selicLatest - ipca12mLatest)}
                color="var(--color-up)"
              />
              <StatCell
                label="DIAS SEM MUDAR"
                value={String(daysUnchanged(series))}
              />
              <StatCell
                label="MÉDIA 12M"
                value={formatPct(avgValue)}
              />
              <StatCell
                label="PRÓX. REUNIÃO"
                value={nextMeeting ? `em ${daysUntil(nextMeeting.date)}d` : "—"}
                color="var(--color-down)"
              />
            </>
          ) : (
            <>
              <StatCell
                label="ATUAL"
                value={isCurrency ? formatBRL(latest.value) : formatPct(latest.value)}
              />
              <StatCell
                label="MÉDIA 12M"
                value={isCurrency ? formatBRL(avgValue) : formatPct(avgValue)}
              />
              <StatCell
                label="MÍN 12M"
                value={isCurrency ? formatBRL(minValue) : formatPct(minValue)}
              />
              <StatCell
                label="MÁX 12M"
                value={isCurrency ? formatBRL(maxValue) : formatPct(maxValue)}
              />
              <StatCell
                label="VARIAÇÃO 12M"
                value={
                  series.length > 1
                    ? formatSignedPct(
                        isCurrency
                          ? ((latest.value - series[0].value) / series[0].value) * 100
                          : latest.value - series[0].value,
                      ) + (isCurrency ? "%" : " p.p.")
                    : "—"
                }
              />
              {indicatorKey === "ipca12m" && (
                <StatCell
                  label="META 2026"
                  value="3,00%"
                  color={
                    latest.value > 4.5
                      ? "var(--color-down)"
                      : latest.value > 3
                      ? "var(--color-flat)"
                      : "var(--color-up)"
                  }
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Real rate bar (for Selic) */}
      {indicatorKey === "selic" && (
        <RealRateBar selic={selicLatest} ipca12m={ipca12mLatest} />
      )}

      {/* Chart — only pass serializable fields (no transform fn) */}
      <DetailChart
        meta={{ key: meta.key, unit: meta.unit, shortLabel: meta.shortLabel, label: meta.label }}
        initialMain={series}
        initialIpca12m={histories.ipca12m}
      />

      {/* Three-column section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {indicatorKey === "selic" ? (
          <CopomDecisions selicSeries={series} limit={8} />
        ) : (
          <div className="glass-panel rounded-xl p-5">
            <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
              CONTEXTO
            </div>
            <div className="mt-1 text-lg font-medium text-[color:var(--text-primary)]">
              Sobre o indicador
            </div>
            <p className="mt-4 text-sm text-[color:var(--text-muted)] leading-relaxed">
              {meta.context}
            </p>
          </div>
        )}

        <FocusProjections />

        {/* Correlations */}
        <div className="glass-panel rounded-xl p-5">
          <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
            COMPARAR COM
          </div>
          <div className="mt-1 mb-5 text-lg font-medium text-[color:var(--text-primary)]">
            Correlações 12M
          </div>
          <CorrelationBars entries={correlationEntries} />
          <p className="mt-4 font-mono text-[10px] text-[color:var(--text-muted)]">
            Pearson · apenas datas em comum
          </p>
        </div>
      </div>

      <footer className="mt-4 font-mono text-[10px] tracking-wider text-[color:var(--text-muted)]">
        <p>
          Fonte: BCB/SGS ({meta.label} · código {meta.sgsCode}).
          Dados públicos com atualização horária. Esta é uma ferramenta de monitoramento,
          não constitui recomendação de investimento.
        </p>
      </footer>
    </div>
  );
}

function StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.15em] text-[color:var(--text-muted)]">
        {label}
      </div>
      <div
        className="mt-1 font-mono text-xl font-semibold tabular-nums"
        style={{ color: color ?? "var(--text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}
