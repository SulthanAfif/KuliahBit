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
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  FileUp,
  X,
} from "lucide-react";
import { generateAI, hasAIKey } from "../lib/ai";
import { extractTextFromPDF } from "../lib/pdf";
import { usePlan } from "../context/PlanContext";
import { canUseAi, incrementAiUsage, FREE_LIMITS, canUseFeature, incrementFeatureUsage, getFeatureUsageThisMonth, canUploadPdf } from "../lib/limits";
import { AiQuotaBadge, UpgradeCard } from "../components/ProGate";
import { v4 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";

interface Slide {
  id: string;
  title: string;
  bullets: string;
  subtitle?: string;
  isCover?: boolean;
  images?: MaterialImage[];
}

function makeCover(title = "Judul Presentasi"): Slide {
  return { id: uuid(), title, subtitle: "Subjudul atau nama penyaji", bullets: "", isCover: true };
}

interface MaterialImage {
  id: string;
  name: string;
  data: string;
  width: number;
  height: number;
}

type TemplateId = "modern" | "professional" | "visual" | "midnight" | "editorial" | "emerald";
type LayoutId = "standard" | "image-left" | "stacked" | "centered";

const LAYOUTS: { id: LayoutId; name: string; description: string }[] = [
  { id: "standard", name: "Kolom kanan", description: "Teks di kiri, gambar di kanan" },
  { id: "image-left", name: "Gambar kiri", description: "Visual di kiri, teks di kanan" },
  { id: "stacked", name: "Bertumpuk", description: "Teks di atas, gambar di bawah" },
  { id: "centered", name: "Terpusat", description: "Judul dan isi di tengah" },
];

const FONTS = ["Arial", "Aptos", "Georgia", "Trebuchet MS"];

const TEMPLATES: {
  id: TemplateId;
  name: string;
  description: string;
  background: string;
  accent: string;
  title: string;
  body: string;
  muted: string;
  decoration: "bar" | "topline" | "editorial" | "orb" | "professional" | "photo";
}[] = [
  { id: "modern", name: "Modern Flow", description: "Gradasi biru, bentuk dinamis", background: "EAF1FF", accent: "4F46E5", title: "1E1B4B", body: "334155", muted: "64748B", decoration: "bar" },
  { id: "professional", name: "Professional", description: "Navy rapi dengan aksen korporat", background: "F4F7FB", accent: "2563EB", title: "10233F", body: "334155", muted: "64748B", decoration: "professional" },
  { id: "visual", name: "Photo Story", description: "Panel foto besar dan komposisi editorial", background: "F7F3EE", accent: "9F5962", title: "2B2430", body: "514A52", muted: "877B80", decoration: "photo" },
  { id: "midnight", name: "Neon Night", description: "Gelap dramatis dengan aksen neon", background: "0B1020", accent: "FBBF24", title: "F9FAFB", body: "D1D5DB", muted: "9CA3AF", decoration: "topline" },
  { id: "editorial", name: "Editorial", description: "Krem hangat dengan tipografi berani", background: "F7F0E5", accent: "C24132", title: "292524", body: "44403C", muted: "78716C", decoration: "editorial" },
  { id: "emerald", name: "Botanical", description: "Hijau lembut dengan aksen organik", background: "E7F5EC", accent: "059669", title: "064E3B", body: "14532D", muted: "527866", decoration: "orb" },
];

function SlidePreview({ slide, index, total, template, layout, fontFamily, fontSizes, compact = false }: {
  slide: Slide;
  index: number;
  total: number;
  template: (typeof TEMPLATES)[number];
  layout: LayoutId;
  fontFamily: string;
  fontSizes: { title: number; body: number; label: number };
  compact?: boolean;
}) {
  const bullets = slide.bullets.split("\n").map((item) => item.trim()).filter(Boolean);
  const hasImages = Boolean(slide.images?.length);
  const textBoxClass = hasImages && layout === "image-left"
    ? "left-[48%] right-0 inset-y-0"
    : hasImages && (layout === "stacked" || layout === "centered")
      ? "inset-x-0 top-0 bottom-[42%]"
      : hasImages
        ? "left-0 right-[40%] inset-y-0"
        : layout === "standard" && !hasImages
          ? "left-0 right-[40%] inset-y-0"
        : template.decoration === "photo"
          ? "left-0 right-[42%] inset-y-0"
          : "inset-0";
  const imageBoxClass = layout === "image-left"
    ? "left-[5%] right-[52%] top-[20%] bottom-[17%]"
    : layout === "stacked" || layout === "centered"
      ? "inset-x-[8%] top-[62%] bottom-[9%]"
      : "right-[5%] top-[20%] bottom-[17%] w-[34%]";
  const centerText = layout === "centered";
  if (slide.isCover) {
    return (
      <div className="relative isolate flex aspect-video flex-col items-center justify-center overflow-hidden rounded-xl px-[10%] text-center" style={{ background: template.id === "modern" ? "linear-gradient(135deg, #edf2ff 0%, #e0e7ff 52%, #dbeafe 100%)" : template.id === "visual" ? "linear-gradient(135deg, #fbf8f4 0%, #f0e8e3 100%)" : `#${template.background}`, fontFamily }}>
        {template.decoration === "bar" && <div className="absolute inset-y-0 left-0 w-[2.2%]" style={{ backgroundColor: `#${template.accent}` }} />}
        {template.decoration === "topline" && <div className="absolute inset-x-0 top-0 h-[2.2%]" style={{ backgroundColor: `#${template.accent}` }} />}
        {template.decoration === "professional" && <div className="absolute inset-y-0 left-0 w-[3%]" style={{ backgroundColor: `#${template.title}` }} />}
        {template.decoration === "orb" && <div className="absolute -right-[8%] -top-[25%] h-[75%] aspect-square rounded-full opacity-15" style={{ backgroundColor: `#${template.accent}` }} />}
        {template.decoration === "photo" && <div className="absolute right-0 top-0 h-full w-[30%]" style={{ background: "linear-gradient(145deg, #d7c2c1 0%, #b9999a 48%, #d7c9b8 100%)" }} />}
        {template.decoration === "editorial" && <div className="absolute inset-x-[9%] top-[15%] h-px" style={{ backgroundColor: `#${template.accent}` }} />}
        <div className={`relative z-10 max-w-[82%] ${template.decoration === "photo" ? "mr-[20%]" : ""}`}>
          <p className={`${compact ? "mb-2" : "mb-4"} font-semibold uppercase tracking-[0.24em]`} style={{ color: `#${template.accent}`, fontSize: compact ? fontSizes.label / 12 : fontSizes.label }}>PRESENTASI</p>
          <h3 className={`font-bold leading-tight ${template.decoration === "editorial" ? "font-serif" : ""}`} style={{ color: `#${template.title}`, fontSize: compact ? fontSizes.title / 12 : fontSizes.title }}>{slide.title || "Judul Presentasi"}</h3>
          {slide.subtitle && <p className={compact ? "mt-1" : "mt-4"} style={{ color: `#${template.body}`, fontSize: compact ? fontSizes.body / 12 : fontSizes.body }}>{slide.subtitle}</p>}
          <div className={`${compact ? "mx-auto mt-2 h-0.5 w-6" : "mx-auto mt-7 h-1 w-16"} rounded-full`} style={{ backgroundColor: `#${template.accent}` }} />
        </div>
      </div>
    );
  }
  return (
    <div className={`relative isolate aspect-video overflow-hidden rounded-xl ${compact ? "rounded-lg" : "rounded-2xl"}`} style={{ background: template.id === "modern" ? "linear-gradient(135deg, #edf2ff 0%, #e0e7ff 52%, #dbeafe 100%)" : template.id === "visual" ? "linear-gradient(135deg, #fbf8f4 0%, #f0e8e3 100%)" : `#${template.background}` }}>
      {template.decoration === "bar" && <div className="absolute inset-y-0 left-0 w-[2.2%]" style={{ backgroundColor: `#${template.accent}` }} />}
      {template.decoration === "topline" && <div className="absolute inset-x-0 top-0 h-[2.2%]" style={{ backgroundColor: `#${template.accent}` }} />}
      {template.decoration === "editorial" && <div className="absolute inset-x-[5%] top-[9%] h-px" style={{ backgroundColor: `#${template.accent}` }} />}
      {template.decoration === "orb" && <div className="absolute -right-[8%] -top-[25%] h-[58%] aspect-square rounded-full opacity-15" style={{ backgroundColor: `#${template.accent}` }} />}
      {template.decoration === "professional" && <div className="absolute inset-y-0 left-0 w-[3%]" style={{ backgroundColor: `#${template.title}` }} />}
      {!hasImages && layout === "standard" && template.id === "modern" && <div className="absolute right-[5%] top-[12%] bottom-[12%] w-[34%] overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-400 shadow-xl shadow-indigo-900/20"><div className="absolute -right-[20%] -top-[18%] h-[82%] aspect-square rounded-full bg-white/20" /><div className="absolute -bottom-[38%] -left-[18%] h-[96%] aspect-square rounded-full border-[10px] border-white/25" /><div className="absolute left-[14%] top-[18%] h-[28%] w-[48%] rounded-xl bg-white/20 backdrop-blur-sm" /></div>}
      {!hasImages && layout === "standard" && template.id === "professional" && <><div className="absolute inset-x-0 top-0 h-[13%] bg-[#10233f]" /><div className="absolute right-[7%] top-[5%] h-[3%] w-[18%] rounded-full bg-blue-400" /><div className="absolute right-[7%] top-[10%] h-px w-[30%] bg-blue-200/70" /></>}
      {template.decoration === "photo" && !hasImages && layout === "standard" && <div className="absolute inset-y-0 right-0 w-[42%] overflow-hidden" style={{ background: "linear-gradient(145deg, #d7c2c1 0%, #b9999a 48%, #d7c9b8 100%)" }}><div className="absolute inset-[12%] rounded-xl border border-white/50 bg-white/10" /><span className="absolute -right-[10%] top-[8%] h-[40%] aspect-square rounded-full border-[5px] border-white/35" /><span className="absolute bottom-[13%] left-[12%] h-[24%] aspect-square rounded-full bg-[#e9d7c2]/80" /><div className="absolute bottom-[14%] right-[10%] h-[3%] w-[36%] rounded-full bg-white/65" /></div>}
      {!hasImages && layout === "standard" && template.id === "midnight" && <><div className="absolute -right-[5%] top-[4%] h-[65%] aspect-square rounded-full border-[7px] border-fuchsia-500/60" /><div className="absolute right-[12%] top-[20%] h-[36%] aspect-square rounded-full bg-gradient-to-br from-violet-500/70 to-cyan-400/40 blur-sm" /><div className="absolute bottom-[12%] right-[9%] h-[4%] w-[24%] rotate-[-18deg] bg-cyan-300" /></>}
      {!hasImages && layout === "standard" && template.id === "editorial" && <><div className="absolute right-[5%] top-[18%] h-[58%] w-[31%] rounded-t-full bg-[#e9b8a1]" /><div className="absolute right-[15%] top-[26%] h-[39%] w-[11%] rounded-t-full bg-[#c24132]" /><span className="absolute right-[7%] top-[10%] text-[clamp(2rem,8vw,5rem)] font-black leading-none text-[#c24132]/20">01</span></>}
      {!hasImages && layout === "standard" && template.id === "emerald" && <><div className="absolute right-[12%] top-[19%] h-[53%] w-[16%] rotate-[-30deg] rounded-full bg-emerald-500/80" /><div className="absolute right-[26%] top-[31%] h-[39%] w-[13%] rotate-[28deg] rounded-full bg-lime-400/80" /><div className="absolute right-[18%] top-[17%] h-[67%] w-[2px] bg-emerald-800/50" /><span className="absolute right-[8%] bottom-[14%] rounded-full bg-white/80 px-3 py-1 text-[6px] font-bold uppercase tracking-widest text-emerald-800">IDEA • GROW • SHARE</span></>}
      <div className={`absolute ${template.decoration === "editorial" ? "inset-x-0 top-0 bottom-[15%]" : textBoxClass} flex flex-col ${compact ? "justify-center px-[10%] py-[8%]" : "justify-center px-[9%] py-[7%]"} ${template.decoration === "bar" || template.decoration === "professional" ? "pl-[11%]" : ""} ${centerText ? "items-center text-center" : ""}`} style={{ fontFamily }}>
        <p className="mb-[2%] font-semibold uppercase tracking-[0.18em]" style={{ color: `#${template.accent}`, fontSize: compact ? fontSizes.label / 12 : fontSizes.label }}>
          {index === 0 ? "PRESENTASI" : `BAGIAN ${String(index).padStart(2, "0")}`}
        </p>
        <h3 className={`font-bold leading-tight ${template.decoration === "editorial" ? "font-serif" : ""}`} style={{ color: `#${template.title}`, fontSize: compact ? fontSizes.title / 12 : fontSizes.title }}>
          {slide.title || `Slide ${index + 1}`}
        </h3>
        {bullets.length > 0 && (
          <ul className="mt-[3%] space-y-[1.6%]" style={{ color: `#${template.body}`, fontSize: compact ? fontSizes.body / 12 : fontSizes.body }}>
            {bullets.slice(0, compact ? 2 : 5).map((bullet, itemIndex) => (
              <li key={itemIndex} className="flex min-w-0 items-start gap-[1.5%] leading-snug">
                <span className="mt-[0.45em] h-[0.38em] w-[0.38em] shrink-0 rounded-full" style={{ backgroundColor: `#${template.accent}` }} />
                <span className="line-clamp-2">{bullet}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasImages && (
          <div className={`absolute ${imageBoxClass} flex ${layout === "stacked" || layout === "centered" ? "flex-row" : "flex-col"} gap-[3%] overflow-hidden`}>
            {slide.images!.slice(0, 2).map((image) => (
              <img key={image.id} src={image.data} alt={image.name} className="min-h-0 min-w-0 flex-1 rounded-md object-contain" style={{ backgroundColor: "rgba(255,255,255,0.82)" }} />
            ))}
          </div>
      )}
      {template.decoration === "editorial" && <div className="absolute inset-x-[5%] bottom-[10%] h-px" style={{ backgroundColor: `#${template.accent}` }} />}
      <span className={`absolute ${template.decoration === "editorial" ? "bottom-[3%]" : "bottom-[5%]"} right-[5%] font-medium`} style={{ color: `#${template.muted}`, fontSize: compact ? fontSizes.label / 12 : fontSizes.label }}>{index + 1} / {total}</span>
    </div>
  );
}

function LayoutThumbnail({ layout }: { layout: LayoutId }) {
  const bar = "absolute rounded-full bg-slate-400/80";
  const image = "absolute rounded-sm bg-gradient-to-br from-rose-300 via-orange-200 to-indigo-300";
  return (
    <div aria-hidden="true" className="relative aspect-video overflow-hidden rounded-md border border-slate-300 bg-slate-50 p-[8%] dark:border-slate-600 dark:bg-slate-800">
      {layout === "standard" && <>
        <span className={`${bar} left-[10%] top-[25%] h-[9%] w-[38%] bg-slate-700`} />
        <span className={`${bar} left-[10%] top-[43%] h-[5%] w-[31%]`} />
        <span className={`${bar} left-[10%] top-[54%] h-[5%] w-[35%]`} />
        <span className={`${bar} left-[10%] top-[65%] h-[5%] w-[27%]`} />
        <span className={`${image} right-[9%] top-[19%] h-[62%] w-[30%]`} />
      </>}
      {layout === "image-left" && <>
        <span className={`${image} left-[9%] top-[19%] h-[62%] w-[31%]`} />
        <span className={`${bar} right-[10%] top-[27%] h-[9%] w-[38%] bg-slate-700`} />
        <span className={`${bar} right-[10%] top-[47%] h-[5%] w-[31%]`} />
        <span className={`${bar} right-[10%] top-[59%] h-[5%] w-[35%]`} />
        <span className={`${bar} right-[10%] top-[71%] h-[5%] w-[25%]`} />
      </>}
      {layout === "stacked" && <>
        <span className={`${bar} left-[25%] top-[16%] h-[9%] w-[50%] bg-slate-700`} />
        <span className={`${bar} left-[31%] top-[32%] h-[5%] w-[38%]`} />
        <span className={`${bar} left-[35%] top-[43%] h-[5%] w-[30%]`} />
        <span className={`${image} bottom-[12%] left-[12%] h-[28%] w-[34%]`} />
        <span className={`${image} bottom-[12%] right-[12%] h-[28%] w-[34%]`} />
      </>}
      {layout === "centered" && <>
        <span className={`${bar} left-[29%] top-[23%] h-[11%] w-[42%] bg-slate-700`} />
        <span className={`${bar} left-[35%] top-[42%] h-[5%] w-[30%]`} />
        <span className={`${bar} left-[38%] top-[53%] h-[5%] w-[24%]`} />
        <span className={`${image} bottom-[10%] left-[24%] h-[20%] w-[52%]`} />
      </>}
    </div>
  );
}

function loadImageMaterial(file: File): Promise<MaterialImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca " + file.name + "."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error(file.name + " bukan gambar yang didukung."));
      image.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Gambar tidak dapat diproses di browser ini."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve({ id: uuid(), name: file.name, data: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height });
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
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
    makeCover(),
    {
      id: uuid(),
      title: "Pengantar",
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
  const [imageLoading, setImageLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfName, setPdfName] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("modern");
  const [layoutId, setLayoutId] = useState<LayoutId>("standard");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSizes, setFontSizes] = useState({ title: 56, body: 22, label: 12 });
  const [previewIndex, setPreviewIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const aiReady = hasAIKey();
  const selectedTemplate = TEMPLATES.find((template) => template.id === templateId)!;

  const updateSlide = (id: string, patch: Partial<Slide>) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addImagesToSlide = async (slideId: string, selectedFiles: File[], slideIndex: number) => {
    if (!selectedFiles.length) return;
    setPreviewIndex(slideIndex);
    const currentImages = slides.find((slide) => slide.id === slideId)?.images || [];
    if (currentImages.length + selectedFiles.length > 2) {
      setError("Maksimal 2 gambar materi untuk setiap slide.");
      return;
    }
    if (selectedFiles.some((file) => !file.type.startsWith("image/"))) {
      setError("Pilih file gambar seperti PNG, JPG, atau WebP.");
      return;
    }
    if (selectedFiles.some((file) => file.size > 8 * 1024 * 1024)) {
      setError("Ukuran setiap gambar maksimal 8 MB.");
      return;
    }
    setImageLoading(true);
    setError(null);
    try {
      const images = await Promise.all(selectedFiles.map(loadImageMaterial));
      setSlides((prev) => prev.map((slide) => slide.id === slideId
        ? { ...slide, images: [...(slide.images || []), ...images] }
        : slide));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gambar gagal ditambahkan.");
    } finally {
      setImageLoading(false);
    }
  };

  const addSlide = () => {
    setSlides((prev) => [
      ...prev,
      { id: uuid(), title: `Slide ${prev.length + 1}`, bullets: "" },
    ]);
  };

  const removeSlide = (id: string) => {
    if (slides.length <= 1 || slides.find((slide) => slide.id === id)?.isCover) return;
    setSlides((prev) => prev.filter((s) => s.id !== id));
    setPreviewIndex((current) => Math.min(current, slides.length - 2));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= slides.length) return;
    if (slides[index]?.isCover || slides[next]?.isCover) return;
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
    if (!canUseAi(isPro)) {
      navigate("/pricing");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (aiReady) {
        const raw = await generateAI("outline", input);
        const contentSlides = parseOutlineToSlides(raw);
        setSlides([makeCover(topic.trim() || contentSlides[0]?.title || "Judul Presentasi"), ...contentSlides]);
        setPreviewIndex(0);
      } else {
        await new Promise((r) => setTimeout(r, 600));
        const t = topic.trim() || "Presentasi";
        setSlides([
          makeCover(t),
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
        setPreviewIndex(0);
        setError(null);
      }
      if (!isPro) incrementAiUsage();
    } catch (e: any) {
      setError(e.message === "NO_API_KEY" ? "API key belum diset." : e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (file?: File) => {
    if (!file) return;
    if (!canUseFeature(isPro, "pdfUploadsPerMonth")) {
      navigate("/pricing");
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Pilih file PDF.");
      return;
    }
    if (!canUploadPdf(isPro, file.size)) {
      if (!isPro) {
        navigate("/pricing");
        return;
      }
      setError("Ukuran PDF maksimal 10 MB.");
      return;
    }
    setPdfLoading(true);
    setError(null);
    try {
      const extracted = await extractTextFromPDF(file);
      if (!extracted) {
        setError("Teks tidak ditemukan di PDF ini. PDF hasil scan perlu OCR terlebih dahulu.");
        return;
      }
      setMaterial((current) => current.trim() ? `${current.trim()}\n\n${extracted}` : extracted);
      setPdfName(file.name);
      if (!isPro) incrementFeatureUsage("pdfUploadsPerMonth");
    } catch (e) {
      setError(e instanceof Error ? `PDF gagal dibaca: ${e.message}` : "PDF gagal dibaca.");
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadPdf = async () => {
    setDownloading(true);
    setError(null);
    const exportRoot = document.createElement("div");
    exportRoot.style.cssText = "position:fixed;left:0;top:0;width:1280px;background:#ffffff;z-index:-100;pointer-events:none;";
    try {
      const { renderToStaticMarkup } = await import("react-dom/server");
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = (html2pdfModule as any).default || html2pdfModule;

      slides.forEach((slide, index) => {
        const page = document.createElement("div");
        page.style.cssText = `width:1280px;height:720px;page-break-after:${index < slides.length - 1 ? "always" : "auto"};break-after:${index < slides.length - 1 ? "page" : "auto"};overflow:hidden;`;
        page.innerHTML = renderToStaticMarkup(
          <SlidePreview
            slide={slide}
            index={index}
            total={slides.length}
            template={selectedTemplate}
            layout={layoutId}
            fontFamily={fontFamily}
            fontSizes={fontSizes}
          />
        );
        const canvas = page.firstElementChild as HTMLElement | null;
        if (canvas) {
          canvas.style.width = "1280px";
          canvas.style.height = "720px";
          canvas.style.borderRadius = "0";
        }
        exportRoot.appendChild(page);
      });

      document.body.appendChild(exportRoot);
      const filename = `${(topic || slides[0]?.title || "presentasi")
        .replace(/[^\w\s\-]/g, "")
        .trim()
        .slice(0, 40) || "presentasi"}.pdf`;

      await html2pdf()
        .set({
          margin: 0,
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 1.5, useCORS: true, backgroundColor: null, logging: false, windowWidth: 1280 },
          jsPDF: { unit: "mm", format: [338.67, 190.5], orientation: "landscape" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(exportRoot)
        .save();
    } catch (e: any) {
      setError(e.message || "Gagal membuat file PDF.");
    } finally {
      exportRoot.remove();
      setDownloading(false);
    }
  };

  const movePreview = (direction: -1 | 1) => {
    setPreviewIndex((current) => (current + direction + slides.length) % slides.length);
  };

  const updateCover = (patch: Partial<Slide>) => {
    setSlides((prev) => prev.map((slide, index) => index === 0 && slide.isCover ? { ...slide, ...patch } : slide));
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Presentation className="text-rose-500" size={26} />
          Buat Slide Presentasi
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Susun slide → unduh presentasi PDF siap tampil
        </p>
        <div className="mt-2"><AiQuotaBadge /></div>
      </div>
      {!isPro && !canUseAi(isPro) && (
        <UpgradeCard title="Kuota AI bulan ini habis" description={`Free ${FREE_LIMITS.aiPerMonth}×/bulan. Pro = unlimited generate.`} />
      )}
      {!isPro && <p className="-mt-4 text-xs text-gray-500">Upload PDF bulan ini: {getFeatureUsageThisMonth("pdfUploadsPerMonth")}/{FREE_LIMITS.pdfUploadsPerMonth}</p>}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Judul / topik presentasi"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <textarea
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="Opsional: paste materi biar AI bantu generate slide..."
            className="min-w-0 flex-1 h-28 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 bg-transparent text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <div className="flex shrink-0 flex-col gap-2 sm:w-48">
            <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 sm:h-28 sm:flex-col">
              {pdfLoading ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
              <span className="text-center">{pdfLoading ? "Membaca PDF..." : "Upload PDF"}</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                disabled={pdfLoading}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  void handlePdfUpload(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {pdfName && <p className="truncate text-xs text-gray-500" title={pdfName}>Materi dari: {pdfName}</p>}
          </div>
        </div>
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

      <section className="grid gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Pratinjau slide</h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Tampilan mengikuti template yang dipilih.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => movePreview(-1)} aria-label="Slide sebelumnya" className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-12 text-center text-xs text-gray-500">{previewIndex + 1} / {slides.length}</span>
              <button onClick={() => movePreview(1)} aria-label="Slide berikutnya" className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <SlidePreview slide={slides[previewIndex] || slides[0]} index={previewIndex} total={slides.length} template={selectedTemplate} layout={layoutId} fontFamily={fontFamily} fontSizes={fontSizes} />
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {slides.map((slide, index) => (
              <button key={slide.id} onClick={() => setPreviewIndex(index)} aria-label={`Lihat slide ${index + 1}`} className={`shrink-0 rounded-md border-2 p-0.5 ${previewIndex === index ? "border-rose-500" : "border-transparent"}`}>
                <div className="w-20 sm:w-24"><SlidePreview slide={slide} index={index} total={slides.length} template={selectedTemplate} layout={layoutId} fontFamily={fontFamily} fontSizes={fontSizes} compact /></div>
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <h2 className="font-semibold">Pilih template</h2>
          <p className="mb-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pilih desain untuk pratinjau dan file PPTX.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setTemplateId(template.id)}
                aria-pressed={templateId === template.id}
                className={`rounded-xl border p-2 text-left transition ${templateId === template.id ? "border-rose-500 ring-2 ring-rose-500/15" : "border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500"}`}
              >
                <SlidePreview slide={slides[previewIndex] || slides[0]} index={previewIndex} total={slides.length} template={template} layout={layoutId} fontFamily={fontFamily} fontSizes={fontSizes} compact />
                <span className="mt-2 block text-sm font-semibold">{template.name}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-gray-500 dark:text-gray-400">{template.description}</span>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
              Font
              <select value={fontFamily} onChange={(event) => setFontFamily(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100">
                {FONTS.map((font) => <option key={font} value={font} className="text-gray-900">{font}</option>)}
              </select>
            </label>
            <div className="mt-4 space-y-3">
              <h3 className="text-xs font-medium text-gray-600 dark:text-gray-300">Ukuran teks slide</h3>
              {([
                ["title", "Judul", 24, 88],
                ["body", "Isi / subjudul", 12, 36],
                ["label", "Label dan nomor", 8, 24],
              ] as const).map(([key, label, min, max]) => (
                <label key={key} className="block text-xs text-gray-500 dark:text-gray-400">
                  <span className="mb-1 flex justify-between"><span>{label}</span><span>{fontSizes[key]} px</span></span>
                  <input type="range" min={min} max={max} step={1} value={fontSizes[key]} onChange={(event) => setFontSizes((current) => ({ ...current, [key]: Number(event.target.value) }))} aria-label={`Ukuran teks ${label}`} className="w-full accent-rose-600" />
                </label>
              ))}
            </div>
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">Tata letak</h3>
              <div className="grid grid-cols-2 gap-2">
                {LAYOUTS.map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => setLayoutId(layout.id)}
                    aria-label={layout.name + ": " + layout.description}
                    aria-pressed={layoutId === layout.id}
                    title={layout.name}
                    className={`rounded-lg border p-1.5 transition ${layoutId === layout.id ? "border-rose-500 bg-rose-50 ring-2 ring-rose-500/15 dark:bg-rose-950/30" : "border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500"}`}
                  >
                    <LayoutThumbnail layout={layout.id} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-gray-400">Template, font, dan tata letak diterapkan ke semua slide dan file PPTX.</p>
        </div>
      </section>

      <div className="space-y-3">
        {slides[0]?.isCover && (
          <div className="bg-white dark:bg-gray-900 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2"><span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">COVER</span><span className="text-sm font-semibold">Sampul presentasi</span></div>
            <input value={slides[0].title} onChange={(e) => updateCover({ title: e.target.value })} className="w-full font-semibold bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-rose-400 outline-none text-sm py-2" placeholder="Judul presentasi" />
            <input value={slides[0].subtitle || ""} onChange={(e) => updateCover({ subtitle: e.target.value })} className="mt-3 w-full bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-rose-400 outline-none text-sm py-2" placeholder="Subjudul atau nama penyaji" />
          </div>
        )}
        {slides.map((slide, index) => (
          slide.isCover ? null : (
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
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => document.getElementById("material-image-" + slide.id)?.click()}
                disabled={imageLoading || (slide.images?.length || 0) >= 2}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <ImagePlus size={15} />
                {imageLoading ? "Memproses gambar..." : "Tambah gambar materi"}
              </button>
              <input
                  id={"material-image-" + slide.id}
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={imageLoading || (slide.images?.length || 0) >= 2}
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.currentTarget.files || []);
                    event.currentTarget.value = "";
                    void addImagesToSlide(slide.id, files, index);
                  }}
                />
              <span className="text-xs text-gray-400">PNG, JPG, WebP · maks. 2 gambar, 8 MB per gambar</span>
              {slide.images?.map((image) => (
                <div key={image.id} className="relative h-14 w-20 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <img src={image.data} alt={image.name} title={image.name} className="h-full w-full object-contain bg-white" />
                  <button
                    type="button"
                    aria-label={`Hapus gambar ${image.name}`}
                    onClick={() => updateSlide(slide.id, { images: slide.images?.filter((item) => item.id !== image.id) })}
                    className="absolute right-0.5 top-0.5 rounded-full bg-gray-950/75 p-0.5 text-white hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          )
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
          onClick={downloadPdf}
          disabled={downloading || slides.length === 0}
          className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {downloading ? "Menyiapkan PDF..." : "Unduh PDF"}
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
