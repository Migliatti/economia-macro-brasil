"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { SeriesPoint } from "@/lib/bcb";

export function Sparkline({
  data,
  color,
}: {
  data: SeriesPoint[];
  color: string;
}) {
  if (data.length < 2) return null;
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
