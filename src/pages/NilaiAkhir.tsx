import { useState, useMemo } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";

interface Component {
  id: string;
  name: string;
  weight: number;
  score: number;
}

export default function NilaiAkhir() {
  const [items, setItems] = useState<Component[]>([
    { id: "1", name: "Tugas", weight: 30, score: 85 },
    { id: "2", name: "UTS", weight: 30, score: 78 },
    { id: "3", name: "UAS", weight: 40, score: 0 },
  ]);
  const [target, setTarget] = useState(70);
  const [focusId, setFocusId] = useState("3"); // komponen yang dihitung minimalnya

  const totalWeight = items.reduce((a, i) => a + i.weight, 0);
  const current = useMemo(() => {
    if (totalWeight <= 0) return 0;
    return items.reduce((a, i) => a + (i.score * i.weight) / totalWeight, 0);
  }, [items, totalWeight]);

  const need = useMemo(() => {
    const focus = items.find((i) => i.id === focusId);
    if (!focus || focus.weight <= 0 || totalWeight <= 0) return null;
    const others = items
      .filter((i) => i.id !== focusId)
      .reduce((a, i) => a + (i.score * i.weight) / totalWeight, 0);
    // target = others + (score * weight / totalWeight)
    // score = (target - others) * totalWeight / weight
    const n = ((target - others) * totalWeight) / focus.weight;
    return n;
  }, [items, focusId, target, totalWeight]);

  const add = () => {
    setItems([
      ...items,
      { id: String(Date.now()), name: "Komponen baru", weight: 10, score: 0 },
    ]);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="text-cyan-500" size={26} />
          Kalkulator Nilai Akhir
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Bobot tugas, UTS, UAS — lihat nilai sekarang & skor minimal
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4">
              <label className="text-[10px] text-gray-400">Nama</label>
              <input
                value={item.name}
                onChange={(e) =>
                  setItems(items.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)))
                }
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-transparent"
              />
            </div>
            <div className="col-span-3">
              <label className="text-[10px] text-gray-400">Bobot %</label>
              <input
                type="number"
                value={item.weight}
                onChange={(e) =>
                  setItems(
                    items.map((x) =>
                      x.id === item.id ? { ...x, weight: Number(e.target.value) } : x
                    )
                  )
                }
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-transparent"
              />
            </div>
            <div className="col-span-3">
              <label className="text-[10px] text-gray-400">Nilai</label>
              <input
                type="number"
                value={item.score}
                onChange={(e) =>
                  setItems(
                    items.map((x) =>
                      x.id === item.id ? { ...x, score: Number(e.target.value) } : x
                    )
                  )
                }
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-transparent"
              />
            </div>
            <div className="col-span-2 flex justify-end pb-1">
              <button
                onClick={() => setItems(items.filter((x) => x.id !== item.id))}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        <button onClick={add} className="text-sm text-cyan-600 flex items-center gap-1">
          <Plus size={14} /> Tambah komponen
        </button>
        <p className="text-xs text-gray-400">Total bobot: {totalWeight}%</p>
      </div>

      <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-2xl p-6 text-center">
        <p className="text-sm text-gray-500">Nilai akhir saat ini</p>
        <p className="text-4xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
          {current.toFixed(1)}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
        <p className="text-sm font-medium">Butuh berapa di komponen tertentu?</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Target nilai akhir</label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full mt-1 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Hitung untuk</label>
            <select
              value={focusId}
              onChange={(e) => setFocusId(e.target.value)}
              className="w-full mt-1 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-transparent"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {need !== null && (
          <p className="text-sm">
            {need <= 0 ? (
              <span className="text-green-600 font-medium">Sudah aman — target tercapai tanpa skor tinggi.</span>
            ) : need > 100 ? (
              <span className="text-red-600 font-medium">
                Butuh {need.toFixed(1)} (di atas 100) — target sulit dicapai.
              </span>
            ) : (
              <span>
                Minimal di <strong>{items.find((i) => i.id === focusId)?.name}</strong>:{" "}
                <strong className="text-cyan-600 text-lg">{need.toFixed(1)}</strong>
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
