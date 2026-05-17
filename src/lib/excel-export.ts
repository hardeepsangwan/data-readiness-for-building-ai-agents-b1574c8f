import * as XLSX from "xlsx";
import { DIMENSIONS, MATURITY_LEVELS } from "./assessment-data";
import type { AssessmentState } from "./assessment-store";

export function downloadAssessmentExcel(state: AssessmentState) {
  const wb = XLSX.utils.book_new();

  // Cover sheet
  const cover = [
    ["Data Readiness Assessment for AI Agents"],
    [],
    ["Organization", state.org.name || ""],
    ["Respondent", state.org.respondent || ""],
    ["Business function", state.org.businessFunction || ""],
    ["Business process", state.org.businessProcess || ""],
    ["Date of assessment", state.org.date || ""],
    [],
    ["Maturity scale"],
    ...MATURITY_LEVELS.map((m) => [`Level ${m.level} · ${m.name}`, m.description]),
  ];
  const coverWs = XLSX.utils.aoa_to_sheet(cover);
  coverWs["!cols"] = [{ wch: 28 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, coverWs, "Overview");

  // One sheet per dimension
  DIMENSIONS.forEach((d) => {
    const rows: (string | number)[][] = [
      [d.name],
      [d.description],
      [],
      ["#", "Question", "Why it matters", "Current level", "Current label", "Target level", "Target label", "Gap"],
    ];
    d.questions.forEach((q, i) => {
      const a = state.answers[q.id];
      const cur = a?.current;
      const tgt = a?.target;
      rows.push([
        i + 1,
        q.text,
        q.relevance,
        cur ?? "",
        cur !== undefined ? MATURITY_LEVELS[cur].name : "",
        tgt ?? "",
        tgt !== undefined ? MATURITY_LEVELS[tgt].name : "",
        a ? a.target - a.current : "",
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 4 },
      { wch: 70 },
      { wch: 60 },
      { wch: 12 },
      { wch: 16 },
      { wch: 12 },
      { wch: 16 },
      { wch: 6 },
    ];
    // sheet names <=31 chars, no special chars
    const safeName = d.name.replace(/[\\/?*[\]]/g, "").slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });

  const fileName = `data-readiness-${(state.org.name || "assessment").replace(/\s+/g, "-").toLowerCase()}-${state.org.date || new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
