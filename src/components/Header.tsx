import { Activity } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export function Header({ lastUpdate }: { lastUpdate: Date }) {
  return (
    <header className="glass-panel rounded-xl px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--bg-highlight)]">
            <Activity className="h-4 w-4 text-[color:var(--color-up)]" />
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-[color:var(--text-muted)]">
              MACRO · BRASIL
            </div>
            <h1 className="font-mono text-base font-medium text-[color:var(--text-primary)]">
              Bússola Macroeconômica
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-wider text-[color:var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-up)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--color-up)]" />
            </span>
            LIVE
          </span>
          <span>·</span>
          <span>atualizado {formatDateTime(lastUpdate)}</span>
        </div>
      </div>
    </header>
  );
}
