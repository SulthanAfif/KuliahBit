import { useRef, useState } from "react";
import { usePersistentState } from "../lib/storage";
import { Mail, Copy, Check, Download, Loader2, AlertCircle } from "lucide-react";
import { FREE_LIMITS, canUseFeature, getFeatureUsageThisMonth, incrementFeatureUsage } from "../lib/limits";
import { usePlan } from "../context/PlanContext";
import { UpgradeCard } from "../components/ProGate";

type TemplateId = "izin_sakit" | "izin_keluarga" | "cuti" | "perpanjangan" | "nilai";

const TEMPLATES: {
  id: TemplateId;
  label: string;
  fields: { key: string; label: string; placeholder: string }[];
  build: (v: Record<string, string>) => string;
}[] = [
  {
    id: "izin_sakit",
    label: "Izin sakit / tidak masuk",
    fields: [
      { key: "nama", label: "Nama", placeholder: "Nama lengkap" },
      { key: "nim", label: "NIM", placeholder: "NIM" },
      { key: "prodi", label: "Program studi", placeholder: "Teknik Informatika" },
      { key: "matkul", label: "Mata kuliah", placeholder: "Basis Data" },
      { key: "dosen", label: "Dosen", placeholder: "Bapak/Ibu ..." },
      { key: "tanggal", label: "Tanggal izin", placeholder: "22 Oktober 2026" },
      { key: "alasan", label: "Alasan singkat", placeholder: "sedang sakit demam" },
    ],
    build: (v) => `Kepada Yth.
Bapak/Ibu ${v.dosen || "Dosen Pengampu"}
Mata Kuliah ${v.matkul || "..."}
di tempat

Dengan hormat,
Saya yang bertanda tangan di bawah ini:

Nama : ${v.nama || "..."}
NIM  : ${v.nim || "..."}
Prodi: ${v.prodi || "..."}

memberitahukan bahwa pada tanggal ${v.tanggal || "..."} saya tidak dapat mengikuti perkuliahan karena ${v.alasan || "berhalangan"}.

Demikian surat ini saya sampaikan. Atas pengertian Bapak/Ibu, saya ucapkan terima kasih.

Hormat saya,

${v.nama || "Nama Anda"}${v.nim ? `\n${v.nim}` : ""}`,
  },
  {
    id: "izin_keluarga",
    label: "Izin keperluan keluarga",
    fields: [
      { key: "nama", label: "Nama", placeholder: "Nama lengkap" },
      { key: "nim", label: "NIM", placeholder: "NIM" },
      { key: "prodi", label: "Prodi", placeholder: "Prodi" },
      { key: "matkul", label: "Mata kuliah", placeholder: "Matkul" },
      { key: "dosen", label: "Dosen", placeholder: "Dosen" },
      { key: "tanggal", label: "Tanggal", placeholder: "Tanggal" },
      { key: "alasan", label: "Keperluan", placeholder: "mengurus keperluan keluarga" },
    ],
    build: (v) => `Kepada Yth.
Bapak/Ibu ${v.dosen || "Dosen"}
Mata Kuliah ${v.matkul || "..."}

Dengan hormat,
Saya ${v.nama || "..."} (NIM ${v.nim || "..."}, ${v.prodi || "..."}) memohon izin tidak mengikuti perkuliahan pada ${v.tanggal || "..."} karena ${v.alasan || "keperluan keluarga"}.

Atas perhatiannya, terima kasih.

Hormat saya,

${v.nama || "Nama Anda"}`,
  },
  {
    id: "cuti",
    label: "Permohonan cuti akademik",
    fields: [
      { key: "nama", label: "Nama", placeholder: "Nama" },
      { key: "nim", label: "NIM", placeholder: "NIM" },
      { key: "prodi", label: "Prodi", placeholder: "Prodi" },
      { key: "semester", label: "Semester cuti", placeholder: "Ganjil 2026/2027" },
      { key: "alasan", label: "Alasan", placeholder: "alasan cuti" },
      { key: "tujuan", label: "Ditujukan ke", placeholder: "Ketua Program Studi ..." },
    ],
    build: (v) => `Kepada Yth.
${v.tujuan || "Ketua Program Studi"}
di tempat

Dengan hormat,
Saya yang bertanda tangan di bawah ini:

Nama : ${v.nama || "..."}
NIM  : ${v.nim || "..."}
Prodi: ${v.prodi || "..."}

mengajukan permohonan cuti akademik pada semester ${v.semester || "..."} dengan alasan: ${v.alasan || "..."}.

Demikian permohonan ini. Atas perhatian dan kebijakannya, saya ucapkan terima kasih.

Hormat saya,

${v.nama || "Nama Anda"}${v.nim ? `\n${v.nim}` : ""}`,
  },
  {
    id: "perpanjangan",
    label: "Perpanjangan pengumpulan tugas",
    fields: [
      { key: "nama", label: "Nama", placeholder: "Nama" },
      { key: "nim", label: "NIM", placeholder: "NIM" },
      { key: "matkul", label: "Mata kuliah", placeholder: "Matkul" },
      { key: "dosen", label: "Dosen", placeholder: "Dosen" },
      { key: "tugas", label: "Nama tugas", placeholder: "Tugas 2 / Makalah" },
      { key: "deadline", label: "Deadline lama", placeholder: "20 Okt 2026" },
      { key: "baru", label: "Mohon perpanjang ke", placeholder: "27 Okt 2026" },
      { key: "alasan", label: "Alasan", placeholder: "kendala teknis / sakit" },
    ],
    build: (v) => `Kepada Yth.
Bapak/Ibu ${v.dosen || "Dosen"}
Mata Kuliah ${v.matkul || "..."}

Dengan hormat,
Saya ${v.nama || "..."} (NIM ${v.nim || "..."}) memohon perpanjangan pengumpulan ${v.tugas || "tugas"} yang semula berdeadline ${v.deadline || "..."} menjadi ${v.baru || "..."}, karena ${v.alasan || "..."}.

Atas pengertian Bapak/Ibu, terima kasih.

Hormat saya,

${v.nama || "Nama Anda"}`,
  },
  {
    id: "nilai",
    label: "Permohonan peninjauan nilai",
    fields: [
      { key: "nama", label: "Nama", placeholder: "Nama" },
      { key: "nim", label: "NIM", placeholder: "NIM" },
      { key: "matkul", label: "Mata kuliah", placeholder: "Matkul" },
      { key: "dosen", label: "Dosen", placeholder: "Dosen" },
      { key: "komponen", label: "Komponen nilai", placeholder: "UTS / Tugas 3" },
      { key: "alasan", label: "Alasan singkat", placeholder: "ingin ada ketidaksesuaian" },
    ],
    build: (v) => `Kepada Yth.
Bapak/Ibu ${v.dosen || "Dosen"}
Mata Kuliah ${v.matkul || "..."}

Dengan hormat,
Saya ${v.nama || "..."} (NIM ${v.nim || "..."}) memohon kesediaan Bapak/Ibu untuk meninjau kembali nilai ${v.komponen || "..."}. ${v.alasan || ""}

Saya siap melengkapi dokumen jika diperlukan. Terima kasih.

Hormat saya,

${v.nama || "Nama Anda"}`,
  },
];

