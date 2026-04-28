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
import { DIMENSIONS } from "@/lib/assessment-data";
import type { AssessmentState } from "@/lib/assessment-store";

interface Props {
  state: AssessmentState;
  height?: number;
}

export function MaturityRadar({ state, height = 460 }: Props) {
  const data = DIMENSIONS.map((d) => {
    const answered = d.questions.filter((q) => state.answers[q.id]);
    const cur = answered.length
      ? answered.reduce((s, q) => s + state.answers[q.id].current, 0) / answered.length
      : 0;
    const tgt = answered.length
      ? answered.reduce((s, q) => s + state.answers[q.id].target, 0) / answered.length
      : 0;
    return {
      dimension: d.short,
      Current: Number(cur.toFixed(2)),
      Target: Number(tgt.toFixed(2)),
    };
  });

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="oklch(0.85 0.02 255)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "oklch(0.25 0.04 260)", fontSize: 13, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tickCount={6}
            tick={{ fill: "oklch(0.55 0.03 260)", fontSize: 11 }}
            stroke="oklch(0.85 0.02 255)"
          />
          <Radar
            name="Current state"
            dataKey="Current"
            stroke="oklch(0.55 0.20 30)"
            fill="oklch(0.55 0.20 30)"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Radar
            name="Target state"
            dataKey="Target"
            stroke="oklch(0.45 0.18 255)"
            fill="oklch(0.45 0.18 255)"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Legend wrapperStyle={{ paddingTop: 12, fontSize: 13 }} />
          <Tooltip
            contentStyle={{
              background: "white",
              border: "1px solid oklch(0.91 0.015 255)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
