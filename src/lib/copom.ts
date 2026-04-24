export type CopomMeeting = {
  number: number;
  date: string;
};

// Calendário oficial Copom (fonte pública: bcb.gov.br/controleinflacao/calendarioreunioescopom).
// Intencionalmente sem decisões hardcoded — a taxa vigente vem da série SGS 432 do próprio BC.
export const COPOM_MEETINGS: CopomMeeting[] = [
  { number: 258, date: "2024-05-08" },
  { number: 259, date: "2024-06-19" },
  { number: 260, date: "2024-07-31" },
  { number: 261, date: "2024-09-18" },
  { number: 262, date: "2024-11-06" },
  { number: 263, date: "2024-12-11" },
  { number: 264, date: "2025-01-29" },
  { number: 265, date: "2025-03-19" },
  { number: 266, date: "2025-05-07" },
  { number: 267, date: "2025-06-18" },
  { number: 268, date: "2025-07-30" },
  { number: 269, date: "2025-09-17" },
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
