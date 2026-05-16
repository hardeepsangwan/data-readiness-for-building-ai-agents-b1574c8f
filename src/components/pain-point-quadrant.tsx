import { DIMENSIONS } from "@/lib/assessment-data";

interface Point {
  id: string;
  label: string;
  color: string;
  current: number;
  target: number;
}

interface Props {
  points: Point[];
}

/**
 * Magic-quadrant style heatmap of pain points.
 * X = current maturity (0..5), Y = gap (target - current).
 * Top-right = highest pain (high target, low current).
 */
export function PainPointQuadrant({ points }: Props) {
  const W = 520;
  const H = 420;
  const PAD = 48;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  const x = (current: number) => PAD + (current / 5) * innerW;
  const y = (gap: number) => PAD + innerH - (Math.max(0, Math.min(5, gap)) / 5) * innerH;

  // background heat: 5x5 grid colored by combined "pain" intensity
  const cells: { gx: number; gy: number; intensity: number }[] = [];
  for (let gx = 0; gx < 5; gx++) {
    for (let gy = 0; gy < 5; gy++) {
      // pain rises as current decreases (gx low) and gap increases (gy high)
      const pain = (1 - gx / 4) * 0.5 + (gy / 4) * 0.5;
      cells.push({ gx, gy, intensity: pain });
    }
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full max-w-[640px]">
        {/* heat cells */}
        {cells.map(({ gx, gy, intensity }) => {
          const cellW = innerW / 5;
          const cellH = innerH / 5;
          const cx = PAD + gx * cellW;
          const cy = PAD + innerH - (gy + 1) * cellH;
          // red-ish for high pain, green-ish for low
          const hue = 145 - intensity * 120; // 145 (green) → 25 (red)
          const fill = `oklch(0.92 ${0.04 + intensity * 0.1} ${hue})`;
          return (
            <rect
              key={`${gx}-${gy}`}
              x={cx}
              y={cy}
              width={cellW}
              height={cellH}
              fill={fill}
              stroke="white"
              strokeWidth={1}
            />
          );
        })}

        {/* axis lines */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="oklch(0.55 0.03 260)" strokeWidth={1.5} />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="oklch(0.55 0.03 260)" strokeWidth={1.5} />

        {/* quadrant labels */}
        <text x={PAD + 8} y={PAD + 16} className="fill-foreground" fontSize="10" fontWeight="600">
          HIGH PAIN — fix first
        </text>
        <text x={W - PAD - 8} y={PAD + 16} textAnchor="end" className="fill-foreground" fontSize="10" fontWeight="600">
          Stretch goal
        </text>
        <text x={PAD + 8} y={H - PAD - 8} className="fill-foreground" fontSize="10" fontWeight="600">
          Quick wins
        </text>
        <text x={W - PAD - 8} y={H - PAD - 8} textAnchor="end" className="fill-foreground" fontSize="10" fontWeight="600">
          Maintain
        </text>

        {/* axis titles */}
        <text x={W / 2} y={H - 12} textAnchor="middle" fontSize="11" className="fill-muted-foreground">
          Current maturity →
        </text>
        <text x={14} y={H / 2} textAnchor="middle" fontSize="11" transform={`rotate(-90 14 ${H / 2})`} className="fill-muted-foreground">
          Gap (target − current) →
        </text>

        {/* tick labels */}
        {[0, 1, 2, 3, 4, 5].map((v) => (
          <g key={`tx-${v}`}>
            <text x={x(v)} y={H - PAD + 14} textAnchor="middle" fontSize="9" className="fill-muted-foreground">{v}</text>
          </g>
        ))}
        {[0, 1, 2, 3, 4, 5].map((v) => (
          <g key={`ty-${v}`}>
            <text x={PAD - 6} y={y(v) + 3} textAnchor="end" fontSize="9" className="fill-muted-foreground">{v}</text>
          </g>
        ))}

        {/* points */}
        {points.map((p) => {
          const gap = p.target - p.current;
          return (
            <g key={p.id}>
              <circle cx={x(p.current)} cy={y(gap)} r={9} fill={p.color} stroke="white" strokeWidth={2} />
              <text
                x={x(p.current) + 12}
                y={y(gap) + 4}
                fontSize="11"
                fontWeight={600}
                className="fill-foreground"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function buildQuadrantPoints(
  answers: Record<string, { current: number; target: number }>,
): Point[] {
  return DIMENSIONS.map((d) => {
    const answered = d.questions.filter((q) => answers[q.id]);
    const cur = answered.length
      ? answered.reduce((s, q) => s + answers[q.id].current, 0) / answered.length
      : 0;
    const tgt = answered.length
      ? answered.reduce((s, q) => s + answers[q.id].target, 0) / answered.length
      : 0;
    return { id: d.id, label: d.short, color: d.color, current: cur, target: tgt };
  });
}
