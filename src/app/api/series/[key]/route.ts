import { NextResponse } from "next/server";
import { getSeriesRange } from "@/lib/bcb";
import { INDICATORS, type IndicatorKey } from "@/lib/indicators";

export const revalidate = 3600;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!(key in INDICATORS)) {
    return NextResponse.json({ error: "unknown indicator" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const days = Math.max(7, Math.min(5000, Number(searchParams.get("days") ?? 180)));

  try {
    const data = await getSeriesRange(key as IndicatorKey, days);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "fetch failed" },
      { status: 502 },
    );
  }
}
