import { useMemo } from "react";
import { FileText, CheckSquare, Square } from "lucide-react";
import { usePersistentState } from "../lib/storage";

const STRUCTURE = [
  { id: "cover", label: "Cover / Halaman judul" },
  { id: "pengesahan", label: "Lembar pengesahan (jika diminta)" },
  { id: "abstrak", label: "Abstrak / Kata pengantar" },
  { id: "daftar_isi", label: "Daftar isi" },
  { id: "bab1", label: "Bab 1 – Pendahuluan (latar belakang, rumusan, tujuan)" },
  { id: "bab2", label: "Bab 2 – Tinjauan pustaka / Landasan teori" },
  { id: "bab3", label: "Bab 3 – Metodologi / Pembahasan" },
  { id: "bab4", label: "Bab 4 – Hasil & pembahasan (jika ada)" },
  { id: "bab5", label: "Kesimpulan & saran" },
  { id: "daftar_pustaka", label: "Daftar pustaka" },
  { id: "lampiran", label: "Lampiran (opsional)" },
];

export default function Makalah() {
  const [text, setText] = usePersistentState("draft-makalah-text", "");
  const [checked, setChecked] = usePersistentState<Record<string, boolean>>("draft-makalah-checks", {});

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const chars = trimmed.length;
    const charsNoSpace = trimmed.replace(/\s/g, "").length;
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const sentences = trimmed
      ? trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
      : 0;
    const paragraphs = trimmed
      ? trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
      : 0;
    // Estimasi halaman: ~300 kata/halaman (1.5 spasi) atau ~500 (spasi 1)
    const pages15 = words / 300;
    const pages10 = words / 500;
    return { chars, charsNoSpace, words, sentences, paragraphs, pages15, pages10 };
  }, [text]);

  const doneCount = Object.values(checked).filter(Boolean).length;

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="text-sky-500" size={26} />
          Helper Makalah
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Hitung kata & checklist struktur tulisan
        </p>
      </div>

      {/* Word counter */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-medium">Hitung kata / karakter</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste draft makalah atau bab di sini..."
          className="w-full h-40 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm leading-relaxed"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{stats.words.toLocaleString("id-ID")}</p>
            <p className="text-xs text-gray-500">Kata</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{stats.chars.toLocaleString("id-ID")}</p>
            <p className="text-xs text-gray-500">Karakter</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{stats.charsNoSpace.toLocaleString("id-ID")}</p>
            <p className="text-xs text-gray-500">Tanpa spasi</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{stats.sentences}</p>
            <p className="text-xs text-gray-500">Kalimat</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{stats.paragraphs}</p>
            <p className="text-xs text-gray-500">Paragraf</p>
          </div>
          <div className="bg-sky-50 dark:bg-sky-950/40 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-sky-700 dark:text-sky-300">
              ~{stats.pages15.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">Halaman (1.5 spasi)</p>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Estimasi spasi 1: ~{stats.pages10.toFixed(1)} halaman. Angka kasar — sesuaikan font & margin kampus.
        </p>
      </div>

      {/* Structure checklist */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">Checklist struktur</h3>
          <span className="text-xs text-gray-500">
            {doneCount}/{STRUCTURE.length} selesai
          </span>
        </div>
        <div className="space-y-1">
          {STRUCTURE.map((item) => {
            const on = !!checked[item.id];
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {on ? (
                  <CheckSquare className="text-sky-500 shrink-0" size={18} />
                ) : (
                  <Square className="text-gray-300 dark:text-gray-600 shrink-0" size={18} />
                )}
                <span className={on ? "text-gray-400 line-through" : ""}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
