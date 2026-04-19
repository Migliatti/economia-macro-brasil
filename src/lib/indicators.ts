export type IndicatorKey = "selic" | "cdi" | "ipca" | "cambio";

export type IndicatorUnit = "percent-annual" | "percent-monthly" | "currency-brl";

// How to compute the "variação" shown next to the current value:
// - previous-point: compare with the previous data point (default for monthly series
//   and for spot prices like câmbio)
// - days-ago: compare with the value from N calendar days ago (ideal for step-rates
//   like Selic/CDI, which stay flat between Copom meetings)
export type DeltaReference =
  | { kind: "previous-point"; label: string }
  | { kind: "days-ago"; days: number; label: string };

export type IndicatorMeta = {
  key: IndicatorKey;
  label: string;
  shortLabel: string;
  sgsCode: number;
  unit: IndicatorUnit;
  description: string;
  context: string;
  frequency: "daily" | "monthly";
  delta: DeltaReference;
  // Optional transform applied to every raw value from the SGS series
  // (e.g. annualize a daily rate).
  transform?: (value: number) => number;
};

// SGS series 12 returns the CDI as a *daily* rate (%). Annualize using 252
// business days — the convention used by the Brazilian fixed-income market.
const annualizeDailyRate = (daily: number): number =>
  (Math.pow(1 + daily / 100, 252) - 1) * 100;

export const INDICATORS: Record<IndicatorKey, IndicatorMeta> = {
  selic: {
    key: "selic",
    label: "Taxa Selic Meta",
    shortLabel: "SELIC",
    sgsCode: 432,
    unit: "percent-annual",
    description: "Meta da taxa básica de juros definida pelo Copom",
    context: "Define o custo do crédito, remunera títulos pós-fixados e ancora expectativas de inflação.",
    frequency: "daily",
    delta: { kind: "days-ago", days: 180, label: "vs 6 meses" },
  },
  cdi: {
    key: "cdi",
    label: "CDI",
    shortLabel: "CDI",
    sgsCode: 12,
    unit: "percent-annual",
    description: "DI-Over anualizada a partir da taxa diária (base 252 dias úteis)",
    context: "Referência de rentabilidade da renda fixa privada. Anda muito próxima da Selic.",
    frequency: "daily",
    delta: { kind: "days-ago", days: 180, label: "vs 6 meses" },
    transform: annualizeDailyRate,
  },
  ipca: {
    key: "ipca",
    label: "IPCA Mensal",
    shortLabel: "IPCA",
    sgsCode: 433,
    unit: "percent-monthly",
    description: "Variação mensal do Índice de Preços ao Consumidor Amplo",
    context: "Índice oficial de inflação no Brasil, divulgado pelo IBGE. Meta do BC em 2026: 3,00% ± 1,5 p.p.",
    frequency: "monthly",
    delta: { kind: "previous-point", label: "vs mês anterior" },
  },
  cambio: {
    key: "cambio",
    label: "Dólar PTAX (venda)",
    shortLabel: "USD/BRL",
    sgsCode: 1,
    unit: "currency-brl",
    description: "Taxa de câmbio PTAX — venda, divulgada pelo BC",
    context: "Referência oficial para contratos. Intraday varia com fluxo cambial e risco externo.",
    frequency: "daily",
    delta: { kind: "previous-point", label: "vs dia anterior" },
  },
};

export const INDICATOR_ORDER: IndicatorKey[] = ["selic", "cdi", "ipca", "cambio"];
