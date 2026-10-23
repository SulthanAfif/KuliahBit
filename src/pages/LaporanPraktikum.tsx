import { useState } from "react";
import { Check, Copy, Download, FlaskConical, RotateCcw } from "lucide-react";
import { usePersistentState } from "../lib/storage";

const SECTIONS = [
  { key: "judul", label: "Judul praktikum", hint: "Tulis judul sesuai topik praktikum." },
  { key: "tujuan", label: "Tujuan", hint: "Tuliskan tujuan atau hal yang ingin dibuktikan." },
  { key: "dasar", label: "Dasar teori", hint: "Ringkas konsep dan teori yang mendasari praktikum." },
  { key: "alat", label: "Alat dan bahan", hint: "Pisahkan alat dan bahan dengan baris baru agar mudah dibaca." },
  { key: "langkah", label: "Langkah kerja", hint: "Tuliskan prosedur secara berurutan; satu langkah per baris." },
  { key: "hasil", label: "Hasil pengamatan dan data", hint: "Masukkan hasil pengamatan, angka, atau data yang diperlukan." },
  { key: "pembahasan", label: "Pembahasan", hint: "Jelaskan makna hasil dan hubungkan dengan teori." },
  { key: "kesimpulan", label: "Kesimpulan", hint: "Jawab tujuan praktikum berdasarkan hasil yang diperoleh." },
  { key: "saran", label: "Saran (opsional)", hint: "Tambahkan saran untuk perbaikan atau praktikum berikutnya." },
] as const;

type Fields = Record<(typeof SECTIONS)[number]["key"], string>;

const empty: Fields = {
  judul: "",
  tujuan: "",
  dasar: "",
  alat: "",
  langkah: "",
  hasil: "",
  pembahasan: "",
  kesimpulan: "",
  saran: "",
};

export default function LaporanPraktikum() {
  const [fields, setFields] = usePersistentState<Fields>("draft-laporan-praktikum", { ...empty });
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const filledSections = SECTIONS.filter((section) => fields[section.key].trim()).length;
  const wordCount = Object.values(fields).join(" ").trim().split(/\s+/).filter(Boolean).length;

  const buildText = () => {
    const lines: string[] = ["LAPORAN PRAKTIKUM", ""];
    SECTIONS.forEach((section) => {
      const value = fields[section.key].trim();
      if (!value && section.key === "saran") return;
      lines.push(section.label.toUpperCase());
      lines.push(value || "(belum diisi)");
      lines.push("");
    });
    return lines.join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildText());
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([buildText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (fields.judul || "tanpa-judul").normalize("NFKD").replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    link.href = url;
    link.download = `laporan-praktikum-${safeTitle || "tanpa-judul"}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleReset = () => {
    if (filledSections === 0 || window.confirm("Kosongkan semua isian laporan ini?")) setFields({ ...empty });
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <FlaskConical className="text-teal-600" size={26} />
          Template Laporan Praktikum
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Isi laporan bertahap. Draft tersimpan otomatis di perangkat ini.
        </p>
      </header>

      <section aria-label="Progres laporan" className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4 dark:border-teal-900/60 dark:bg-teal-950/20">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-teal-900 dark:text-teal-100">Progres laporan</span>
          <span className="text-teal-700 dark:text-teal-300">{filledSections}/{SECTIONS.length} bagian · {wordCount} kata</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-teal-100 dark:bg-teal-900/60">
          <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${(filledSections / SECTIONS.length) * 100}%` }} />
        </div>
      </section>

      <div className="space-y-4">
        {SECTIONS.map((section, index) => (
          <section key={section.key} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
            <label htmlFor={`report-${section.key}`} className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">
              <span className="mr-2 text-xs font-semibold text-teal-600 dark:text-teal-400">{String(index + 1).padStart(2, "0")}</span>
              {section.label}
            </label>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{section.hint}</p>
            {section.key === "judul" ? (
              <input
                id={`report-${section.key}`}
                value={fields[section.key]}
                onChange={(event) => setFields({ ...fields, [section.key]: event.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-950"
                placeholder="Contoh: Pengaruh suhu terhadap laju reaksi"
              />
            ) : (
              <textarea
                id={`report-${section.key}`}
                value={fields[section.key]}
                onChange={(event) => setFields({ ...fields, [section.key]: event.target.value })}
                rows={section.key === "langkah" || section.key === "pembahasan" || section.key === "hasil" ? 5 : 3}
                className="w-full resize-y rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-950"
                placeholder={`Tulis ${section.label.toLowerCase()} di sini...`}
              />
            )}
          </section>
        ))}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
        <button
          type="button"
          onClick={handleCopy}
          disabled={filledSections === 0}
          className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Tersalin" : "Salin laporan"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={filledSections === 0}
          className="flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          <Download size={16} /> Unduh .txt
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={filledSections === 0}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw size={15} /> Reset
        </button>
        {copyError && <p role="status" className="w-full text-xs text-red-600">Tidak dapat menyalin otomatis. Periksa izin clipboard browser.</p>}
      </footer>
    </div>
  );
}
