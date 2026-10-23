import { useState } from "react";
import { usePersistentState } from "../lib/storage";
import { Zap, Loader2, AlertCircle } from "lucide-react";
import { generateCram, hasAIKey } from "../lib/ai";
import { canUseAi, incrementAiUsage, aiRemaining, FREE_LIMITS } from "../lib/limits";
import { usePlan } from "../context/PlanContext";
import { UpgradeCard } from "../components/ProGate";
import { Link, useNavigate } from "react-router-dom";

export default function Cram() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [text, setText] = usePersistentState("draft-cram-text", "");
  const [minutes, setMinutes] = usePersistentState("draft-cram-minutes", 120);
  const [result, setResult] = usePersistentState("draft-cram-result", "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aiReady = hasAIKey();

  const run = async () => {
    if (!text.trim()) return;
    if (!canUseAi(isPro)) {
      navigate("/pricing");
      return;
    }
    setLoading(true);
    setError(null);
    setResult("");
    try {
      if (aiReady) {
        setResult(await generateCram(text, minutes));
      } else {
        await new Promise((r) => setTimeout(r, 800));
        const blocks = Math.max(3, Math.floor(minutes / 30));
        const slice = Math.floor(minutes / blocks);
        let out = `🔥 Mode Cram (demo — aktifkan Groq API untuk hasil dari materi)\nWaktu total: ${minutes} menit\n\n`;
        for (let i = 0; i < blocks; i++) {
          out += `${i + 1}. ${slice} menit – Fokus: bagian ${i + 1} materi\n   Poin wajib: baca & tandai yang belum paham\n`;
        }
        out += `\n⚠️ Jangan lewatkan: konsep inti, rumus/definisi, contoh soal\n✅ Cek cepat: Bisakah jelaskan topik utama? Sebut 3 poin penting?`;
        setResult(out);
      }
      if (!isPro) incrementAiUsage();
    } catch (e: any) {
      setError(e.message === "NO_API_KEY" ? "API key belum diset." : e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="text-yellow-500" size={26} />
          Mode Cram
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ujian deket — susun rencana belajar dari materi / PDF text
        </p>
      </div>

      {!isPro && !canUseAi(isPro) && (
        <UpgradeCard title="Kuota AI bulan ini habis" description={`Paket Free: ${FREE_LIMITS.aiPerMonth} generate/bulan. Pro = unlimited.`} />
      )}
      {!isPro && canUseAi(isPro) && (
        <p className="text-xs text-gray-500">Sisa AI free bulan ini: {aiRemaining(isPro)}× · <Link to="/pricing" className="text-amber-600 hover:underline">Upgrade Pro</Link></p>
      )}
      {!aiReady && (
        <div className="text-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-blue-800 dark:text-blue-200">
          Mode demo aktif. Untuk rencana dari materi asli, set{" "}
          <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">VITE_GROQ_API_KEY</code> — lihat{" "}
          <Link to="/settings" className="underline">
            Pengaturan / README
          </Link>
          .
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-500">Waktu:</span>
        {[60, 120, 180, 240].map((m) => (
          <button
            key={m}
            onClick={() => setMinutes(m)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              minutes === m
                ? "bg-yellow-500 text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            {m} mnt
          </button>
        ))}
        <input
          type="number"
          min={15}
          max={600}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="w-20 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-transparent"
        />
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste materi / ringkasan / teks dari PDF di sini..."
        className="w-full h-48 border border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-3 bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
      />

      <button
        onClick={run}
        disabled={loading || !text.trim()}
        className="flex items-center gap-2 bg-yellow-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
        Buat rencana cram
      </button>

      {error && (
        <div className="flex gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {result && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 whitespace-pre-wrap text-sm leading-relaxed shadow-sm">
          {result}
        </div>
      )}
    </div>
  );
}
