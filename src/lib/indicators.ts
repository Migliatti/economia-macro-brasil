export type IndicatorKey = "selic" | "cdi" | "ipca" | "cambio";

export type IndicatorUnit = "percent-annual" | "percent-monthly" | "currency-brl";

export type IndicatorMeta = {
  key: IndicatorKey;
  label: string;
  shortLabel: string;
  sgsCode: number;
  unit: IndicatorUnit;
  description: string;
  context: string;
  frequency: "daily" | "monthly";
};

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
  },
  cdi: {
    key: "cdi",
    label: "CDI",
    shortLabel: "CDI",
    sgsCode: 12,
    unit: "percent-annual",
    description: "Taxa DI-Over (anualizada, base 252 dias úteis)",
    context: "Referência de rentabilidade da renda fixa privada. Anda muito próxima da Selic.",
    frequency: "daily",
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
  },
};

export const INDICATOR_ORDER: IndicatorKey[] = ["selic", "cdi", "ipca", "cambio"];
