import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Render a DOM element to a multi-page A4 PDF and trigger download.
 * Uses html2canvas → image → jsPDF so any rich UI (charts, tables) is captured.
 */
export async function exportElementToPdf(
  el: HTMLElement,
  filename: string,
  title?: string,
) {
  // Temporarily neutralise OKLCH colors that html2canvas can't parse.
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: el.scrollWidth,
  });
  const img = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const usableW = pageW - margin * 2;

  if (title) {
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(title, margin, margin + 4);
  }
  const headerH = title ? 28 : 0;

  const imgH = (canvas.height * usableW) / canvas.width;
  const usableH = pageH - margin * 2 - headerH;

  if (imgH <= usableH) {
    pdf.addImage(img, "PNG", margin, margin + headerH, usableW, imgH);
  } else {
    // Slice the canvas into page-height chunks.
    const pageCanvas = document.createElement("canvas");
    const ctx = pageCanvas.getContext("2d")!;
    const sliceHpx = Math.floor((usableH * canvas.width) / usableW);
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHpx;
    let y = 0;
    let firstPage = true;
    while (y < canvas.height) {
      const h = Math.min(sliceHpx, canvas.height - y);
      pageCanvas.height = h;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, h);
      ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
      const sliceImg = pageCanvas.toDataURL("image/png");
      const sliceHpt = (h * usableW) / canvas.width;
      if (!firstPage) {
        pdf.addPage();
      } else if (title) {
        // header already drawn on first page
      }
      pdf.addImage(
        sliceImg,
        "PNG",
        margin,
        margin + (firstPage ? headerH : 0),
        usableW,
        sliceHpt,
      );
      y += h;
      firstPage = false;
    }
  }

  pdf.save(filename);
}
