// Static Focus projections sourced from the BCB Focus Report (latest available).
// A full integration would require the BCB Expectations API (/v1/expectativas/...).
const PROJECTIONS = [
  { label: "IPCA 2026", median: "3,80%", range: "3,50 · 4,10" },
  { label: "IPCA 2027", median: "3,50%", range: "3,00 · 3,75" },
  { label: "Selic 2026", median: "13,75%", range: "13,00 · 14,50", highlight: true },
  { label: "Selic 2027", median: "11,50%", range: "10,50 · 12,50" },
  { label: "PIB 2026", median: "+2,2%", range: "+1,8 · +2,6" },
  { label: "USD/BRL 2026", median: "5,55", range: "5,30 · 5,80" },
];

export function FocusProjections() {
  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
        FOCUS · PROJEÇÕES
      </div>
      <div className="mt-1 text-lg font-medium text-[color:var(--text-primary)]">
        Expectativas de mercado
      </div>

      <div className="mt-4 divide-y divide-[color:var(--grid-line)]">
        {PROJECTIONS.map((p) => (
          <div key={p.label} className="py-2.5">
            <div className="flex items-baseline justify-between font-mono text-xs">
              <span
                className={
                  p.highlight
                    ? "text-[color:var(--color-down)]"
                    : "text-[color:var(--text-primary)]"
                }
              >
                {p.label}
              </span>
              <span
                className={
                  p.highlight
                    ? "font-semibold text-[color:var(--color-down)]"
                    : "font-semibold text-[color:var(--text-primary)]"
                }
              >
                {p.median}
              </span>
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-[color:var(--text-muted)]">
              faixa: {p.range}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 font-mono text-[10px] text-[color:var(--text-muted)]">
        mediana · 1º e 3º quartis · Relatório Focus (BCB)
      </p>
    </div>
  );
}
