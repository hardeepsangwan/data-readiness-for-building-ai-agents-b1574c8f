import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { stepAverages, type Workstream, type MaturityLevel } from "@/lib/assessment-data";

interface Props {
  workstream: Workstream;
  answers: Record<string, { current: MaturityLevel; target: MaturityLevel }>;
  height?: number;
}

// Wrap long dimension names across multiple tspans so the full label is visible
// on the radar (no more truncated "Mandate" — show "CoE Mandate & Scope").
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
    <text x={x} y={y} textAnchor={textAnchor} fill="oklch(0.25 0.04 260)" fontSize={11} fontWeight={500}>
      {lines.map((ln, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 13}>{ln}</tspan>
      ))}
    </text>
  );
}

export function WorkstreamRadar({ workstream, answers, height = 420 }: Props) {
  const data = workstream.steps.map((s) => {
    const { current, target } = stepAverages(s, answers);
    return {
      dimension: s.name,
      Current: Number(current.toFixed(2)),
      Target: Number(target.toFixed(2)),
    };
  });

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="62%" margin={{ top: 24, right: 60, bottom: 24, left: 60 }}>
          <PolarGrid stroke="oklch(0.88 0.02 255)" />
          <PolarAngleAxis dataKey="dimension" tick={<WrappedAngleTick />} />
          <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} tick={{ fill: "oklch(0.55 0.03 260)", fontSize: 10 }} stroke="oklch(0.88 0.02 255)" />
          <Radar name="Current state" dataKey="Current" stroke="oklch(0.55 0.20 30)" fill="oklch(0.55 0.20 30)" fillOpacity={0.35} strokeWidth={2} />
          <Radar name="Target state" dataKey="Target" stroke={workstream.color} fill={workstream.color} fillOpacity={0.22} strokeWidth={2} />
          <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
          <Tooltip contentStyle={{ background: "white", border: "1px solid oklch(0.91 0.015 255)", borderRadius: 8, fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
