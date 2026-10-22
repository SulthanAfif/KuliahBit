import { useState, useEffect } from "react";
import { CheckCircle2, Circle, BookOpen } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import type { SkripsiProgress } from "../types";

const defaultBabs: SkripsiProgress[] = [
  { bab: "Bab 1 - Pendahuluan", status: "not_started" },
  { bab: "Bab 2 - Tinjauan Pustaka", status: "not_started" },
  { bab: "Bab 3 - Metodologi", status: "not_started" },
  { bab: "Bab 4 - Hasil & Pembahasan", status: "not_started" },
  { bab: "Bab 5 - Kesimpulan & Saran", status: "not_started" },
  { bab: "Daftar Pustaka", status: "not_started" },
  { bab: "Lampiran", status: "not_started" },
];

export default function Skripsi() {
  const [progress, setProgress] = useState<SkripsiProgress[]>([]);
  const [judul, setJudul] = useState("");

  useEffect(() => {
    const saved = getFromStorage<SkripsiProgress[]>("skripsi-progress", []);
    setProgress(saved.length ? saved : defaultBabs);
    setJudul(getFromStorage("skripsi-judul", ""));
  }, []);

  useEffect(() => {
    if (progress.length) saveToStorage("skripsi-progress", progress);
  }, [progress]);

  useEffect(() => {
    saveToStorage("skripsi-judul", judul);
  }, [judul]);

  const cycleStatus = (index: number) => {
    setProgress((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const next =
          p.status === "not_started"
            ? "in_progress"
            : p.status === "in_progress"
            ? "done"
            : "not_started";
        return { ...p, status: next };
      })
    );
  };

  const doneCount = progress.filter((p) => p.status === "done").length;
  const pct = progress.length ? Math.round((doneCount / progress.length) * 100) : 0;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="text-orange-500" /> Tracker Skripsi
        </h1>
        <p className="text-sm text-gray-500 mt-1">Pantau progress bab per bab</p>
      </div>

      <input
        value={judul}
        onChange={(e) => setJudul(e.target.value)}
        placeholder="Judul skripsi / proposal..."
        className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium">{pct}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {progress.map((p, i) => (
          <button
            key={p.bab}
            onClick={() => cycleStatus(i)}
            className="w-full flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-left hover:border-orange-300 dark:hover:border-orange-700 transition"
          >
            {p.status === "done" ? (
              <CheckCircle2 className="text-green-500 shrink-0" size={22} />
            ) : p.status === "in_progress" ? (
              <div className="w-[22px] h-[22px] rounded-full border-2 border-orange-500 border-t-transparent animate-spin shrink-0" />
            ) : (
              <Circle className="text-gray-300 dark:text-gray-600 shrink-0" size={22} />
            )}
            <div className="flex-1">
              <p className={`font-medium ${p.status === "done" ? "text-gray-400 line-through" : ""}`}>
                {p.bab}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">
                {p.status === "not_started" ? "Belum mulai" : p.status === "in_progress" ? "Sedang dikerjakan" : "Selesai"}
              </p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Klik setiap bab untuk mengubah status: Belum → Proses → Selesai
      </p>
    </div>
  );
}
