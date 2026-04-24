import { cn } from "@/lib/utils";
import { INDICATORS, type IndicatorKey } from "@/lib/indicators";

type CorrelationEntry = {
  key: IndicatorKey;
  value: number;
};

export function CorrelationBars({ entries }: { entries: CorrelationEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div>
      <div className="mb-3 text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
        CORRELAÇÃO (12M)
      </div>
      <div className="space-y-2">
        {entries.map(({ key, value }) => {
          const isPos = value >= 0;
          const pct = Math.abs(value);
          return (
            <div
              key={key}
              className="grid items-center gap-3"
              style={{ gridTemplateColumns: "64px 1fr 44px" }}
            >
              <span className="font-mono text-[11px] text-[color:var(--text-muted)]">
                {INDICATORS[key].shortLabel}
              </span>

              <div className="relative h-2 rounded-sm border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)]">
                <div className="absolute inset-y-0 left-1/2 w-px bg-[color:var(--text-muted)] opacity-30" />
                <div
                  className={cn(
                    "absolute inset-y-0 rounded-sm",
                    isPos
                      ? "left-1/2 bg-[color:var(--color-up)]"
                      : "right-1/2 bg-[color:var(--color-down)]",
                  )}
                  style={{ width: `${pct * 50}%` }}
                />
              </div>

              <span
                className={cn(
                  "text-right font-mono text-[11px] tabular-nums",
                  isPos
                    ? "text-[color:var(--color-up)]"
                    : "text-[color:var(--color-down)]",
                )}
              >
                {isPos ? "+" : ""}
                {value.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
