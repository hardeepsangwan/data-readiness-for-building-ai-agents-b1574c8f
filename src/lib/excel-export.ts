import ExcelJS from "exceljs";
import { WORKSTREAMS, MATURITY_LEVELS, workstreamAverages, stepAverages, type Workstream } from "./assessment-data";
import { getOpenQuestions, renderPrompt } from "./open-questions";
import type { AssessmentState } from "./assessment-store";

function headerRows(state: AssessmentState, title: string): (string | number)[][] {
  return [
    [title],
    [],
    ["Organization", state.org.name || ""],
    ["Respondent", state.org.respondent || ""],
    ["Business function", state.org.businessFunction || ""],
    ["Business process", state.org.businessProcess || ""],
    ["Executive sponsor", state.org.executiveSponsor || ""],
    ["In-scope systems", state.org.inScopeSystems || ""],
    ["Definition of success", state.org.successDefinition || ""],
    ["Target timeline", state.org.timeline || ""],
    ["Date of assessment", state.org.date || ""],
    [],
  ];
}

function addWorkstreamSheets(wb: ExcelJS.Workbook, state: AssessmentState, w: Workstream) {
  const summary = wb.addWorksheet(`${w.short} — Summary`.slice(0, 31));
  summary.columns = [{ width: 32 }, { width: 80 }];
  headerRows(state, `${w.name} — Summary`).forEach((r) => summary.addRow(r));
  summary.addRow(["Key output ★", w.keyOutput]);
  summary.addRow(["Handshake to", w.handshakeTo]);
  summary.addRow([]);
  summary.addRow(["Deliverable templates"]);
  w.templates.forEach((t) => summary.addRow(["", t]));
  summary.addRow([]);
  summary.addRow(["Gate criteria"]);
  w.gateCriteria.forEach((g) => summary.addRow(["", g]));
  summary.addRow([]);
  summary.addRow(["Handshake outputs to next workstream"]);
  w.handshakeOutputs.forEach((o) => summary.addRow(["", o]));
  summary.addRow([]);
  const sg = state.gates[w.id];
  summary.addRow(["Gate signed by", sg?.signedBy || "—"]);
  summary.addRow(["Gate signed at", sg?.signedAt ? new Date(sg.signedAt).toLocaleString() : "—"]);
  if (sg?.notes) summary.addRow(["Gate notes", sg.notes]);
  summary.addRow([]);
  summary.addRow(["Step", "Current avg", "Target avg", "Gap"]);
  w.steps.forEach((s) => {
    const a = stepAverages(s, state.answers);
    summary.addRow([s.name, a.current.toFixed(2), a.target.toFixed(2), (a.target - a.current).toFixed(2)]);
  });

  // One sheet per step (includes maturity Qs + open discovery answers)
  const ctx = { businessFunction: state.org.businessFunction, businessProcess: state.org.businessProcess };
  w.steps.forEach((s, i) => {
    const ws = wb.addWorksheet(`${w.short.slice(0, 8)} S${i + 1} ${s.short}`.replace(/[\\/?*[\]:]/g, "").slice(0, 31));
    ws.columns = [
      { width: 4 }, { width: 70 }, { width: 60 },
      { width: 12 }, { width: 16 }, { width: 12 }, { width: 16 }, { width: 6 },
    ];
    ws.addRow([`${w.name} — Step ${i + 1}: ${s.name}`]);
    ws.addRow([s.description]);
    ws.addRow([]);
    ws.addRow(["#", "Question", "Why it matters", "Current level", "Current label", "Target level", "Target label", "Gap"]);
    s.questions.forEach((q, qi) => {
      const a = state.answers[q.id];
      const cur = a?.current;
      const tgt = a?.target;
      ws.addRow([
        qi + 1, q.text, q.relevance,
        cur ?? "", cur !== undefined ? MATURITY_LEVELS[cur].name : "",
        tgt ?? "", tgt !== undefined ? MATURITY_LEVELS[tgt].name : "",
        a ? a.target - a.current : "",
      ]);
    });

    const openQs = getOpenQuestions(s.id);
    if (openQs.length) {
      ws.addRow([]);
      ws.addRow(["", "Discovery (free-text) answers"]);
      ws.addRow(["#", "Prompt", "Answer"]);
      openQs.forEach((oq, oi) => {
        ws.addRow([
          `D${oi + 1}`,
          renderPrompt(oq.prompt, ctx),
          state.openAnswers[oq.id] || "",
        ]);
      });
    }
  });

  // AI findings sheet for this workstream
  const ai = state.aiResults[w.id];
  if (ai) {
    const aiSheet = wb.addWorksheet(`${w.short.slice(0, 10)} AI`.replace(/[\\/?*[\]:]/g, "").slice(0, 31));
    aiSheet.columns = [{ width: 6 }, { width: 32 }, { width: 90 }, { width: 14 }, { width: 14 }];
    aiSheet.addRow([`${w.name} — AI findings`]);
    aiSheet.addRow(["Model", ai.model, "Generated", new Date(ai.generatedAt).toLocaleString()]);
    aiSheet.addRow([]);
    aiSheet.addRow(["Executive summary"]);
    aiSheet.addRow(["", ai.summary]);
    aiSheet.addRow([]);
    aiSheet.addRow(["Dimension", "Current", "Target", "Rationale"]);
    ai.dimensions.forEach((d) => aiSheet.addRow([d.name, d.currentScore, d.targetScore, d.rationale]));
    aiSheet.addRow([]);
    aiSheet.addRow(["Pain points"]);
    aiSheet.addRow(["ID", "Title", "Severity", "Affected dimensions", "Evidence"]);
    ai.painPoints.forEach((p) =>
      aiSheet.addRow([p.id, p.title, p.severity, p.affectedDimensions.join("; "), p.evidence])
    );
    aiSheet.addRow([]);
    aiSheet.addRow(["Next-best actions (Azure CAF for AI Agents)"]);
    aiSheet.addRow(["ID", "Title", "Addresses", "CAF pillar", "Owner", "Effort", "Steps"]);
    ai.actions.forEach((a) =>
      aiSheet.addRow([
        a.id, a.title, a.addressesPainPoints.join(", "), a.cafPillar, a.owner, a.effort,
        a.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"),
      ])
    );
  }
}

