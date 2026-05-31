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

// Wrap long dimension labels across multiple lines so the full name is visible
// (avoids Recharts' default truncation of long axis labels).
function WrappedAngleTick(props: any) {
  const { x, y, payload, textAnchor } = props;
  const label: string = payload?.value ?? "";
  const words = label.split(" ");
  const lines: string[] = [];
  let line = "";
  const maxLen = 16;
  for (const w of words) {
    if ((line + " " + w).trim().length > maxLen) {
      if (line) lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);

  return (
    <text x={x} y={y} textAnchor={textAnchor} fill="oklch(0.25 0.04 260)" fontSize={12} fontWeight={500}>
      {lines.map((ln, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 14}>{ln}</tspan>
      ))}
    </text>
  );
}

export function BlueprintRadar({ axes, height = 460 }: { axes: RadarAxis[]; height?: number }) {
  const data = axes.map((a) => ({
    dimension: a.axis,
    Current: Number((a.current || 0).toFixed(2)),
    Target: Number((a.target || 0).toFixed(2)),
  }));
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="62%" margin={{ top: 24, right: 80, bottom: 24, left: 80 }}>
          <PolarGrid stroke="oklch(0.85 0.02 255)" />
          <PolarAngleAxis dataKey="dimension" tick={<WrappedAngleTick />} />
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
