import { DIMENSIONS, MATURITY_LEVELS } from "@/lib/assessment-data";

interface Row {
  id: string;
  name: string;
  color: string;
  current: number; // 0..5
  target: number;
}

interface Props {
  rows: Row[];
}

// Color per maturity level column (0..5): red → green
const LEVEL_COLORS = [
  "oklch(0.62 0.18 25)", // 0
  "oklch(0.68 0.16 45)", // 1
  "oklch(0.78 0.14 75)", // 2
  "oklch(0.72 0.14 145)", // 3
  "oklch(0.58 0.16 160)", // 4
  "oklch(0.50 0.18 180)", // 5 transformational
];

export function DimensionMaturityTable({ rows }: Props) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-y-1.5 text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <th className="w-[200px] px-2 py-2 text-left">Dimension</th>
            {MATURITY_LEVELS.map((m) => (
              <th key={m.level} className="px-1 py-2 text-center">
                <div className="font-semibold">L{m.level}</div>
                <div className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground">{m.name}</div>
              </th>
            ))}
            <th className="w-[110px] px-2 py-2 text-right">Current → Target</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const cur = Math.round(r.current);
            const tgt = Math.round(r.target);
            return (
              <tr key={r.id}>
                <td className="rounded-l-md bg-card px-3 py-2 align-middle">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: r.color }}>
                    {DIMENSIONS.find((d) => d.id === r.id)?.short}
                  </div>
                  <div className="text-sm font-medium text-foreground">{r.name}</div>
                </td>
                {LEVEL_COLORS.map((c, i) => {
                  const isCurrent = i === cur;
                  const isTarget = i === tgt;
                  const filled = isCurrent || isTarget;
                  return (
                    <td key={i} className="bg-card px-1 py-2 text-center align-middle">
                      <div
                        className="mx-auto flex h-9 w-full max-w-[64px] items-center justify-center rounded-md text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          background: filled ? c : `color-mix(in oklab, ${c} 18%, white)`,
                          color: filled ? "white" : `color-mix(in oklab, ${c} 60%, black)`,
                          border: isTarget && !isCurrent ? `2px dashed ${c}` : "1px solid color-mix(in oklab, " + c + " 25%, white)",
                          boxShadow: isCurrent ? `0 0 0 2px white inset, 0 1px 4px color-mix(in oklab, ${c} 40%, transparent)` : undefined,
                        }}
                        title={`Level ${i} · ${MATURITY_LEVELS[i].name}${isCurrent ? " (current)" : ""}${isTarget ? " (target)" : ""}`}
                      >
                        {isCurrent ? "Now" : isTarget ? "Tgt" : ""}
                      </div>
                    </td>
                  );
                })}
                <td className="rounded-r-md bg-card px-3 py-2 text-right align-middle">
                  <div className="text-sm font-bold">{r.current.toFixed(1)} → {r.target.toFixed(1)}</div>
                  <div className="text-[10px] text-muted-foreground">{MATURITY_LEVELS[cur].name}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-5 min-w-[36px] items-center justify-center rounded px-1.5 text-[10px] font-semibold uppercase tracking-wider text-white" style={{ background: "oklch(0.50 0.18 180)" }}>Now</span>
          <span>Current state</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-5 min-w-[36px] items-center justify-center rounded border-2 border-dashed px-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ borderColor: "oklch(0.50 0.18 180)", color: "oklch(0.50 0.18 180)" }}>Tgt</span>
          <span>Target state</span>
        </div>
        <div className="ml-auto">Columns: Maturity levels (L0 No Capability → L5 Transformational)</div>
      </div>
    </div>
  );
}
