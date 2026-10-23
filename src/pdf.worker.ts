// PDF.js runs in a separate worker realm, so browser polyfills from main.tsx
// are not available there. Install them before loading the PDF.js worker.
import "./polyfills";
import "pdfjs-dist/build/pdf.worker.min.mjs";
