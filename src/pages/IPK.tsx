import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Calculator } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import { v4 as uuid } from "uuid";

interface GradeItem {
  id: string;
  name: string;
  sks: number;
  grade: string; // A, A-, B+, ... atau angka 4.0
}

const GRADE_MAP: Record<string, number> = {
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  D: 1.0,
  E: 0.0,
};

const GRADE_OPTIONS = Object.keys(GRADE_MAP);

export default function IPK() {
  const [items, setItems] = useState<GradeItem[]>([]);
  const [name, setName] = useState("");
  const [sks, setSks] = useState(3);
  const [grade, setGrade] = useState("A");
  const [targetIPK, setTargetIPK] = useState(3.5);
  const [remainingSKS, setRemainingSKS] = useState(20);

  useEffect(() => {
    setItems(getFromStorage("ipk-items", []));
  }, []);

  useEffect(() => {
    saveToStorage("ipk-items", items);
  }, [items]);

  const { totalSKS, totalBobot, ipk } = useMemo(() => {
    let totalSKS = 0;
    let totalBobot = 0;
    for (const item of items) {
      const nilai = GRADE_MAP[item.grade] ?? 0;
      totalSKS += item.sks;
      totalBobot += nilai * item.sks;
    }
    const ipk = totalSKS > 0 ? totalBobot / totalSKS : 0;
    return { totalSKS, totalBobot, ipk };
  }, [items]);

  // Prediksi: berapa rata-rata nilai yang dibutuhkan di sisa SKS untuk reach target
  const neededAvg = useMemo(() => {
    if (remainingSKS <= 0) return null;
    const neededBobot = targetIPK * (totalSKS + remainingSKS) - totalBobot;
    const avg = neededBobot / remainingSKS;
    return Math.max(0, Math.min(4, avg));
  }, [ipk, totalSKS, totalBobot, targetIPK, remainingSKS]);

  const handleAdd = () => {
    if (!name.trim() || sks < 1) return;
    setItems([
      {
        id: uuid(),
        name: name.trim(),
        sks,
        grade,
      },
      ...items,
    ]);
    setName("");
    setSks(3);
    setGrade("A");
  };

  const handleDelete = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const ipkColor =
    ipk >= 3.5
      ? "text-green-600 dark:text-green-400"
      : ipk >= 3.0
      ? "text-blue-600 dark:text-blue-400"
      : ipk >= 2.5
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="text-blue-500" size={26} />
          Kalkulator IPK
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Hitung IPK semester / kumulatif + prediksi target
        </p>
      </div>

      {/* Hasil IPK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-sm text-gray-500">IPK Saat Ini</p>
          <p className={`text-4xl font-bold mt-1 ${ipkColor}`}>
            {ipk.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-sm text-gray-500">Total SKS</p>
          <p className="text-4xl font-bold mt-1">{totalSKS}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-sm text-gray-500">Total Bobot</p>
          <p className="text-4xl font-bold mt-1">{totalBobot.toFixed(1)}</p>
        </div>
      </div>

      {/* Form tambah */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <h3 className="font-medium">Tambah Mata Kuliah</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama matkul"
            className="sm:col-span-2 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <input
            type="number"
            min={1}
            max={6}
            value={sks}
            onChange={(e) => setSks(Number(e.target.value))}
            className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="SKS"
          />
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g} ({GRADE_MAP[g]})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      {/* Daftar matkul */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">
            Belum ada mata kuliah. Tambahkan di atas.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.sks} SKS · Nilai {item.grade} ({GRADE_MAP[item.grade]})
                </p>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-gray-400 hover:text-red-500 shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Prediksi target */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900 rounded-2xl p-5 space-y-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-100">
          Prediksi Target IPK
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Target IPK</label>
            <input
              type="number"
              step="0.01"
              min={0}
              max={4}
              value={targetIPK}
              onChange={(e) => setTargetIPK(Number(e.target.value))}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sisa SKS</label>
            <input
              type="number"
              min={0}
              value={remainingSKS}
              onChange={(e) => setRemainingSKS(Number(e.target.value))}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
        {neededAvg !== null && (
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Untuk mencapai IPK <strong>{targetIPK.toFixed(2)}</strong>, rata-rata nilai di{" "}
            <strong>{remainingSKS} SKS</strong> berikutnya harus sekitar{" "}
            <strong className="text-lg">{neededAvg.toFixed(2)}</strong>
            {neededAvg > 4
              ? " (mustahil — target terlalu tinggi)"
              : neededAvg >= 3.7
              ? " (perlu hampir sempurna)"
              : neededAvg >= 3.0
              ? " (cukup realistis)"
              : " (relatif mudah)"}
          </p>
        )}
      </div>
    </div>
  );
}
