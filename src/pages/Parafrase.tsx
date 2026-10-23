import { useState } from "react";
import { RefreshCw, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { generateParafrase, hasAIKey, type ParafraseStyle } from "../lib/ai";
import { canUseAi, incrementAiUsage } from "../lib/limits";
import { usePlan } from "../context/PlanContext";
import { useNavigate } from "react-router-dom";
import { usePersistentState } from "../lib/storage";

const STYLES: { id: ParafraseStyle; label: string; desc: string }[] = [
  {
    id: "natural",
    label: "Lebih natural",
    desc: "Kurangi frasa klise, kalimat lebih hidup",
  },
  {
    id: "kasual",
    label: "Kasual kuliah",
    desc: "Seperti jelasin ke teman, tetap sopan",
  },
  {
    id: "formal",
    label: "Formal",
    desc: "Cocok laporan / makalah",
  },
];

export default function Parafrase() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [text, setText] = usePersistentState("draft-parafrase-text", "");
  const [result, setResult] = usePersistentState("draft-parafrase-result", "");
  const [style, setStyle] = usePersistentState<ParafraseStyle>(
    "draft-parafrase-style",
    "natural"
  );
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
        setResult(await generateParafrase(text, style));
      } else {
        await new Promise((r) => setTimeout(r, 500));
        setResult(
          text.trim() +
            "\n\n(Mode demo — set VITE_GROQ_API_KEY untuk parafrase bergaya " +
            style +
            ". Untuk merapikan tulisanmu sendiri, bukan menyalin karya orang lain.)"
        );
      }
      if (!isPro) incrementAiUsage();
    } catch (e: any) {
      setError(e.message === "NO_API_KEY" ? "API key belum diset." : e.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <RefreshCw className="text-indigo-500" size={26} />
          Parafrase
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Rapikan tulisanmu — pilih gaya natural, kasual, atau formal
        </p>
      </div>

      <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
        Untuk merapikan kalimat <strong>milikmu</strong>. Bukan untuk menyalin
        karya orang lain atau mengklaim lolos deteksi AI/plagiasi.
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Gaya tulisan</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={`text-left rounded-xl border px-4 py-3 transition ${
                style === s.id
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-500"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <p className="text-sm font-semibold">{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>
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
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <RefreshCw size={16} />
        )}
        Parafrase ({STYLES.find((s) => s.id === style)?.label})
      </button>

      {error && (
        <div className="flex gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Hasil</p>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Tersalin" : "Salin"}
            </button>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-sm whitespace-pre-wrap leading-relaxed">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
