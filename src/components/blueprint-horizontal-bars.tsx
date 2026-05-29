import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { RadarAxis } from "@/lib/blueprint-schema";

export function BlueprintHorizontalBars({ axes, height = 420 }: { axes: RadarAxis[]; height?: number }) {
  const data = axes.map((a) => ({
    name: a.axis,
    Current: Number((a.current || 0).toFixed(2)),
    Target: Number((a.target || 0).toFixed(2)),
  }));
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 32, left: 8, bottom: 8 }} barGap={4}>
          <CartesianGrid horizontal={false} stroke="oklch(0.92 0.01 255)" />
          <XAxis type="number" domain={[0, 5]} tickCount={6} tick={{ fill: "oklch(0.45 0.03 260)", fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fill: "oklch(0.25 0.04 260)", fontSize: 12, fontWeight: 500 }} />
          <Tooltip contentStyle={{ background: "white", border: "1px solid oklch(0.91 0.015 255)", borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Current" fill="oklch(0.60 0.20 30)" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="Current" position="right" style={{ fill: "oklch(0.45 0.18 30)", fontSize: 11, fontWeight: 600 }} />
          </Bar>
          <Bar dataKey="Target" fill="oklch(0.50 0.18 255)" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="Target" position="right" style={{ fill: "oklch(0.40 0.18 255)", fontSize: 11, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
