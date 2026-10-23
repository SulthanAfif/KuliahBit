import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "../pdf.worker.ts?worker&url";

// Bundle our own worker so the Promise.withResolvers polyfill is installed in
// the worker realm too (polyfills in main.tsx do not cross worker boundaries).
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/** Extract PDF text locally. Import flows can stop once their text limit is reached. */
export async function extractTextFromPDF(file: File, maxChars = Infinity): Promise<string> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  // A broken PDF or browser worker must not leave the upload spinner running forever.
  let pdf: Awaited<typeof loadingTask.promise>;
  try {
    pdf = await withTimeout(loadingTask.promise, 45_000, "Pembacaan PDF terlalu lama. Coba file PDF lain atau muat ulang halaman.");
  } catch (error) {
    await loadingTask.destroy().catch(() => undefined);
    throw error;
  }
  const pages: string[] = [];
  let totalChars = 0;

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await withTimeout(page.getTextContent(), 15_000, "Pembacaan halaman PDF macet. Coba file PDF lain.");
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
