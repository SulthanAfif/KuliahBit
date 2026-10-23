import { useMemo } from "react";
import { FileCheck, CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { usePersistentState } from "../lib/storage";

const STRUCTURE_CHECKS = [
  { id: "judul", label: "Ada judul / cover", test: (t: string) => /judul|cover|makalah|laporan/i.test(t.slice(0, 500)) || t.length > 100 },
  { id: "pendahuluan", label: "Ada pendahuluan / latar belakang", test: (t: string) => /pendahuluan|latar belakang|introduction/i.test(t) },
  { id: "isi", label: "Ada pembahasan / isi", test: (t: string) => /pembahasan|hasil|analisis|metode|bab/i.test(t) || t.split(/\s+/).length > 200 },
  { id: "kesimpulan", label: "Ada kesimpulan", test: (t: string) => /kesimpulan|conclusion|penutup/i.test(t) },
  { id: "pustaka", label: "Ada daftar pustaka / referensi", test: (t: string) => /daftar pustaka|referensi|bibliography|references/i.test(t) },
];

function countCitations(text: string) {
  const apa = (text.match(/\([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\-\s]+,\s*\d{4}\)/g) || []).length;
  const numeric = (text.match(/\[\d+\]/g) || []).length;
  const ibid = (text.match(/\b(ibid|op\.?\s*cit|loc\.?\s*cit)\b/gi) || []).length;
  return { apa, numeric, ibid, total: apa + numeric };
}

function findUrlWithoutCite(text: string) {
  const urls = text.match(/https?:\/\/[^\s)]+/g) || [];
  return urls.length;
}

export default function FormatTugas() {
  const [text, setText] = usePersistentState("draft-format-tugas", "");

  const report = useMemo(() => {
    if (!text.trim()) return null;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const structure = STRUCTURE_CHECKS.map((c) => ({
      ...c,
      ok: c.test(text),
    }));
    const cites = countCitations(text);
    const urls = findUrlWithoutCite(text);
    const hasPustaka = /daftar pustaka|referensi|bibliography/i.test(text);
    tips: [] as string[];
    const tips: string[] = [];
    if (cites.total === 0) tips.push("Belum terdeteksi sitasi (APA: Nama, Tahun) atau [1]. Tambahkan jika memakai sumber.");
    if (urls > 0 && cites.total === 0)
      tips.push(`Ada ${urls} URL — pastikan ikut ditulis di daftar pustaka, bukan hanya link mentah.`);
    if (!hasPustaka) tips.push("Bagian daftar pustaka belum terdeteksi.");
    if (words < 300) tips.push("Teks masih pendek; cek minimal halaman dari dosen.");
    if (structure.filter((s) => s.ok).length < 3)
      tips.push("Struktur laporan belum lengkap — lengkapi bagian yang merah.");

    return { words, structure, cites, urls, tips };
  }, [text]);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileCheck className="text-teal-500" size={26} />
          Pengecek Format Tugas
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Cek struktur, sitasi, dan daftar pustaka sebelum dikumpul
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste draft makalah / laporan di sini..."
        className="w-full h-52 border border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-3 bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      {report && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Kata" value={String(report.words)} />
            <Stat label="Sitasi terdeteksi" value={String(report.cites.total)} />
            <Stat label="URL" value={String(report.urls)} />
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
            <h3 className="font-medium text-sm mb-3">Struktur</h3>
            <ul className="space-y-2">
              {report.structure.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  {s.ok ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <Circle size={16} className="text-gray-300" />
                  )}
                  <span className={s.ok ? "" : "text-gray-400"}>{s.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm text-sm space-y-1">
            <p>
              Sitasi gaya nama-tahun (APA-like): <strong>{report.cites.apa}</strong>
            </p>
            <p>
              Sitasi numerik [1]: <strong>{report.cites.numeric}</strong>
            </p>
          </div>

          {report.tips.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 space-y-2">
              {report.tips.map((tip, i) => (
                <p key={i} className="text-sm text-amber-800 dark:text-amber-200 flex gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {tip}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
