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
import { DIMENSIONS } from "@/lib/assessment-data";
import type { AssessmentState } from "@/lib/assessment-store";

interface Props {
  state: AssessmentState;
  height?: number;
}

export function DimensionHorizontalChart({ state, height = 380 }: Props) {
  const data = DIMENSIONS.map((d) => {
    const answered = d.questions.filter((q) => state.answers[q.id]);
    const cur = answered.length
      ? answered.reduce((s, q) => s + state.answers[q.id].current, 0) / answered.length
      : 0;
    const tgt = answered.length
      ? answered.reduce((s, q) => s + state.answers[q.id].target, 0) / answered.length
      : 0;
    return {
      name: d.short === "CI/CD" ? "Code Promotion" : `Data ${d.short}`,
      Current: Number(cur.toFixed(2)),
      Target: Number(tgt.toFixed(2)),
    };
  });

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 32, left: 24, bottom: 8 }}
          barGap={4}
        >
          <CartesianGrid horizontal={false} stroke="oklch(0.92 0.01 255)" />
          <XAxis
            type="number"
            domain={[0, 5]}
            tickCount={6}
            tick={{ fill: "oklch(0.45 0.03 260)", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fill: "oklch(0.25 0.04 260)", fontSize: 12, fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={{
              background: "white",
              border: "1px solid oklch(0.91 0.015 255)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
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
