import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatPct, formatSignedPct } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  selic: number;
  ipca12m: number;
};

// Rough historical context for Brazilian real rates:
// > 6%  → highly restrictive (rare, only during crises)
// 3–6%  → restrictive (tightening cycle)
// 1–3%  → neutral corridor
// < 1%  → accommodative
function classify(real: number): { label: string; tone: "restrictive" | "neutral" | "accommodative" } {
  if (real >= 6) return { label: "Juros Reais Altos — política monetária restritiva", tone: "restrictive" };
  if (real >= 3) return { label: "Política monetária contracionista", tone: "restrictive" };
  if (real >= 1) return { label: "Próximo ao corredor neutro", tone: "neutral" };
  return { label: "Política monetária acomodatícia", tone: "accommodative" };
}

export function RealRateBar({ selic, ipca12m }: Props) {
  // Ex-ante real interest rate (Fisher approximation): Selic - IPCA 12m
  const real = selic - ipca12m;
  const { label, tone } = classify(real);

  const Icon = real >= 3 ? TrendingUp : real >= 1 ? Minus : TrendingDown;

  return (
    <div className="glass-panel rounded-xl px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              tone === "restrictive" && "bg-[color:var(--bg-down)]",
              tone === "neutral" && "bg-[color:var(--bg-flat)]",
              tone === "accommodative" && "bg-[color:var(--bg-up)]",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                tone === "restrictive" && "text-[color:var(--color-down)]",
                tone === "neutral" && "text-[color:var(--color-flat)]",
                tone === "accommodative" && "text-[color:var(--color-up)]",
              )}
              strokeWidth={2}
            />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
              JURO REAL IMPLÍCITO
            </div>
            <div className="mt-0.5 text-sm text-[color:var(--text-muted)]">
              Selic Meta − IPCA Acumulado 12M
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-6">
          <div className="text-right">
            <div
              className={cn(
                "font-mono text-3xl font-semibold tabular-nums",
                tone === "restrictive" && "text-[color:var(--color-down)]",
                tone === "neutral" && "text-[color:var(--text-primary)]",
                tone === "accommodative" && "text-[color:var(--color-up)]",
              )}
            >
              {formatSignedPct(real)}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-[color:var(--text-muted)]">
              {formatPct(selic)} − {formatPct(ipca12m)}
            </div>
          </div>

          <div
            className={cn(
              "hidden rounded-md px-3 py-1.5 font-mono text-xs tracking-wide sm:block",
              tone === "restrictive" && "bg-[color:var(--bg-down)] text-[color:var(--color-down)]",
              tone === "neutral" && "bg-[color:var(--bg-flat)] text-[color:var(--text-muted)]",
              tone === "accommodative" && "bg-[color:var(--bg-up)] text-[color:var(--color-up)]",
            )}
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
