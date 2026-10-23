import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Ship the worker with the app so mobile users do not depend on a third-party CDN.
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/** Extract PDF text locally. Import flows can stop once their text limit is reached. */
export async function extractTextFromPDF(file: File, maxChars = Infinity): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];
  let totalChars = 0;

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ");
      const separator = pages.length ? "\n\n" : "";
      const remaining = maxChars - totalChars - separator.length;
      pages.push(remaining < text.length ? text.slice(0, Math.max(0, remaining)) : text);
      totalChars += separator.length + text.length;
      page.cleanup();
      if (totalChars > maxChars) break;
      // Let mobile browsers paint and process input during long documents.
      if (i % 2 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    await pdf.destroy();
  }

  return pages.join("\n\n").trim();
}
