import { useState, useRef, useEffect } from "react";
import { usePersistentState } from "../lib/storage";
import {
  MessageCircle,
  Send,
  Loader2,
  FileUp,
  BookOpen,
  Highlighter,
  GraduationCap,
  Lock,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { usePlan } from "../context/PlanContext";
import {
  hasAIKey,
  chatWithContext,
  explainTerm,
  generateStudyQuestions,
  gradeStudyAnswer,
} from "../lib/ai";
import { extractTextFromPDF } from "../lib/pdf";
import { FREE_LIMITS, PRO_LIMITS, getAiUsageThisMonth, incrementAiUsage, canUseFeature, incrementFeatureUsage, canUploadPdf, clipPdfText } from "../lib/limits";

type Tab = "chat" | "belajar" | "istilah";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

function cleanAssistantFormatting(content: string) {
  return content.replace(/\*/g, "");
}

export default function TanyaAI() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("chat");
  const [context, setContext] = usePersistentState("draft-tanya-ai-context", "");
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [messages, setMessages] = usePersistentState<Msg[]>("draft-tanya-ai-messages", []);
  const [input, setInput] = usePersistentState("draft-tanya-ai-input", "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // belajar
  const [questionsText, setQuestionsText] = usePersistentState("draft-tanya-ai-questions", "");
  const [qList, setQList] = useState<string[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = usePersistentState("draft-tanya-ai-answer", "");
  const [feedback, setFeedback] = useState("");

  // istilah
  const [term, setTerm] = usePersistentState("draft-tanya-ai-term", "");
  const [termResult, setTermResult] = usePersistentState("draft-tanya-ai-term-result", "");

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const aiReady = hasAIKey();
  const aiUsage = getAiUsageThisMonth();
  const canUse = isPro || aiUsage < FREE_LIMITS.aiPerMonth;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const bumpUsage = () => {
    if (!isPro && aiReady) incrementAiUsage();
  };

  const handlePDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!canUseFeature(isPro, "pdfUploadsPerMonth")) {
      navigate("/pricing");
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Hanya PDF.");
      return;
    }
    if (!canUploadPdf(isPro, file.size)) {
      setError(`Ukuran PDF maksimal ${isPro ? PRO_LIMITS.pdfMaxMb : FREE_LIMITS.pdfMaxMb} MB untuk paket ${isPro ? "Pro" : "Free"}.`);
      return;
    }
    setPdfLoading(true);
    setError(null);
    try {
      const text = await extractTextFromPDF(file, (isPro ? PRO_LIMITS.pdfMaxChars : FREE_LIMITS.pdfMaxChars) + 1);
      if (!text || text.length < 20) {
        setError("PDF tidak berisi teks (mungkin scan).");
        return;
      }
      const limited = clipPdfText(isPro, text);
      setContext(limited.text);
      setPdfName(file.name);
      if (!isPro) incrementFeatureUsage("pdfUploadsPerMonth");
      if (limited.clipped) setError(`Teks PDF dipotong ke ${(isPro ? PRO_LIMITS.pdfMaxChars : FREE_LIMITS.pdfMaxChars).toLocaleString("id-ID")} karakter sesuai batas paket.`);
    } catch (err: any) {
      setError(err.message || "Gagal baca PDF");
    } finally {
      setPdfLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const sendChat = async () => {
    if (!input.trim()) return;
    if (!isPro && getAiUsageThisMonth() >= FREE_LIMITS.aiPerMonth) {
      navigate("/pricing");
      return;
    }
    if (!context.trim()) {
      setError("Tempel materi atau upload PDF dulu (wajib untuk jawaban berbasis konteks).");
      return;
    }

    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    setError(null);

    try {
      if (!aiReady) {
        await new Promise((r) => setTimeout(r, 600));
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "Mode demo: set VITE_GROQ_API_KEY di .env untuk jawaban AI real dari materi kamu.\n\nContoh pertanyaan: \"Jelaskan konsep utama seperti ke anak SMA\" atau \"Apa 3 poin terpenting?\"",
          },
        ]);
      } else {
        const history = [...messages, { role: "user" as const, content: userMsg }];
        const reply = await chatWithContext(context, history);
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
        bumpUsage();
      }
    } catch (e: any) {
      setError(e.message === "NO_API_KEY" ? "API key belum diset." : e.message);
    } finally {
      setLoading(false);
    }
  };

  const startBelajar = async () => {
    if (!context.trim()) {
      setError("Isi materi / PDF dulu.");
      return;
    }
    if (!isPro && getAiUsageThisMonth() >= FREE_LIMITS.aiPerMonth) {
      navigate("/pricing");
      return;
    }
    setLoading(true);
    setError(null);
    setFeedback("");
    setAnswer("");
    setQIndex(0);
    try {
      if (!aiReady) {
        setQuestionsText(
          "1. Apa topik utama materi?\n2. Sebutkan satu definisi penting.\n3. Apa contoh penerapannya?\n4. Apa yang sering salah dipahami?\n5. Rangkum dalam 2 kalimat.\n\n(Demo — aktifkan Groq untuk soal dari materi asli)"
        );
        setQList([
          "Apa topik utama materi?",
          "Sebutkan satu definisi penting.",
          "Apa contoh penerapannya?",
          "Apa yang sering salah dipahami?",
          "Rangkum dalam 2 kalimat.",
          "Apa tujuan utama dari konsep yang dibahas?",
          "Bagaimana hubungan antara dua konsep penting dalam materi?",
          "Sebutkan langkah atau proses yang dijelaskan.",
          "Apa dampak atau manfaat dari penerapan materi ini?",
          "Berikan contoh lain yang sesuai dengan materi.",
        ]);
      } else {
        const raw = await generateStudyQuestions(context);
        setQuestionsText(raw);
        const list = raw
          .split("\n")
          .map((l) => l.replace(/^\d+[\.)]\s*/, "").trim())
          .filter((l) => l.length > 10);
        setQList(list.slice(0, 10));
        bumpUsage();
      }
    } catch (e: any) {
      setError(e.message || "Gagal buat soal");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !qList[qIndex]) return;
    if (!isPro && getAiUsageThisMonth() >= FREE_LIMITS.aiPerMonth) {
      navigate("/pricing");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (!aiReady) {
        setFeedback(
          "Skor (demo): 7/10\nBenar: kamu sudah mencoba menjawab.\nKurang: aktifkan API key untuk penilaian berdasarkan materi.\nKunci singkat: lihat kembali ringkasan materi."
        );
      } else {
        const fb = await gradeStudyAnswer(context, qList[qIndex], answer);
        setFeedback(fb);
        bumpUsage();
      }
    } catch (e: any) {
      setError(e.message || "Gagal menilai");
    } finally {
      setLoading(false);
    }
  };

  const runExplain = async () => {
    if (!term.trim()) return;
    if (!isPro && getAiUsageThisMonth() >= FREE_LIMITS.aiPerMonth) {
      navigate("/pricing");
      return;
    }
    setLoading(true);
    setError(null);
    setTermResult("");
    try {
      if (!aiReady) {
        setTermResult(
          `Penjelasan demo untuk "${term}": aktifkan VITE_GROQ_API_KEY agar penjelasan disesuaikan materi yang kamu tempel.`
        );
      } else {
        const r = await explainTerm(context, term.trim());
        setTermResult(r);
        bumpUsage();
      }
    } catch (e: any) {
      setError(e.message || "Gagal menjelaskan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="text-indigo-600" size={26} />
          Tanya AI
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Jawab dari materi/PDF yang kamu berikan ·{" "}
          {isPro ? "Pro unlimited" : `Free ${aiUsage}/${FREE_LIMITS.aiPerMonth} AI/bulan`} ·{" "}
          {aiReady ? (
            <span className="text-green-600">AI aktif</span>
          ) : (
            <span className="text-amber-600">Mode demo</span>
          )}
        </p>
      </div>

      {!aiReady && (
        <div className="text-sm bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-600" />
          <span>
            Set <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">VITE_GROQ_API_KEY</code> di{" "}
            <code className="text-xs">.env</code> (gratis di console.groq.com) lalu restart{" "}
            <code className="text-xs">npm run dev</code>.
          </span>
        </div>
      )}

      {/* Konteks materi */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <p className="text-sm font-medium flex items-center gap-2">
            <BookOpen size={16} /> Materi konteks (wajib untuk chat akurat)
          </p>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handlePDF} id="tanya-pdf" />
            <label
              htmlFor="tanya-pdf"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-indigo-300 text-indigo-700 dark:text-indigo-300 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950"
            >
              {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
              Upload PDF
            </label>
            {context && (
              <button
                type="button"
                onClick={() => {
                  setContext("");
                  setPdfName(null);
                }}
                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
              >
                <Trash2 size={14} /> Hapus
              </button>
            )}
          </div>
        </div>
        {pdfName && <p className="text-xs text-gray-500">📄 {pdfName}</p>}
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Paste catatan / materi di sini, atau upload PDF..."
          className="w-full h-28 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "chat" as const, label: "Chat materi", icon: MessageCircle },
            { id: "belajar" as const, label: "Mode belajar", icon: GraduationCap },
            { id: "istilah" as const, label: "Jelaskan istilah", icon: Highlighter },
          ]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t.id
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3">
          {error}
        </div>
      )}

      {/* CHAT */}
      {tab === "chat" && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col min-h-[360px]">
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[420px]">
            {messages.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-10">
                Contoh: &quot;Jelaskan seperti ke anak SMA&quot; · &quot;Apa 3 poin terpenting?&quot; ·
                &quot;Bedakan konsep A dan B menurut materi&quot;
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm rounded-2xl px-4 py-3 max-w-[90%] whitespace-pre-wrap ${
                  m.role === "user"
                    ? "ml-auto bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                }`}
              >
                {m.role === "assistant"
                  ? cleanAssistantFormatting(m.content)
                  : m.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" /> Menjawab...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
              placeholder="Tanya tentang materi..."
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={sendChat}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-indigo-600 text-white px-4 py-2.5 disabled:opacity-50 hover:bg-indigo-700"
            >
              {!canUse ? <Lock size={18} /> : <Send size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* BELAJAR */}
      {tab === "belajar" && (
        <div className="space-y-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <button
            onClick={startBelajar}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Membuat soal..." : "Buat 10 pertanyaan dari materi"}
          </button>
          {qList.length > 0 && (
            <>
              <p className="text-sm font-medium">
                Soal {qIndex + 1}/{qList.length}: {qList[qIndex]}
              </p>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Tulis jawabanmu..."
                className="w-full h-24 text-sm border rounded-xl px-3 py-2 bg-transparent border-gray-200 dark:border-gray-700"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={submitAnswer}
                  disabled={loading || !answer.trim()}
                  className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                >
                  Nilai jawaban
                </button>
                {qIndex + 1 < qList.length && (
                  <button
                    onClick={() => {
                      setQIndex((i) => i + 1);
                      setAnswer("");
                      setFeedback("");
                    }}
                    className="border px-4 py-2 rounded-xl text-sm"
                  >
                    Soal berikutnya
                  </button>
                )}
              </div>
              {feedback && (
                <div className="text-sm whitespace-pre-wrap bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  {feedback}
                </div>
              )}
              {questionsText && (
                <details className="text-xs text-gray-500">
                  <summary>Lihat semua soal</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{questionsText}</pre>
                </details>
              )}
            </>
          )}
        </div>
      )}

      {/* ISTILAH */}
      {tab === "istilah" && (
        <div className="space-y-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <p className="text-sm text-gray-500">
            Ketik istilah sulit dari materi. AI jelaskan singkat (lebih akurat jika materi sudah diisi).
          </p>
          <div className="flex gap-2">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runExplain()}
              placeholder="Contoh: osmosis, regresi linear, habeas corpus..."
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm bg-transparent"
            />
            <button
              onClick={runExplain}
              disabled={loading || !term.trim()}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              Jelaskan
            </button>
          </div>
          {termResult && (
            <div className="text-sm whitespace-pre-wrap rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
              {termResult}
            </div>
          )}
        </div>
      )}

      {!canUse && (
        <p className="text-sm text-center text-gray-500">
          Kuota AI habis.{" "}
          <Link to="/pricing" className="text-indigo-600 underline">
            Upgrade Pro
          </Link>
        </p>
      )}
    </div>
  );
}
