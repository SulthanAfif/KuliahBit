import { useState } from "react";
import {
  Presentation,
  Plus,
  Trash2,
  Download,
  Loader2,
  Sparkles,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { generateAI, hasAIKey } from "../lib/ai";
import { usePlan } from "../context/PlanContext";
import { canUseAi, incrementAiUsage, FREE_LIMITS } from "../lib/limits";
import { AiQuotaBadge, UpgradeCard } from "../components/ProGate";
import { v4 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";

interface Slide {
  id: string;
  title: string;
  bullets: string;
}

function parseOutlineToSlides(raw: string): Slide[] {
  const slides: Slide[] = [];
  const blocks = raw.split(/Slide\s*\d+\s*:/i).slice(1);
  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) continue;
    const title = lines[0].replace(/^[:\-\s]+/, "").trim() || "Slide";
    const bullets = lines
      .slice(1)
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean)
      .join("\n");
    slides.push({ id: uuid(), title, bullets });
  }
  if (slides.length === 0) {
    slides.push({
      id: uuid(),
      title: "Judul Presentasi",
      bullets: "Poin 1\nPoin 2\nPoin 3",
    });
  }
  return slides;
}

export default function SlidePresentasi() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [material, setMaterial] = useState("");
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: uuid(),
      title: "Judul Presentasi",
      bullets: "Perkenalan topik\nTujuan presentasi",
    },
    {
      id: uuid(),
      title: "Isi Utama",
      bullets: "Poin penting 1\nPoin penting 2\nPoin penting 3",
    },
    {
      id: uuid(),
      title: "Kesimpulan",
      bullets: "Ringkasan\nPertanyaan / diskusi",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aiReady = hasAIKey();

  const updateSlide = (id: string, patch: Partial<Slide>) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addSlide = () => {
    setSlides((prev) => [
      ...prev,
      { id: uuid(), title: `Slide ${prev.length + 1}`, bullets: "" },
    ]);
  };

  const removeSlide = (id: string) => {
    setSlides((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== id)));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= slides.length) return;
    const copy = [...slides];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setSlides(copy);
  };

  const generateFromAI = async () => {
    const input = [topic.trim() && `Topik: ${topic.trim()}`, material.trim()]
      .filter(Boolean)
      .join("\n\n");
    if (!input) {
      setError("Isi topik atau paste materi dulu.");
      return;
    }
    if (aiReady && !canUseAi(isPro)) {
      navigate("/pricing");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (aiReady) {
        const raw = await generateAI("outline", input);
        setSlides(parseOutlineToSlides(raw));
        if (!isPro) incrementAiUsage();
      } else {
        await new Promise((r) => setTimeout(r, 600));
        const t = topic.trim() || "Presentasi";
        setSlides([
          {
            id: uuid(),
            title: t,
            bullets: "Latar belakang\nTujuan\nOutline singkat",
          },
          {
            id: uuid(),
            title: "Pembahasan",
            bullets: "Konsep utama\nContoh\nImplikasi",
          },
          {
            id: uuid(),
            title: "Kesimpulan",
            bullets: "Ringkasan\nSaran\nQ&A",
          },
        ]);
        setError(null);
      }
    } catch (e: any) {
      setError(e.message === "NO_API_KEY" ? "API key belum diset." : e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPptx = async () => {
    setDownloading(true);
    setError(null);
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      pptx.author = "KuliahBit";
      pptx.title = topic.trim() || slides[0]?.title || "Presentasi";

      slides.forEach((slide, i) => {
        const s = pptx.addSlide();
        s.background = { color: "FFFFFF" };

        // accent bar
        s.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 0.15,
          h: 5.625,
          fill: { color: "4F46E5" },
        });

        s.addText(slide.title || `Slide ${i + 1}`, {
          x: 0.5,
          y: 0.35,
          w: 9,
          h: 0.7,
          fontSize: 28,
          fontFace: "Arial",
          bold: true,
          color: "1E1B4B",
        });

        const bullets = slide.bullets
          .split("\n")
          .map((b) => b.trim())
          .filter(Boolean);

        if (bullets.length) {
          s.addText(
            bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
            {
              x: 0.6,
              y: 1.3,
              w: 8.8,
              h: 3.8,
              fontSize: 18,
              fontFace: "Arial",
              color: "334155",
              valign: "top",
            }
          );
        }

        s.addText(`${i + 1} / ${slides.length}`, {
          x: 8.5,
          y: 5.2,
          w: 1,
          h: 0.3,
          fontSize: 11,
          color: "94A3B8",
          align: "right",
        });
      });

      const filename = `${(topic || slides[0]?.title || "presentasi")
        .replace(/[^\w\s\-]/g, "")
        .trim()
        .slice(0, 40) || "presentasi"}.pptx`;
      await pptx.writeFile({ fileName: filename });
    } catch (e: any) {
      setError(e.message || "Gagal membuat file PPTX.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Presentation className="text-rose-500" size={26} />
          Buat Slide Presentasi
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Susun slide → unduh file PowerPoint (.pptx) siap pakai
        </p>
        <div className="mt-2"><AiQuotaBadge /></div>
      </div>
      {!isPro && !canUseAi(isPro) && (
        <UpgradeCard title="Kuota AI bulan ini habis" description={`Free ${FREE_LIMITS.aiPerMonth}×/bulan. Pro = unlimited generate.`} />
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Judul / topik presentasi"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
        <textarea
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          placeholder="Opsional: paste materi biar AI bantu generate slide..."
          className="w-full h-28 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 bg-transparent text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
        <button
          onClick={generateFromAI}
          disabled={loading}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {aiReady ? "Generate slide dari AI" : "Generate template (demo)"}
        </button>
        {!aiReady && (
          <p className="text-xs text-gray-400">
            Tanpa API key Groq, hanya template dasar. Set VITE_GROQ_API_KEY untuk
            generate dari materi.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                {index + 1}
              </span>
              <input
                value={slide.title}
                onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                className="flex-1 font-semibold bg-transparent border-b border-transparent focus:border-rose-400 outline-none text-sm py-1"
                placeholder="Judul slide"
              />
              <button
                onClick={() => move(index, -1)}
                className="p-1 text-gray-400 hover:text-gray-700"
                title="Naik"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => move(index, 1)}
                className="p-1 text-gray-400 hover:text-gray-700"
                title="Turun"
              >
                <ChevronDown size={16} />
              </button>
              <button
                onClick={() => removeSlide(slide.id)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <textarea
              value={slide.bullets}
              onChange={(e) => updateSlide(slide.id, { bullets: e.target.value })}
              placeholder={"Satu poin per baris\nPoin 2\nPoin 3"}
              className="w-full h-24 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={addSlide}
          className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Plus size={16} /> Tambah slide
        </button>
        <button
          onClick={downloadPptx}
          disabled={downloading || slides.length === 0}
          className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          Unduh .pptx
        </button>
      </div>

      {error && (
        <div className="flex gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  );
}