function fileName(state: AssessmentState, suffix: string) {
  const slug = (state.org.businessFunction || state.org.name || "assessment").replace(/\s+/g, "-").toLowerCase();
  const date = state.org.date || new Date().toISOString().slice(0, 10);
  return `data-blueprint-${slug}-${suffix}-${date}.xlsx`;
}

async function download(wb: ExcelJS.Workbook, name: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadWorkstreamExcel(state: AssessmentState, workstreamId: string) {
  const w = WORKSTREAMS.find((x) => x.id === workstreamId);
  if (!w) return;
  const wb = new ExcelJS.Workbook();
  addWorkstreamSheets(wb, state, w);
  await download(wb, fileName(state, w.short.toLowerCase().replace(/\s+/g, "-")));
}

export async function downloadMasterExcel(state: AssessmentState) {
  const wb = new ExcelJS.Workbook();

  // Overview
  const ov = wb.addWorksheet("Overview");
  ov.columns = [{ width: 32 }, { width: 80 }];
  headerRows(state, "Data Blueprint — Master Assessment").forEach((r) => ov.addRow(r));
  ov.addRow(["Workstream", "Current avg", "Target avg", "Gap", "Gate signed by"]);
  WORKSTREAMS.forEach((w) => {
    const a = workstreamAverages(w, state.answers);
    const sg = state.gates[w.id];
    ov.addRow([w.name, a.current.toFixed(2), a.target.toFixed(2), (a.target - a.current).toFixed(2), sg?.signedBy || "—"]);
  });
  ov.addRow([]);
  ov.addRow(["Maturity scale"]);
  MATURITY_LEVELS.forEach((m) => ov.addRow([`Level ${m.level} — ${m.name}`, m.description]));

  // Gap Analysis tab
  const gap = wb.addWorksheet("Gap Analysis");
  gap.columns = [
    { width: 26 }, { width: 32 }, { width: 14 }, { width: 14 }, { width: 10 },
    { width: 14 }, { width: 60 },
  ];
  gap.addRow(["Workstream", "Step", "Current avg", "Target avg", "Gap", "Priority", "Suggested remediation"]);
  WORKSTREAMS.forEach((w) => {
    w.steps.forEach((s) => {
      const a = stepAverages(s, state.answers);
      const g = a.target - a.current;
      const priority = g >= 2 ? "High" : g >= 1 ? "Medium" : "Maintain";
      gap.addRow([
        w.short, s.name, a.current.toFixed(2), a.target.toFixed(2), g.toFixed(2),
        priority,
        `Close gap from ${a.current.toFixed(1)} to ${a.target.toFixed(1)}: ${s.description}`,
      ]);
    });
  });

  // Use Case Prioritisation tab (template)
  const uc = wb.addWorksheet("Use Case Prioritisation");
  uc.columns = [
    { width: 28 }, { width: 50 }, { width: 22 }, { width: 14 },
    { width: 18 }, { width: 22 }, { width: 18 }, { width: 22 }, { width: 28 },
  ];
  uc.addRow([
    "Use case", "Business outcome", "Data readiness (RAG)",
    "CAF Business Impact (1-5)", "CAF User Desirability (1-5)", "CAF Technical Feasibility (1-5)",
    "Overall priority", "Agent type (Productivity/Action/Automation)", "Platform (M365 Copilot / Copilot Studio / Foundry)",
  ]);
  uc.addRow([
    `${state.org.businessFunction || "FP&A"} — ${state.org.businessProcess || "Pilot"}`,
    "Faster, more accurate analysis grounded on enterprise data", "Amber",
    4, 4, 3, "High", "Productivity", "Copilot Studio + Fabric IQ",
  ]);

  // Per-workstream sheets
  WORKSTREAMS.forEach((w) => addWorkstreamSheets(wb, state, w));

  await download(wb, fileName(state, "master"));
}

// Back-compat name used by older imports
export const downloadAssessmentExcel = downloadMasterExcel;
