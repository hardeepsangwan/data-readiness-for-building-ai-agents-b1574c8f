import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { AiDimension } from "@/lib/analysis.schema";

interface Props {
  dimensions: AiDimension[];
  color: string;
  height?: number;
}

function WrappedTick(props: any) {
  const { x, y, payload, textAnchor } = props;
  const label: string = payload?.value ?? "";
  const words = label.split(" ");
  const lines: string[] = [];
  let line = "";
  const max = 18;
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      if (line) lines.push(line.trim());
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return (
    <text x={x} y={y} textAnchor={textAnchor} fill="oklch(0.25 0.04 260)" fontSize={11} fontWeight={500}>
      {lines.map((ln, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 13}>{ln}</tspan>
      ))}
    </text>
  );
}

export function AiRadar({ dimensions, color, height = 420 }: Props) {
  const data = dimensions.map((d) => ({
    dimension: d.name,
    Current: Number(d.currentScore.toFixed(2)),
    Target: Number(d.targetScore.toFixed(2)),
  }));

  if (!data.length) return null;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="60%" margin={{ top: 24, right: 70, bottom: 24, left: 70 }}>
          <PolarGrid stroke="oklch(0.88 0.02 255)" />
          <PolarAngleAxis dataKey="dimension" tick={<WrappedTick />} />
          <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} tick={{ fill: "oklch(0.55 0.03 260)", fontSize: 10 }} stroke="oklch(0.88 0.02 255)" />
          <Radar name="Current (AI assessed)" dataKey="Current" stroke="oklch(0.55 0.20 30)" fill="oklch(0.55 0.20 30)" fillOpacity={0.35} strokeWidth={2} />
          <Radar name="Target (AI assessed)" dataKey="Target" stroke={color} fill={color} fillOpacity={0.22} strokeWidth={2} />
          <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
          <Tooltip contentStyle={{ background: "white", border: "1px solid oklch(0.91 0.015 255)", borderRadius: 8, fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
