import { Fragment, useState, useRef } from "react";
import {
  Sparkles,
  Lock,
  Crown,
  Loader2,
  Save,
  AlertCircle,
  FileUp,
} from "lucide-react";
import { usePlan } from "../context/PlanContext";
import { Link, useNavigate } from "react-router-dom";
import { getFromStorage, saveToStorage, usePersistentState } from "../lib/storage";
import { generateAI, hasAIKey, parseFlashcards, type AIMode } from "../lib/ai";
import { FREE_LIMITS, PRO_LIMITS, getAiUsageThisMonth, incrementAiUsage, canUseFeature, incrementFeatureUsage, getFeatureUsageThisMonth, canUploadPdf, clipPdfText } from "../lib/limits";
import { extractTextFromPDF } from "../lib/pdf";
import type { FlashcardSet } from "../types";
import { v4 as uuid } from "uuid";

function renderInlineMarkdown(line: string) {
  return line.split(/(\*\*.+?\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

export default function Ringkas() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [text, setText] = usePersistentState("draft-ringkas-text", "");
  const [result, setResult] = usePersistentState("draft-ringkas-result", "");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AIMode>("ringkas");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const aiUsage = getAiUsageThisMonth();
  const freeLimit = FREE_LIMITS.aiPerMonth;
  const canUse = isPro || aiUsage < freeLimit;
  const aiReady = hasAIKey();

  const handlePDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!canUseFeature(isPro, "pdfUploadsPerMonth")) {
      navigate("/pricing");
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Hanya file PDF yang didukung.");
      return;
    }
    if (!canUploadPdf(isPro, file.size)) {
      if (!isPro) {
        navigate("/pricing");
        return;
      }
      setError(`Ukuran PDF maksimal ${isPro ? PRO_LIMITS.pdfMaxMb : FREE_LIMITS.pdfMaxMb} MB.`);
      return;
    }

    setPdfLoading(true);
    setError(null);
    setPdfName(null);

    try {
      const extracted = await extractTextFromPDF(file, (isPro ? PRO_LIMITS.pdfMaxChars : FREE_LIMITS.pdfMaxChars) + 1);
      if (!extracted || extracted.length < 20) {
        setError(
          "Tidak ada teks yang bisa diekstrak. PDF mungkin hasil scan (gambar). Coba PDF berbasis teks."
        );
        return;
      }
      // Limit text length for free users a bit
      const limited = clipPdfText(isPro, extracted);
      setText(limited.text);
      setPdfName(file.name);
      if (!isPro) incrementFeatureUsage("pdfUploadsPerMonth");
      if (limited.clipped) {
        setError(
          `Teks PDF dipotong ke ${(isPro ? PRO_LIMITS.pdfMaxChars : FREE_LIMITS.pdfMaxChars).toLocaleString("id-ID")} karakter sesuai batas paket.`
        );
      }
    } catch (err: any) {
      setError("Gagal membaca PDF: " + (err.message || "unknown"));
    } finally {
      setPdfLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    if (!canUse) {
      navigate("/pricing");
      return;
    }

    setLoading(true);
    setError(null);
    setResult("");
    setSavedMsg(null);

    try {
      if (aiReady) {
        const output = await generateAI(mode, text);
        setResult(output);
      } else {
        await new Promise((r) => setTimeout(r, 1000));
        if (mode === "ringkas") {
          const sentences = text
            .split(/[.!?]+/)
            .filter((s) => s.trim().length > 20)
            .slice(0, 5);
          setResult(
            "📌 Ringkasan (mode demo — tambahkan VITE_GROQ_API_KEY untuk AI real):\n\n" +
              (sentences.length
                ? sentences.map((s, i) => `${i + 1}. ${s.trim()}.`).join("\n\n")
                : text.slice(0, 300) + "...")
          );
        } else if (mode === "flashcard") {
          setResult(
            "DEAPAN: Apa topik utama teks di atas?\nBELAKANG: (isi dari materi)\n\nDEAPAN: Sebutkan satu poin penting\nBELAKANG: (dari materi)\n\n(Mode demo — tambahkan API key Groq untuk hasil akurat)"
          );
        } else {
          setResult(
            "1. Apa topik utama teks?\nA. ...\nB. ...\nC. ...\nD. ...\nJawaban: A\n\n(Mode demo — tambahkan API key Groq untuk soal real)"
          );
        }
      }

      if (!isPro) incrementAiUsage();
    } catch (e: any) {
      if (e.message === "NO_API_KEY") {
        setError("API key Groq belum diset. Lihat README untuk cara setup.");
      } else {
        setError(e.message || "Gagal memanggil AI. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFlashcards = () => {
    if (mode !== "flashcard" || !result) return;
    const cards = parseFlashcards(result);
    if (cards.length === 0) {
      setError("Tidak bisa parse flashcard. Coba generate ulang.");
      return;
    }
    if (!canUseFeature(isPro, "flashcardSets") || (!isPro && getFeatureUsageThisMonth("flashcardCardsTotal") + cards.length > FREE_LIMITS.flashcardCardsTotal)) {
      navigate("/pricing");
      return;
    }
    const sets = getFromStorage<FlashcardSet[]>("flashcard-sets", []);
    const newSet: FlashcardSet = {
      id: uuid(),
      title: `AI Generate ${new Date().toLocaleDateString("id-ID")}`,
      cards: cards.map((c) => ({ id: uuid(), front: c.front, back: c.back })),
      createdAt: new Date().toISOString(),
    };
    saveToStorage("flashcard-sets", [newSet, ...sets]);
    if (!isPro) {
      incrementFeatureUsage("flashcardSets");
      for (let i = 0; i < cards.length; i++) incrementFeatureUsage("flashcardCardsTotal");
    }
    setSavedMsg(`${cards.length} kartu disimpan ke Flashcards!`);
  };


  /** Satu tombol: ringkas + flashcard + soal, simpan otomatis */
  const handleGenerateAll = async () => {
    if (!text.trim()) return;
    if (!isPro && aiUsage + 3 > FREE_LIMITS.aiPerMonth) {
      navigate("/pricing");
      return;
    }
    setLoading(true);
    setError(null);
    setResult("");
    setSavedMsg(null);
    try {
      let ringkasOut = "";
      let flashOut = "";
      let soalOut = "";
      if (aiReady) {
        ringkasOut = await generateAI("ringkas", text);
        flashOut = await generateAI("flashcard", text);
        soalOut = await generateAI("soal", text);
        if (!isPro) {
          incrementAiUsage();
          incrementAiUsage();
          incrementAiUsage();
        }
      } else {
        await new Promise((r) => setTimeout(r, 800));
        ringkasOut =
          "📌 Ringkasan (demo):\n\n" +
          text
            .split(/[.!?]+/)
            .filter((s) => s.trim().length > 20)
            .slice(0, 4)
            .map((s, i) => `${i + 1}. ${s.trim()}.`)
            .join("\n\n");
        flashOut =
          "DEAPAN: Apa topik utama?\nBELAKANG: (dari materi)\n\nDEAPAN: Sebutkan satu poin penting\nBELAKANG: (dari materi)";
        soalOut =
          "1. Apa topik utama teks?\nA. Opsi A\nB. Opsi B\nC. Opsi C\nD. Opsi D\nJawaban: A";
      }

      setResult(
        "=== RINGKASAN ===\n\n" +
          ringkasOut +
          "\n\n=== FLASHCARD ===\n\n" +
          flashOut +
          "\n\n=== SOAL LATIHAN ===\n\n" +
          soalOut
      );

      const cards = parseFlashcards(flashOut);
      let cardsSaved = 0;
      if (cards.length > 0) {
        const withinQuota = isPro || (
          canUseFeature(isPro, "flashcardSets") &&
          getFeatureUsageThisMonth("flashcardCardsTotal") + cards.length <= FREE_LIMITS.flashcardCardsTotal
        );
        if (withinQuota) {
          const sets = getFromStorage<FlashcardSet[]>("flashcard-sets", []);
          const titleBase = pdfName
            ? pdfName.replace(/\.pdf$/i, "")
            : `Materi ${new Date().toLocaleDateString("id-ID")}`;
          const newSet: FlashcardSet = {
            id: uuid(),
            title: titleBase.slice(0, 60),
            cards: cards.map((c) => ({ id: uuid(), front: c.front, back: c.back })),
            createdAt: new Date().toISOString(),
          };
          saveToStorage("flashcard-sets", [newSet, ...sets]);
          cardsSaved = cards.length;
          if (!isPro) {
            incrementFeatureUsage("flashcardSets");
            for (let i = 0; i < cards.length; i++) incrementFeatureUsage("flashcardCardsTotal");
          }
        }
      }

      const quizSets = getFromStorage<
        { id: string; title: string; questions: any[]; createdAt: string }[]
      >("quiz-sets", []);
      const questions: {
        id: string;
        question: string;
        options: string[];
        correctAnswer: number;
      }[] = [];
      const blocks = soalOut.split(/\n(?=\d+\.)/);
      for (const block of blocks) {
        const lines = block
          .trim()
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length < 5) continue;
        const qLine = lines[0].replace(/^\d+\.\s*/, "");
        const opts = lines.slice(1, 5).map((l) => l.replace(/^[A-D]\.\s*/i, ""));
        const ansLine = lines.find((l) => /^Jawaban:/i.test(l)) || "";
        const letter = (ansLine.match(/Jawaban:\s*([A-D])/i) || [])[1];
        const correctAnswer = letter ? letter.toUpperCase().charCodeAt(0) - 65 : 0;
        if (qLine && opts.length === 4) {
          questions.push({
            id: uuid(),
            question: qLine,
            options: opts,
            correctAnswer: Math.min(3, Math.max(0, correctAnswer)),
          });
        }
      }
      let questionsSaved = 0;
      if (questions.length > 0 && (isPro || (
        canUseFeature(isPro, "quizSets") &&
        getFeatureUsageThisMonth("quizQuestions") + questions.length <= FREE_LIMITS.quizQuestions
      ))) {
        const titleBase = pdfName
          ? pdfName.replace(/\.pdf$/i, "")
          : `Soal ${new Date().toLocaleDateString("id-ID")}`;
        quizSets.unshift({
          id: uuid(),
          title: titleBase.slice(0, 60),
          questions,
          createdAt: new Date().toISOString(),
        });
        saveToStorage("quiz-sets", quizSets);
        questionsSaved = questions.length;
        if (!isPro) {
          incrementFeatureUsage("quizSets");
          for (let i = 0; i < questions.length; i++) incrementFeatureUsage("quizQuestions");
        }
      }

      setSavedMsg(
        `Selesai: ringkasan${cardsSaved ? ` + ${cardsSaved} flashcard` : ""}` +
          (questionsSaved ? ` + ${questionsSaved} soal` : "") +
          " (hasil yang memenuhi kuota tersimpan otomatis)"
      );
    } catch (e: any) {
      if (e.message === "NO_API_KEY") setError("API key Groq belum diset.");
      else setError(e.message || "Gagal generate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="text-purple-500" size={26} />
          Ringkas AI
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isPro
            ? "Unlimited generate"
            : `Free: ${aiUsage}/${freeLimit} kali bulan ini`}
          {" · "}
          {aiReady ? (
            <span className="text-green-600 dark:text-green-400">AI aktif</span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">Mode demo</span>
          )}
        </p>
      </div>
      {!isPro && <p className="text-xs text-gray-500">Upload PDF bulan ini: {getFeatureUsageThisMonth("pdfUploadsPerMonth")}/{FREE_LIMITS.pdfUploadsPerMonth}</p>}

      {!isPro && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3 text-sm">
          <Crown className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">Fitur Pro</p>
            <p className="text-amber-700 dark:text-amber-300 mt-0.5">
              Unlimited generate, PDF lebih panjang, kualitas AI lebih tinggi.
            </p>
            <Link
              to="/pricing"
              className="text-amber-600 dark:text-amber-400 font-medium hover:underline mt-1 inline-block"
            >
              Upgrade sekarang →
            </Link>
          </div>
        </div>
      )}

      {!aiReady && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium flex items-center gap-2">
            <AlertCircle size={16} /> Aktifkan AI real (gratis)
          </p>
          <ol className="mt-2 list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
            <li>
              Daftar di{" "}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="underline font-medium"
              >
                console.groq.com/keys
              </a>
            </li>
            <li>
              Buat file <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">.env</code>
            </li>
            <li>
              Isi:{" "}
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                VITE_GROQ_API_KEY=gsk_...
              </code>
            </li>
            <li>
              Restart <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">npm run dev</code>
            </li>
          </ol>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(
          [
            { id: "ringkas", label: "Ringkas" },
            { id: "flashcard", label: "Flashcard" },
            { id: "soal", label: "Soal PG" },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              setResult("");
              setError(null);
              setSavedMsg(null);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              mode === m.id
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* PDF upload */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          onChange={handlePDF}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 text-sm font-medium cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950 transition ${
            pdfLoading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {pdfLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Mengekstrak PDF...
            </>
          ) : (
            <>
              <FileUp size={16} /> Upload PDF
            </>
          )}
        </label>
        {pdfName && (
          <span className="text-xs text-gray-500 truncate max-w-[200px]">
            📄 {pdfName}
          </span>
        )}
        <span className="text-xs text-gray-400">atau paste teks di bawah</span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste materi kuliah / catatan di sini, atau upload PDF di atas..."
        className="w-full h-52 border border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-3 bg-white dark:bg-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm leading-relaxed"
      />

      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={handleGenerate}
          disabled={loading || !text.trim() || !canUse}
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Memproses...
            </>
          ) : canUse ? (
            <>
              <Sparkles size={16} /> Generate
            </>
          ) : (
            <>
              <Lock size={16} /> Batas tercapai
            </>
          )}
        </button>

        <button
          onClick={handleGenerateAll}
          disabled={loading || !text.trim() || !canUse}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition"
          title="Ringkas + flashcard + soal sekaligus"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          PDF/Teks → Semua
        </button>

        {mode === "flashcard" && result && (
          <button
            onClick={handleSaveFlashcards}
            className="flex items-center gap-2 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-950 transition"
          >
            <Save size={16} /> Simpan ke Flashcards
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3">
          {error}
        </div>
      )}

      {savedMsg && (
        <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl p-3">
          {savedMsg}{" "}
          <Link to="/flashcards" className="underline font-medium">
            Lihat di sini
          </Link>
        </div>
      )}

      {result && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-sm leading-relaxed shadow-sm">
          {result.split("\n").map((line, index) => (
            <Fragment key={index}>
              {index > 0 && <br />}
              {renderInlineMarkdown(line)}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
