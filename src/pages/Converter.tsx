import { useState, useRef, useEffect } from "react";
import {
  FileOutput,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  Printer,
  Download,
} from "lucide-react";
import {
  csvToExcel,
  excelToCsv,
  jsonToCsv,
  csvToJson,
  pdfToTxt,
  pdfToDocx,
  docxToHtml,
  docxToPdf,
  docxToHtmlString,
  pptxToPrintableHtml,
  printHtmlAsPdf,
} from "../lib/convert";

type ConvertId =
  | "csv-xlsx"
  | "xlsx-csv"
  | "json-csv"
  | "csv-json"
  | "pdf-txt"
  | "pdf-docx"
  | "docx-html"
  | "docx-pdf"
  | "pptx-pdf";

interface ConvertOption {
  id: ConvertId;
  label: string;
  from: string;
  to: string;
  accept: string;
  desc: string;
  needsPreview?: boolean;
  run?: (file: File) => Promise<void>;
}

const OPTIONS: ConvertOption[] = [
  {
    id: "csv-xlsx",
    label: "CSV → Excel",
    from: "CSV",
    to: "XLSX",
    accept: ".csv,text/csv",
    desc: "Ubah file CSV menjadi Excel (.xlsx)",
    run: csvToExcel,
  },
  {
    id: "xlsx-csv",
    label: "Excel → CSV",
    from: "XLSX",
    to: "CSV",
    accept: ".xlsx,.xls",
    desc: "Ubah Excel menjadi CSV (sheet pertama)",
    run: excelToCsv,
  },
  {
    id: "json-csv",
    label: "JSON → CSV",
    from: "JSON",
    to: "CSV",
    accept: ".json,application/json",
    desc: "Array JSON menjadi tabel CSV",
    run: jsonToCsv,
  },
  {
    id: "csv-json",
    label: "CSV → JSON",
    from: "CSV",
    to: "JSON",
    accept: ".csv,text/csv",
    desc: "CSV menjadi array JSON",
    run: csvToJson,
  },
  {
    id: "pdf-txt",
    label: "PDF → Teks",
    from: "PDF",
    to: "TXT",
    accept: ".pdf,application/pdf",
    desc: "Ekstrak teks dari PDF (bukan scan)",
    run: pdfToTxt,
  },
  {
    id: "pdf-docx",
    label: "PDF → Word",
    from: "PDF",
    to: "DOCX",
    accept: ".pdf,application/pdf",
    desc: "PDF ke Word sederhana (teks saja)",
    run: pdfToDocx,
  },
  {
    id: "pptx-pdf",
    label: "PPTX \u2192 PDF",
    from: "PPTX",
    to: "PDF",
    accept: ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    desc: "Pratinjau presentasi, lalu cetak atau simpan sebagai PDF",
    needsPreview: true,
  },
  {
    id: "docx-html",
    label: "Word → HTML",
    from: "DOCX",
    to: "HTML",
    accept: ".docx",
    desc: "Word menjadi file HTML",
    run: docxToHtml,
  },
  {
    id: "docx-pdf",
    label: "Word → PDF",
    from: "DOCX",
    to: "PDF",
    accept: ".docx",
    desc: "Preview + unduh PDF otomatis, atau cetak Save as PDF",
    needsPreview: true,
  },
];