export default function SuratKilat() {
  const { isPro } = usePlan();
  const [, setUsageRefresh] = useState(0);
  const [tpl, setTpl] = usePersistentState<TemplateId>("draft-surat-template", "izin_sakit");
  const [values, setValues] = usePersistentState<Record<string, string>>("draft-surat-values", {});
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const current = TEMPLATES.find((t) => t.id === tpl)!;
  const text = current.build(values);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPdf = async () => {
    if (!canUseFeature(isPro, "pdfExports")) return;
    if (!previewRef.current) return;
    setDownloading(true);
    setError("");
    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = (html2pdfModule as any).default || html2pdfModule;
      await html2pdf()
        .set({
          margin: 0,
          filename: `surat-${tpl}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(previewRef.current)
        .save();
      if (!isPro) {
        incrementFeatureUsage("pdfExports");
        setUsageRefresh((value) => value + 1);
      }
    } catch (e) {
      setError(e instanceof Error ? `PDF gagal dibuat: ${e.message}` : "PDF gagal dibuat.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="text-blue-500" size={26} />
          Surat Kilat
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Isi surat formal, lihat pratinjau A4, lalu unduh sebagai PDF
        </p>
      </div>

      {!isPro && <p className="text-xs text-gray-500">Unduh PDF bulan ini: {getFeatureUsageThisMonth("pdfExports")}/{FREE_LIMITS.pdfExports}</p>}
      {!isPro && !canUseFeature(isPro, "pdfExports") && <UpgradeCard title="Kuota unduh PDF habis" description={`Paket Free mendapat ${FREE_LIMITS.pdfExports} unduhan PDF per bulan untuk semua fitur. Pro = unlimited.`} />}

      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTpl(t.id);
              setValues({});
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tpl === t.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
        {current.fields.map((f) => (
          <div key={f.key}>
            <label className="text-xs text-gray-500">{f.label}</label>
            <input
              value={values[f.key] || ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-gray-100 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-6">
        <div className="mx-auto mb-3 flex max-w-[794px] items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Pratinjau PDF · A4</h2>
          <span className="text-xs text-gray-500">Tampilan sesuai file unduhan</span>
        </div>
        <div ref={previewRef} className="mx-auto min-h-[700px] w-full max-w-[794px] bg-white px-5 py-7 text-gray-900 shadow-lg sm:min-h-[1123px] sm:px-[76px] sm:py-[72px]">
          <pre className="whitespace-pre-wrap break-words font-serif text-xs leading-[1.8] sm:text-[13px] sm:leading-[1.9]">{text}</pre>
        </div>
        <div className="mx-auto mt-4 flex max-w-[794px] flex-wrap gap-2">
          <button
            onClick={copy}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Disalin" : "Salin"}
          </button>
          <button
            onClick={() => void downloadPdf()}
            disabled={downloading || !canUseFeature(isPro, "pdfExports")}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {downloading ? "Membuat PDF..." : "Unduh PDF"}
          </button>
        </div>
        {error && <p role="alert" className="mx-auto mt-3 flex max-w-[794px] items-center gap-2 text-sm text-red-600"><AlertCircle size={16} />{error}</p>}
      </section>
    </div>
  );
}
