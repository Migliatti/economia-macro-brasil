export type CopomMeeting = {
  number: number;
  date: string;
};

// Calendário oficial Copom 2026 (fonte pública: bcb.gov.br/controleinflacao/calendarioreunioescopom).
// Intencionalmente sem decisões hardcoded — a taxa vigente vem da série SGS 432 do próprio BC.
export const COPOM_MEETINGS: CopomMeeting[] = [
  { number: 270, date: "2025-12-10" },
  { number: 271, date: "2026-01-28" },
  { number: 272, date: "2026-03-18" },
  { number: 273, date: "2026-05-06" },
  { number: 274, date: "2026-06-17" },
  { number: 275, date: "2026-07-29" },
  { number: 276, date: "2026-09-16" },
  { number: 277, date: "2026-11-04" },
  { number: 278, date: "2026-12-09" },
];

export function getNextMeeting(today = new Date()): CopomMeeting | null {
  const iso = today.toISOString().slice(0, 10);
  return COPOM_MEETINGS.find((m) => m.date > iso) ?? null;
}

export function getPastMeetings(today = new Date(), limit = 4): CopomMeeting[] {
  const iso = today.toISOString().slice(0, 10);
  return COPOM_MEETINGS.filter((m) => m.date <= iso).slice(-limit).reverse();
}
