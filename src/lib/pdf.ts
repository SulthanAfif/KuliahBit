import * as pdfjs from "pdfjs-dist";

// Worker dari CDN — paling stabil di Vite
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/** Extract text from a PDF File (client-side). */
export async function extractTextFromPDF(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n\n").trim();
}
