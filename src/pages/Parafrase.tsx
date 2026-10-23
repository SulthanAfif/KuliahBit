import { useState } from "react";
import { RefreshCw, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { generateAI, hasAIKey } from "../lib/ai";
import { canUseAi, incrementAiUsage } from "../lib/limits";
import { usePlan } from "../context/PlanContext";
import { useNavigate } from "react-router-dom";

export default function Parafrase() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
        setResult(await generateAI("parafrase", text));
      } else {
        await new Promise((r) => setTimeout(r, 500));
        setResult(
          text.trim() +
            "\n\n(Mode demo — aktifkan Groq API untuk parafrase otomatis. Gunakan untuk merapikan kalimat, bukan menyalin karya orang lain.)"
        );
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
          <RefreshCw className="text-indigo-500" size={26} />
          Parafrase Ringan
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Rapikan kalimat biar lebih jelas & formal — bukan untuk plagiat
        </p>
      </div>

      <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
        Gunakan untuk tulisanmu sendiri. Jangan menyalin karya orang lain lalu
        mengandalkan parafrase untuk menghindari deteksi.
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tempel paragraf yang ingin dirapikan..."
        className="w-full h-40 border border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-3 bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <button
        onClick={run}
        disabled={loading || !text.trim()}
        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        Parafrase
      </button>

      {error && (
        <div className="flex gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {result && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(result);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-2 text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Disalin" : "Salin"}
          </button>
        </div>
      )}
    </div>
  );
}
