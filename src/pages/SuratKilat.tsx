import { useState } from "react";
import { Mail, Copy, Check, Download } from "lucide-react";

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


${v.nama || "..."}
${v.nim || ""}`,
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
${v.nama || "..."}`,
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
${v.nama || "..."}
${v.nim || ""}`,
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
${v.nama || "..."}`,
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
${v.nama || "..."}`,
  },
];

export default function SuratKilat() {
  const [tpl, setTpl] = useState<TemplateId>("izin_sakit");
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const current = TEMPLATES.find((t) => t.id === tpl)!;
  const text = current.build(values);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = async () => {
    setDownloading(true);
    setDownloadError(null);

    const content = document.createElement("div");
    content.textContent = text;
    content.style.cssText = [
      "font-family: 'Times New Roman', Times, serif",
      "font-size: 12pt",
      "line-height: 1.5",
      "white-space: pre-wrap",
      "overflow-wrap: anywhere",
      "color: #111",
      "background: #fff",
      "width: 170mm",
      "padding: 0",
      "position: fixed",
      "left: -10000px",
      "top: 0",
    ].join(";");
    document.body.appendChild(content);

    try {
      const module = await import("html2pdf.js");
      const html2pdf = (module as any).default || module;
      await html2pdf()
        .set({
          margin: [15, 20, 15, 20],
          filename: `surat-${tpl}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false,
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(content)
        .save();
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Gagal membuat PDF.");
    } finally {
      content.remove();
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="text-blue-500" size={26} />
          Surat Kilat
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Template surat formal — isi, salin, atau unduh
        </p>
      </div>

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

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{text}</pre>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={copy}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Disalin" : "Salin"}
          </button>
          <button
            onClick={download}
            disabled={downloading}
            className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-sm"
          >
            <Download size={16} /> {downloading ? "Menyiapkan PDF..." : "Unduh PDF"}
          </button>
        </div>
        {downloadError && <p role="alert" className="mt-3 text-sm text-red-600">Gagal mengunduh PDF: {downloadError}</p>}
      </div>
    </div>
  );
}
