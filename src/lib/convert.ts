import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { extractTextFromPDF } from "./pdf";

function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

/** CSV → Excel (.xlsx) */
export async function csvToExcel(file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const name = file.name.replace(/\.csv$/i, "") + ".xlsx";
  downloadBlob(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    name
  );
}

/** Excel → CSV */
export async function excelToCsv(file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("File Excel kosong / tidak valid.");
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
  const name = file.name.replace(/\.(xlsx|xls)$/i, "") + ".csv";
  downloadBlob(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), name);
}

/** JSON → CSV */
export async function jsonToCsv(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text);
  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) throw new Error("JSON kosong.");
  const sheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  const name = file.name.replace(/\.json$/i, "") + ".csv";
  downloadBlob(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), name);
}

/** CSV → JSON */
export async function csvToJson(file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet);
  const name = file.name.replace(/\.csv$/i, "") + ".json";
  downloadBlob(
    new Blob([JSON.stringify(json, null, 2)], { type: "application/json" }),
    name
  );
}

/** PDF → TXT */
export async function pdfToTxt(file: File): Promise<void> {
  const text = await extractTextFromPDF(file);
  if (!text.trim()) {
    throw new Error("Tidak ada teks di PDF. File mungkin hasil scan (gambar).");
  }
  const name = file.name.replace(/\.pdf$/i, "") + ".txt";
  downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), name);
}

/** PDF → DOCX (teks saja) */
export async function pdfToDocx(file: File): Promise<void> {
  const text = await extractTextFromPDF(file);
  if (!text.trim()) {
    throw new Error("Tidak ada teks di PDF. File mungkin hasil scan (gambar).");
  }
  const paragraphs = text
    .split(/\n+/)
    .filter((p) => p.trim())
    .map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line, size: 24 })],
          spacing: { after: 120 },
        })
    );
  const doc = new Document({
    sections: [
      {
        children: paragraphs.length
          ? paragraphs
          : [new Paragraph({ children: [new TextRun("")] })],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  const name = file.name.replace(/\.pdf$/i, "") + ".docx";
  downloadBlob(blob, name);
}

/** DOCX → TXT */
export async function docxToTxt(file: File): Promise<void> {
  const mammoth = await import("mammoth");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  const name = file.name.replace(/\.docx$/i, "") + ".txt";
  downloadBlob(
    new Blob([result.value], { type: "text/plain;charset=utf-8" }),
    name
  );
}

/** DOCX → HTML file */
export async function docxToHtml(file: File): Promise<void> {
  const html = await docxToHtmlString(file);
  const name = file.name.replace(/\.docx$/i, "") + ".html";
  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), name);
}

/** DOCX → full HTML document string (preview + print) */
export async function docxToHtmlString(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
  if (!result.value.trim()) {
    throw new Error("Tidak ada konten yang dapat dikonversi dari file Word.");
  }
  const title = file.name.replace(/\.docx$/i, "").replace(/[<>]/g, "");
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    @page { margin: 15mm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #111;
      max-width: 210mm;
      margin: 0 auto;
      padding: 12mm;
      background: #fff;
    }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    td, th { border: 1px solid #999; padding: 6px 8px; }
    h1, h2, h3 { margin-top: 1.2em; page-break-after: avoid; }
    p { margin: 0.45em 0; }
    @media screen and (max-width: 640px) {
      body { max-width: none; padding: 6mm; font-size: 11pt; overflow-wrap: anywhere; }
      table { display: block; max-width: 100%; overflow-x: auto; }
    }
    @media print {
      body { padding: 0; max-width: none; }
    }
  </style>
</head>
<body>
${result.value}
</body>
</html>`;
}

/** PPTX -> printable HTML for browser preview and Save as PDF. */
export async function pptxToPrintableHtml(file: File): Promise<{
  html: string;
  dispose: () => void;
}> {
  const { parse, presentationToPrintableHtml } = await import("@web-ppt/core");
  const presentation = await parse(file);

  try {
    const html = await presentationToPrintableHtml(presentation);
    return {
      html,
      dispose: () => presentation.dispose?.(),
    };
  } catch (error) {
    presentation.dispose?.();
    throw error;
  }
}

/**
 * Word → PDF otomatis unduh (html2pdf.js)
 */
export async function docxToPdf(file: File): Promise<void> {
  const mammoth = await import("mammoth");
  const html2pdfModule = await import("html2pdf.js");
  const html2pdf = (html2pdfModule as any).default || html2pdfModule;

  const buffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer });

  if (!result.value.trim()) {
    throw new Error("Tidak ada konten yang dapat dikonversi dari file Word.");
  }

  const content = document.createElement("div");
  content.innerHTML = result.value;
  content.style.cssText = [
    "font-family: 'Times New Roman', Times, serif",
    "font-size: 12pt",
    "line-height: 1.5",
    "color: #111",
    "background: #fff",
    "width: 170mm",
    "padding: 0",
  ].join(";");

  // Harus ada di DOM agar html2canvas mengukur dengan benar
  content.style.position = "fixed";
  content.style.left = "-9999px";
  content.style.top = "0";
  document.body.appendChild(content);

  const name = file.name.replace(/\.docx$/i, "") + ".pdf";

  try {
    await html2pdf()
      .set({
        margin: [15, 15, 15, 15],
        filename: name,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      })
      .from(content)
      .save();
  } finally {
    document.body.removeChild(content);
  }
}

/** Buka HTML di window baru → dialog print (Save as PDF) */
export function printHtmlAsPdf(html: string, title = "dokumen"): void {
  const w = window.open("", "_blank");
  if (!w) {
    throw new Error(
      "Popup diblokir browser. Izinkan popup untuk situs ini, lalu coba lagi."
    );
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.document.title = title;
  setTimeout(() => {
    w.focus();
    w.print();
  }, 500);
}
