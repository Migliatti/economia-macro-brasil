import { parseBcbDate } from "./format";
import { INDICATORS, type IndicatorKey } from "./indicators";

export type SeriesPoint = {
  date: string;
  value: number;
};

type BcbRawPoint = {
  data: string;
  valor: string;
};

const BCB_BASE = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";

function formatDdMmYyyy(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

async function fetchSgsRange(
  code: number,
  start: Date,
  end: Date,
  revalidateSeconds = 3600,
): Promise<SeriesPoint[]> {
  const qs = new URLSearchParams({
    formato: "json",
    dataInicial: formatDdMmYyyy(start),
    dataFinal: formatDdMmYyyy(end),
  });
  const url = `${BCB_BASE}.${code}/dados?${qs.toString()}`;
  const res = await fetch(url, { next: { revalidate: revalidateSeconds } });
  if (!res.ok) {
    throw new Error(`BCB SGS ${code} failed: ${res.status}`);
  }
  const raw = (await res.json()) as BcbRawPoint[];
  return raw.map((p) => ({
    date: parseBcbDate(p.data),
    value: Number(p.valor.replace(",", ".")),
  }));
}

export async function getSeriesRange(
  key: IndicatorKey,
  days: number,
): Promise<SeriesPoint[]> {
  const { sgsCode, frequency } = INDICATORS[key];
  // For monthly series, extend the window so we capture enough monthly points.
  const windowDays = frequency === "monthly" ? Math.max(days, 366) : days;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - windowDays);
  return fetchSgsRange(sgsCode, start, end);
}

export async function getLatestAndHistory(
  key: IndicatorKey,
  historyDays: number,
): Promise<{ latest: SeriesPoint; previous: SeriesPoint | null; history: SeriesPoint[] }> {
  const history = await getSeriesRange(key, historyDays);
  if (history.length === 0) {
    throw new Error(`No data for ${key}`);
  }
  const latest = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : null;
  return { latest, previous, history };
}

export const PERIOD_PRESETS = [
  { key: "30d", label: "30D", days: 30 },
  { key: "6m", label: "6M", days: 180 },
  { key: "1y", label: "1A", days: 365 },
  { key: "5y", label: "5A", days: 365 * 5 },
] as const;

export type PeriodKey = (typeof PERIOD_PRESETS)[number]["key"];
