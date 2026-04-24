import { Header } from "@/components/Header";
import { Bell, BellOff, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

type Rule = {
  name: string;
  asset: string;
  type: "threshold" | "variação" | "agenda" | "padrão" | "relação";
  channel: string;
  last: string;
  on: boolean;
  firedToday: boolean;
};

const RULES: Rule[] = [
  { name: "Selic acima de 15%", asset: "SELIC", type: "threshold", channel: "email", last: "nunca", on: true, firedToday: false },
  { name: "Decisão Copom", asset: "SELIC", type: "agenda", channel: "push + email", last: "18/09", on: true, firedToday: false },
  { name: "IPCA acima de 5%", asset: "IPCA", type: "threshold", channel: "push", last: "nunca", on: true, firedToday: false },
  { name: "Divulgação IPCA mensal", asset: "IPCA", type: "agenda", channel: "email", last: "11/10", on: true, firedToday: false },
  { name: "IPCA acima do Focus", asset: "IPCA", type: "variação", channel: "push", last: "08:12", on: true, firedToday: true },
  { name: "USD/BRL acima de 5,80", asset: "USD/BRL", type: "threshold", channel: "push + email", last: "12/09", on: true, firedToday: false },
  { name: "USD var 2% em 1 dia", asset: "USD/BRL", type: "variação", channel: "push", last: "08:35", on: true, firedToday: true },
  { name: "CDI descolar da Selic > 15bp", asset: "CDI", type: "relação", channel: "slack", last: "nunca", on: true, firedToday: false },
  { name: "Próx. reunião Copom (3 dias)", asset: "SELIC", type: "agenda", channel: "email", last: "—", on: true, firedToday: false },
  { name: "Curva DI inverter", asset: "DI", type: "padrão", channel: "email", last: "nunca", on: false, firedToday: false },
  { name: "Soja futuro +3% dia", asset: "SOJA", type: "variação", channel: "slack", last: "12/10", on: true, firedToday: false },
  { name: "Petróleo Brent < 65", asset: "BRENT", type: "threshold", channel: "email", last: "nunca", on: false, firedToday: false },
];

const TYPE_COLORS: Record<Rule["type"], string> = {
  threshold: "text-[color:var(--color-down)] border-[color:var(--color-down)]",
  variação: "text-orange-400 border-orange-400",
  agenda: "text-[color:var(--color-up)] border-[color:var(--color-up)]",
  padrão: "text-purple-400 border-purple-400",
  relação: "text-blue-400 border-blue-400",
};

const HISTORY = [
  { time: "08:35", asset: "USD/BRL", msg: "variação intradia −0,84% em 1d", level: "md" },
  { time: "08:12", asset: "IPCA", msg: "acima da projeção Focus", level: "md" },
  { time: "07:30", asset: "IBOV", msg: "abaixo da média 50d", level: "lo" },
  { time: "ontem", asset: "DI 2Y", msg: "spread Selic −200bp", level: "lo" },
  { time: "ontem", asset: "USD/BRL", msg: "rompeu resistência 5,55", level: "hi" },
];

export default function AlertasPage() {
  const firedToday = RULES.filter((r) => r.firedToday).length;
  const activeCount = RULES.filter((r) => r.on).length;

  return (
    <div className="relative z-10 mx-auto flex max-w-[1680px] flex-col gap-5 p-5 md:p-8">
      <Header lastUpdate={new Date()} />

      <div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-[color:var(--text-muted)]">
          MONITORAMENTO
        </div>
        <h1 className="mt-1 text-2xl font-medium text-[color:var(--text-primary)]">
          Alertas
        </h1>
        <p className="mt-1 text-sm text-[color:var(--text-muted)]">
          Regras configuradas, histórico de disparos e criação de novos alertas.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          label="DISPAROS HOJE"
          value={String(firedToday)}
          sub="+2 vs média 7d"
          highlight
        />
        <SummaryCard
          label="REGRAS ATIVAS"
          value={String(activeCount)}
          sub={`${RULES.length - activeCount} pausadas`}
        />
        <SummaryCard
          label="CANAIS"
          value="4"
          sub="email · push · slack"
        />
        <div className="glass-panel flex items-center justify-center rounded-xl p-5">
          <div className="text-center">
            <div className="font-mono text-lg font-medium text-[color:var(--text-primary)]">
              + novo alerta
            </div>
            <div className="mt-1 font-mono text-[10px] text-[color:var(--text-muted)]">
              Ctrl+K
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Rules table */}
        <div className="glass-panel rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-lg font-medium text-[color:var(--text-primary)]">
              Regras configuradas
            </div>
          </div>

          {/* Header row */}
          <div
            className="grid border-b border-[color:var(--text-muted)] pb-2 font-mono text-[9px] tracking-[0.12em] text-[color:var(--text-muted)]"
            style={{ gridTemplateColumns: "1fr 80px 90px 120px 80px 56px" }}
          >
            <span>REGRA</span>
            <span>ATIVO</span>
            <span>TIPO</span>
            <span>CANAL</span>
            <span>ÚLTIMA</span>
            <span className="text-right">ON</span>
          </div>

          <div className="divide-y divide-[color:var(--grid-line)]">
            {RULES.map((r, i) => (
              <div
                key={i}
                className={cn(
                  "grid items-center gap-3 py-3",
                  r.firedToday && "bg-[color:var(--bg-down)] -mx-1 px-1 rounded",
                )}
                style={{ gridTemplateColumns: "1fr 80px 90px 120px 80px 56px" }}
              >
                <div className="min-w-0">
                  <div
                    className={cn(
                      "truncate text-sm",
                      !r.on && "line-through text-[color:var(--text-muted)]",
                      r.on && "text-[color:var(--text-primary)]",
                    )}
                  >
                    {r.name}
                  </div>
                  {r.firedToday && (
                    <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-[9px] text-[color:var(--color-down)]">
                      <Bell className="h-2.5 w-2.5" />
                      DISPAROU HOJE
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs font-semibold text-[color:var(--text-primary)]">
                  {r.asset}
                </span>
                <span
                  className={cn(
                    "inline-block rounded border px-2 py-0.5 font-mono text-[10px]",
                    TYPE_COLORS[r.type],
                  )}
                >
                  {r.type}
                </span>
                <span className="font-mono text-[11px] text-[color:var(--text-muted)]">
                  {r.channel}
                </span>
                <span
                  className={cn(
                    "font-mono text-[11px]",
                    r.last === "nunca"
                      ? "text-[color:var(--text-muted)]"
                      : "text-[color:var(--text-primary)]",
                  )}
                >
                  {r.last}
                </span>
                <div className="flex justify-end">
                  <div
                    className={cn(
                      "relative h-5 w-9 rounded-full border transition-colors",
                      r.on
                        ? "border-[color:var(--color-up)] bg-[color:var(--bg-up)]"
                        : "border-[color:var(--panel-border)] bg-[color:var(--panel-bg)]",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full border transition-all",
                        r.on
                          ? "right-0.5 border-[color:var(--color-up)] bg-[color:var(--color-up)]"
                          : "left-0.5 border-[color:var(--panel-border)] bg-[color:var(--text-muted)]",
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-dashed border-[color:var(--panel-border)] p-4 text-center text-sm text-[color:var(--text-muted)]">
            + adicionar nova regra
          </div>
        </div>

        {/* Right column: builder + history */}
        <div className="flex flex-col gap-4">
          {/* Rule builder */}
          <div className="glass-panel rounded-xl p-5">
            <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
              CRIAR ALERTA
            </div>
            <div className="mt-1 text-lg font-medium text-[color:var(--text-primary)]">
              Nova regra
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 font-mono text-[10px] tracking-[0.12em] text-[color:var(--text-muted)]">
                  QUANDO
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] px-3 py-2.5 font-mono text-sm">
                  <span className="text-[color:var(--text-muted)]">se</span>
                  <span className="rounded border border-[color:var(--border-accent)] bg-[color:var(--bg-highlight)] px-2 py-0.5 text-xs text-[color:var(--color-up)]">
                    USD/BRL
                  </span>
                  <span className="text-[color:var(--text-muted)]">subir mais de</span>
                  <span className="rounded border border-[color:var(--border-accent)] bg-[color:var(--bg-highlight)] px-2 py-0.5 text-xs text-[color:var(--color-up)]">
                    2%
                  </span>
                  <span className="text-[color:var(--text-muted)]">em</span>
                  <span className="rounded border border-[color:var(--border-accent)] bg-[color:var(--bg-highlight)] px-2 py-0.5 text-xs text-[color:var(--color-up)]">
                    1 dia
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-1.5 font-mono text-[10px] tracking-[0.12em] text-[color:var(--text-muted)]">
                  ENTÃO
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] px-3 py-2.5 font-mono text-sm">
                  <span className="text-[color:var(--text-muted)]">envie</span>
                  <span className="rounded border border-[color:var(--border-accent)] bg-[color:var(--bg-highlight)] px-2 py-0.5 text-xs text-[color:var(--color-up)]">
                    push + email
                  </span>
                  <span className="text-[color:var(--text-muted)]">para</span>
                  <span className="rounded border border-[color:var(--border-accent)] bg-[color:var(--bg-highlight)] px-2 py-0.5 text-xs text-[color:var(--color-up)]">
                    tesouraria@
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-1.5 font-mono text-[10px] tracking-[0.12em] text-[color:var(--text-muted)]">
                  PRÉ-VIEW · últimos 12M
                </div>
                <div className="rounded-lg border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] p-3 text-center font-mono text-xs text-[color:var(--text-muted)]">
                  esta regra teria disparado{" "}
                  <span className="font-bold text-[color:var(--color-down)]">14×</span>{" "}
                  no último ano
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 rounded-lg bg-[color:var(--btn-active)] px-4 py-2.5 font-mono text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--border-accent)] transition-colors">
                  salvar regra
                </button>
                <button className="rounded-lg border border-[color:var(--panel-border)] px-4 py-2.5 font-mono text-sm text-[color:var(--text-muted)] hover:bg-[color:var(--btn-hover)] transition-colors">
                  testar
                </button>
              </div>
            </div>
          </div>

          {/* History timeline */}
          <div className="glass-panel rounded-xl p-5">
            <div className="text-[10px] font-mono tracking-[0.2em] text-[color:var(--text-muted)]">
              HISTÓRICO
            </div>
            <div className="mt-1 mb-4 text-lg font-medium text-[color:var(--text-primary)]">
              Últimos disparos
            </div>

            <div className="relative pl-5">
              <div className="absolute left-1.5 top-1 bottom-1 w-px bg-[color:var(--panel-border)]" />
              {HISTORY.map((h, i) => {
                const dotColor =
                  h.level === "hi"
                    ? "var(--color-down)"
                    : h.level === "md"
                    ? "var(--color-up)"
                    : "var(--text-muted)";
                return (
                  <div
                    key={i}
                    className="relative mb-3 border-b border-[color:var(--grid-line)] pb-3 last:border-0 last:mb-0"
                  >
                    <div
                      className="absolute -left-[17px] top-1 h-3 w-3 rounded-full border border-[color:var(--background)]"
                      style={{ background: dotColor }}
                    />
                    <div className="flex items-baseline justify-between">
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-xs font-semibold text-[color:var(--text-primary)]">
                          {h.asset}
                        </span>
                        <span className="ml-2 text-xs text-[color:var(--text-muted)]">
                          {h.msg}
                        </span>
                      </div>
                      <span className="ml-2 flex-shrink-0 font-mono text-[10px] text-[color:var(--text-muted)]">
                        {h.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-4 font-mono text-[10px] tracking-wider text-[color:var(--text-muted)]">
        <p>
          O sistema de alertas monitora as séries do BCB/SGS com atualização horária.
          Esta é uma ferramenta de monitoramento, não constitui recomendação de investimento.
        </p>
      </footer>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="font-mono text-[10px] tracking-[0.2em] text-[color:var(--text-muted)]">
        {label}
      </div>
      <div
        className={cn(
          "mt-2 font-mono text-4xl font-semibold tabular-nums",
          highlight
            ? "text-[color:var(--color-down)]"
            : "text-[color:var(--text-primary)]",
        )}
      >
        {value}
      </div>
      <div className="mt-1 font-mono text-xs text-[color:var(--text-muted)]">{sub}</div>
    </div>
  );
}
