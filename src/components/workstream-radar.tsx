import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { stepAverages, type Workstream, type MaturityLevel } from "@/lib/assessment-data";

interface Props {
  workstream: Workstream;
  answers: Record<string, { current: MaturityLevel; target: MaturityLevel }>;
  height?: number;
}

export function WorkstreamRadar({ workstream, answers, height = 360 }: Props) {
  const data = workstream.steps.map((s) => {
    const { current, target } = stepAverages(s, answers);
    return {
      dimension: s.short,
      Current: Number(current.toFixed(2)),
      Target: Number(target.toFixed(2)),
    };
  });

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="oklch(0.88 0.02 255)" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: "oklch(0.25 0.04 260)", fontSize: 12, fontWeight: 500 }} />
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
