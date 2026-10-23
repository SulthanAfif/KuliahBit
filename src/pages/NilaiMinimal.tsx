import { useMemo } from "react";
import { usePersistentState } from "../lib/storage";
import { Calculator } from "lucide-react";

export default function NilaiMinimal() {
  const [target, setTarget] = usePersistentState("draft-nilai-minimal-target", 70);
  const [uts, setUts] = usePersistentState("draft-nilai-minimal-uts", 80);
  const [tugas, setTugas] = usePersistentState("draft-nilai-minimal-tugas", 85);
  const [wUts, setWUts] = usePersistentState("draft-nilai-minimal-w-uts", 30);
  const [wTugas, setWTugas] = usePersistentState("draft-nilai-minimal-w-tugas", 30);
  const [wUas, setWUas] = usePersistentState("draft-nilai-minimal-w-uas", 40);

  const result = useMemo(() => {
    const totalW = wUts + wTugas + wUas;
    if (totalW <= 0) return null;
    // target = (uts*wUts + tugas*wTugas + uas*wUas) / totalW
    // uas = (target * totalW - uts*wUts - tugas*wTugas) / wUas
    if (wUas <= 0) return null;
    const need = (target * totalW - uts * wUts - tugas * wTugas) / wUas;
    return {
      need,
      totalW,
      possible: need <= 100,
      already: need <= 0,
    };
  }, [target, uts, tugas, wUts, wTugas, wUas]);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="text-cyan-500" size={26} />
          Nilai Minimal UAS
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Hitung berapa nilai UAS yang dibutuhkan untuk mencapai target
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <Field label="Target nilai akhir" value={target} set={setTarget} />
        <Field label="Nilai UTS" value={uts} set={setUts} />
        <Field label="Nilai tugas / rata-rata" value={tugas} set={setTugas} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Bobot UTS %" value={wUts} set={setWUts} />
          <Field label="Bobot tugas %" value={wTugas} set={setWTugas} />
          <Field label="Bobot UAS %" value={wUas} set={setWUas} />
        </div>
      </div>

      {result && (
        <div
          className={`rounded-2xl p-6 text-center border ${
            result.already
              ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
              : result.possible
              ? "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800"
              : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
          }`}
        >
          {result.already ? (
            <>
              <p className="text-sm text-gray-500">Sudah aman</p>
              <p className="text-3xl font-bold text-green-600 mt-1">Tidak perlu UAS tinggi</p>
              <p className="text-sm mt-2 text-gray-500">
                Nilai sekarang sudah mencapai / melebihi target meski UAS 0.
              </p>
            </>
          ) : result.possible ? (
            <>
              <p className="text-sm text-gray-500">Nilai UAS minimal</p>
              <p className="text-4xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                {result.need.toFixed(1)}
              </p>
              <p className="text-sm mt-2 text-gray-500">
                Dapatkan minimal skor ini di UAS agar nilai akhir ≥ {target}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">Sulit dicapai</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                Butuh {result.need.toFixed(1)}
              </p>
              <p className="text-sm mt-2 text-gray-500">
                Melebihi 100 — target terlalu tinggi untuk bobot saat ini.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  set,
}: {
  label: string;
  value: number;
  set: (n: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
    </div>
  );
}