export default function Converter() {
  const [selected, setSelected] = useState<ConvertId>("docx-pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pptxDisposeRef = useRef<(() => void) | null>(null);

  useEffect(() => () => pptxDisposeRef.current?.(), []);

  const option = OPTIONS.find((o) => o.id === selected)!;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    pptxDisposeRef.current?.();
    pptxDisposeRef.current = null;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setPreviewHtml(null);
    setSourceFile(null);
    setFileName(file.name);

    try {
      if (file.size > 20 * 1024 * 1024) {
        throw new Error("Ukuran file maksimal 20 MB.");
      }

      if (selected === "docx-pdf") {
        const html = await docxToHtmlString(file);
        setPreviewHtml(html);
        setSourceFile(file);
        setSuccess(
          "Preview siap. Pilih “Unduh PDF” (otomatis) atau “Cetak / Save as PDF”."
        );
      } else if (selected === "pptx-pdf") {
        const result = await pptxToPrintableHtml(file);
        pptxDisposeRef.current = result.dispose;
        setPreviewHtml(result.html);
        setSourceFile(file);
        setSuccess("Pratinjau presentasi siap. Pilih cetak, lalu simpan sebagai PDF.");
      } else if (option.run) {
        await option.run(file);
        setSuccess("Berhasil! File hasil konversi sudah terunduh.");
      }
    } catch (err: any) {
      setError(err?.message || "Gagal mengonversi file.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDownloadPdf = async () => {
    if (!sourceFile) return;
    setLoading(true);
    setError(null);
    try {
      await docxToPdf(sourceFile);
      setSuccess("PDF berhasil diunduh.");
    } catch (err: any) {
      setError(err?.message || "Gagal membuat PDF.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPdf = () => {
    if (!previewHtml) return;
    try {
      printHtmlAsPdf(
        previewHtml,
        fileName?.replace(/\.(docx|pptx)$/i, "") || "dokumen"
      );
    } catch (err: any) {
      setError(err?.message || "Gagal membuka dialog cetak. Izinkan popup.");
    }
  };

  const handlePrintIframe = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileOutput className="text-violet-500" size={26} />
          Konverter File
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          CSV, Excel, PDF, Word, PPTX - proses di browser, tanpa server
        </p>
      </div>

      {(selected === "docx-pdf" || selected === "pptx-pdf") && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200">
          {selected === "docx-pdf" ? (
            <><strong>Word to PDF:</strong> lihat preview, lalu unduh PDF langsung atau gunakan dialog cetak browser.</>
          ) : (
            <><strong>PPTX to PDF:</strong> periksa preview, lalu cetak dan pilih Save as PDF di dialog browser.</>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => {
              pptxDisposeRef.current?.();
              pptxDisposeRef.current = null;
              setSelected(o.id);
              setError(null);
              setSuccess(null);
              setFileName(null);
              setPreviewHtml(null);
              setSourceFile(null);
            }}
            className={`p-3 rounded-xl text-left border transition text-sm ${
              selected === o.id
                ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40 ring-1 ring-violet-500"
                : "border-gray-200 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 bg-white dark:bg-gray-900"
            }`}
          >
            <p className="font-semibold text-xs sm:text-sm">{o.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {o.from} → {o.to}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <p className="font-medium mb-1">{option.label}</p>
        <p className="text-sm text-gray-500 mb-4">{option.desc}</p>

        <input
          ref={inputRef}
          type="file"
          accept={option.accept}
          onChange={handleFile}
          className="hidden"
          id="convert-file"
          disabled={loading}
        />
        <label
          htmlFor="convert-file"
          className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition ${
            loading
              ? "opacity-60 pointer-events-none border-gray-200"
              : "border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin text-violet-500" size={32} />
              <span className="text-sm text-gray-500">Memproses...</span>
            </>
          ) : (
            <>
              <Upload className="text-violet-500" size={32} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Klik atau pilih file {option.from}
              </span>
              <span className="text-xs text-gray-400">Maksimal 20 MB</span>
            </>
          )}
        </label>

        {fileName && !loading && (
          <p className="text-xs text-gray-500 mt-3 text-center">📄 {fileName}</p>
        )}
      </div>

      {previewHtml && (selected === "docx-pdf" || selected === "pptx-pdf") && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {selected === "docx-pdf" && <button
              onClick={handleDownloadPdf}
              disabled={loading || !sourceFile}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Unduh PDF
            </button>}
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-2 rounded-xl border border-violet-300 px-5 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950"
            >
              <Printer size={16} />
              {selected === "pptx-pdf" ? "Cetak / Simpan sebagai PDF" : "Cetak / Save as PDF"}
            </button>
            {selected === "docx-pdf" && <button
              onClick={handlePrintIframe}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Printer size={16} /> Cetak dari preview
            </button>}
          </div>
          {selected === "docx-pdf" ? (
            <p className="text-xs text-gray-500">Unduh PDF menyimpan file langsung. Opsi cetak membuka dialog browser.</p>
          ) : (
            <p className="text-xs text-gray-500">Di dialog cetak browser, pilih tujuan <strong>Save as PDF</strong> untuk menyimpan file.</p>
          )}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800">
            <iframe
              ref={iframeRef}
              title={selected === "pptx-pdf" ? "Preview presentasi PowerPoint" : "Preview Word"}
              srcDoc={previewHtml}
              className="h-[480px] w-full bg-white"
              sandbox={selected === "pptx-pdf" ? "allow-same-origin" : "allow-modals allow-same-origin allow-scripts"}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl p-3">
          <CheckCircle size={16} className="shrink-0 mt-0.5" />
          {success}
        </div>
      )}
    </div>
  );
}
