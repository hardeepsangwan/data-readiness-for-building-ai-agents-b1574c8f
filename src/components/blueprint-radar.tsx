import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { RadarAxis } from "@/lib/blueprint-schema";

export function BlueprintRadar({ axes, height = 420 }: { axes: RadarAxis[]; height?: number }) {
  const data = axes.map((a) => ({
    dimension: a.axis,
    Current: Number((a.current || 0).toFixed(2)),
    Target: Number((a.target || 0).toFixed(2)),
  }));
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="oklch(0.85 0.02 255)" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: "oklch(0.25 0.04 260)", fontSize: 12, fontWeight: 500 }} />
          <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} tick={{ fill: "oklch(0.55 0.03 260)", fontSize: 11 }} stroke="oklch(0.85 0.02 255)" />
          <Radar name="Current" dataKey="Current" stroke="oklch(0.55 0.20 30)" fill="oklch(0.55 0.20 30)" fillOpacity={0.35} strokeWidth={2} />
          <Radar name="Target" dataKey="Target" stroke="oklch(0.45 0.18 255)" fill="oklch(0.45 0.18 255)" fillOpacity={0.25} strokeWidth={2} />
          <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} />
          <Tooltip contentStyle={{ background: "white", border: "1px solid oklch(0.91 0.015 255)", borderRadius: 8, fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
