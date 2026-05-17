import ExcelJS from "exceljs";
import { DIMENSIONS, MATURITY_LEVELS } from "./assessment-data";
import type { AssessmentState } from "./assessment-store";

export async function downloadAssessmentExcel(state: AssessmentState) {
  const wb = new ExcelJS.Workbook();

  // Overview sheet
  const overview = wb.addWorksheet("Overview");
  overview.columns = [{ width: 28 }, { width: 90 }];
  overview.addRows([
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
  ]);

  // One sheet per dimension
  DIMENSIONS.forEach((d) => {
    const safeName = d.name.replace(/[\\/?*[\]:]/g, "").slice(0, 31);
    const ws = wb.addWorksheet(safeName);
    ws.columns = [
      { width: 4 },
      { width: 70 },
      { width: 60 },
      { width: 12 },
      { width: 16 },
      { width: 12 },
      { width: 16 },
      { width: 6 },
    ];
    ws.addRow([d.name]);
    ws.addRow([d.description]);
    ws.addRow([]);
    ws.addRow(["#", "Question", "Why it matters", "Current level", "Current label", "Target level", "Target label", "Gap"]);
    d.questions.forEach((q, i) => {
      const a = state.answers[q.id];
      const cur = a?.current;
      const tgt = a?.target;
      ws.addRow([
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
  });

  const fileName = `data-readiness-${(state.org.name || "assessment").replace(/\s+/g, "-").toLowerCase()}-${state.org.date || new Date().toISOString().slice(0, 10)}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
