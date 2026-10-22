import { useState, useEffect, useRef } from "react";
import { Briefcase, Check, Crown, Download, Eye, ImagePlus, Lock, Plus, Trash2, X } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import { usePlan } from "../context/PlanContext";
import { Link } from "react-router-dom";

interface CVData {
  name: string;
  photo?: string;
  email: string;
  phone: string;
  city: string;
  summary: string;
  education: { school: string; major: string; year: string }[];
  certifications: { name: string; issuer: string; year: string }[];
  experience: { title: string; org: string; period: string; desc: string }[];
  organizations: { role: string; name: string; period: string; desc: string }[];
  skills: string;
  projects: { name: string; desc: string; link: string }[];
}

const empty: CVData = {
  name: "",
  photo: "",
  email: "",
  phone: "",
  city: "",
  summary: "",
  education: [{ school: "", major: "", year: "" }],
  certifications: [{ name: "", issuer: "", year: "" }],
  experience: [{ title: "", org: "", period: "", desc: "" }],
  organizations: [{ role: "", name: "", period: "", desc: "" }],
  skills: "",
  projects: [{ name: "", desc: "", link: "" }],
};

type CVTemplate = "classic" | "sidebar" | "editorial" | "horizon" | "emerald" | "graphite" | "compact" | "creative";

const premiumTemplates: { id: CVTemplate; name: string; description: string; style: string }[] = [
  { id: "sidebar", name: "Sidebar Kreatif", description: "Dua kolom dengan aksen warna", style: "bg-blue-600" },
  { id: "editorial", name: "Editorial Elegan", description: "Serif klasik dengan aksen emas", style: "bg-amber-700" },
  { id: "horizon", name: "Horizon", description: "Header navy yang tegas dan modern", style: "bg-indigo-700" },
  { id: "emerald", name: "Emerald", description: "Aksen hijau untuk kesan segar", style: "bg-emerald-700" },
  { id: "graphite", name: "Graphite", description: "Monokrom minimalis dan rapi", style: "bg-gray-700" },
  { id: "compact", name: "Compact Teal", description: "Ringkas dengan aksen teal", style: "bg-teal-700" },
  { id: "creative", name: "Portfolio Plum", description: "Dua kolom editorial dengan aksen plum lembut", style: "bg-[#62576b]" },
];

function convertOklchColors(value: string): string {
  return value.replace(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)/gi, (_match, lightnessText: string, chromaText: string, hueText: string, alphaText?: string) => {
    const lightness = Number.parseFloat(lightnessText) / (lightnessText.endsWith("%") ? 100 : 1);
    const chroma = Number.parseFloat(chromaText);
    const hue = (Number.parseFloat(hueText) * Math.PI) / 180;
    const a = chroma * Math.cos(hue);
    const b = chroma * Math.sin(hue);
    const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const toSrgb = (channel: number) => {
      const linear = Math.max(0, Math.min(1, channel));
      return Math.round(255 * (linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055));
    };
    const red = toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
    const green = toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
    const blue = toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
    const alpha = alphaText ? Number.parseFloat(alphaText) / (alphaText.endsWith("%") ? 100 : 1) : 1;
    return alpha < 1 ? `rgba(${red}, ${green}, ${blue}, ${alpha})` : `rgb(${red}, ${green}, ${blue})`;
  });
}

function createPortraitDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Pilih file gambar seperti JPG, PNG, atau WebP."));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error("Ukuran foto maksimal 12 MB."));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 800;
      const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Foto tidak bisa diproses di browser ini."));
        return;
      }
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Foto gagal dibuka. Coba file gambar lain."));
    };
    image.src = objectUrl;
  });
}

export default function CVBuilder() {
  const { isPro } = usePlan();
  const [data, setData] = useState<CVData>(() => {
    const saved = getFromStorage<Partial<CVData>>("cv-data", {});
    return {
      ...empty,
      ...saved,
      certifications: saved.certifications ?? empty.certifications,
      organizations: saved.organizations ?? empty.organizations,
    };
  });
  const [template, setTemplate] = useState<CVTemplate>(() => {
    const saved = getFromStorage<string>("cv-template", "classic");
    return saved === "classic" || premiumTemplates.some((option) => option.id === saved)
      ? (saved as CVTemplate)
      : "classic";
  });
  const activeTemplate: CVTemplate = isPro ? template : "classic";
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveToStorage("cv-data", data);
  }, [data]);

  useEffect(() => {
    saveToStorage("cv-template", template);
  }, [template]);

  const set = <K extends keyof CVData>(key: K, val: CVData[K]) =>
    setData((d) => ({ ...d, [key]: val }));

  const downloadPdf = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    setDownloadError(null);

    try {
      const module = await import("html2pdf.js");
      const html2pdf = (module as any).default || module;
      const safeName = data.name.replace(/[^a-z0-9 _-]/gi, "").trim() || "saya";
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `CV-${safeName}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            onclone: (clonedDocument: Document) => {
              clonedDocument.querySelectorAll("*").forEach((element) => {
                const computed = clonedDocument.defaultView?.getComputedStyle(element);
                if (!computed) return;
                for (let i = 0; i < computed.length; i += 1) {
                  const property = computed.item(i);
                  const value = computed.getPropertyValue(property);
                  if (value.includes("oklch(")) {
                    (element as HTMLElement).style.setProperty(property, convertOklchColors(value));
                  }
                }
              });
            },
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(previewRef.current)
        .save();
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Gagal membuat PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="text-slate-600" size={26} />
            CV & Portfolio
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Susun CV untuk magang / kerja. Perubahan tersimpan di browser.
            {!isPro && (
              <> | Unduh PDF gratis | <Link to="/pricing" className="text-amber-600 hover:underline">Pro</Link> untuk template premium</>
            )}
          </p>
        </div>
      </div>

      <Section title="Data diri">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800">
            {data.photo ? <img src={data.photo} alt="Foto CV rasio 3 banding 4" className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-1 text-xs"><ImagePlus size={20} /> Foto 3 × 4</div>}
          </div>
          <div className="space-y-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              <ImagePlus size={16} /> {data.photo ? "Ganti foto" : "Upload foto"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                setPhotoError(null);
                try {
                  set("photo", await createPortraitDataUrl(file));
                } catch (error) {
                  setPhotoError(error instanceof Error ? error.message : "Foto gagal diproses.");
                }
              }} />
            </label>
            {data.photo && <button type="button" onClick={() => set("photo", "")} className="ml-2 inline-flex items-center gap-1 text-sm text-red-600 hover:underline"><X size={14} /> Hapus</button>}
            <p className="text-xs text-gray-500">JPG, PNG, atau WebP. Foto otomatis dipotong ke rasio 3:4.</p>
            {photoError && <p role="alert" className="text-xs text-red-600">{photoError}</p>}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Nama" value={data.name} onChange={(v) => set("name", v)} />
          <Input label="Email" value={data.email} onChange={(v) => set("email", v)} />
          <Input label="Telepon" value={data.phone} onChange={(v) => set("phone", v)} />
          <Input label="Kota" value={data.city} onChange={(v) => set("city", v)} />
        </div>
        <label className="block text-xs text-gray-500 mt-3">Ringkasan singkat</label>
        <textarea
          value={data.summary}
          onChange={(e) => set("summary", e.target.value)}
          className="mt-1 w-full h-20 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-slate-500"
          placeholder="Mahasiswa ... tertarik pada ..."
        />
      </Section>

      <Section title="Pendidikan">
        {data.education.map((e, i) => (
          <div key={i} className="grid sm:grid-cols-3 gap-2 mb-2">
            <input
              placeholder="Universitas"
              value={e.school}
              onChange={(ev) => {
                const education = [...data.education];
                education[i] = { ...e, school: ev.target.value };
                set("education", education);
              }}
              className="field"
            />
            <input
              placeholder="Jurusan"
              value={e.major}
              onChange={(ev) => {
                const education = [...data.education];
                education[i] = { ...e, major: ev.target.value };
                set("education", education);
              }}
              className="field"
            />
            <input
              placeholder="Tahun"
              value={e.year}
              onChange={(ev) => {
                const education = [...data.education];
                education[i] = { ...e, year: ev.target.value };
                set("education", education);
              }}
              className="field"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            set("education", [...data.education, { school: "", major: "", year: "" }])
          }
          className="text-sm text-slate-600 flex items-center gap-1"
        >
          <Plus size={14} /> Tambah
        </button>
      </Section>

      <Section title="Sertifikasi">
        {data.certifications.map((certificate, i) => (
          <div key={i} className="mb-3 grid gap-2 border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800 sm:grid-cols-[1.4fr_1fr_0.6fr_auto]">
            <input
              placeholder="Nama sertifikasi"
              value={certificate.name}
              onChange={(event) => {
                const certifications = [...data.certifications];
                certifications[i] = { ...certificate, name: event.target.value };
                set("certifications", certifications);
              }}
              className="field"
            />
            <input
              placeholder="Lembaga penerbit"
              value={certificate.issuer}
              onChange={(event) => {
                const certifications = [...data.certifications];
                certifications[i] = { ...certificate, issuer: event.target.value };
                set("certifications", certifications);
              }}
              className="field"
            />
            <input
              placeholder="Tahun"
              value={certificate.year}
              onChange={(event) => {
                const certifications = [...data.certifications];
                certifications[i] = { ...certificate, year: event.target.value };
                set("certifications", certifications);
              }}
              className="field"
            />
            {data.certifications.length > 1 && (
              <button
                type="button"
                onClick={() => set("certifications", data.certifications.filter((_, index) => index !== i))}
                aria-label={`Hapus sertifikasi ${i + 1}`}
                className="flex items-center justify-center rounded-lg px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => set("certifications", [...data.certifications, { name: "", issuer: "", year: "" }])}
          className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300"
        >
          <Plus size={14} /> Tambah sertifikasi
        </button>
      </Section>

      <Section title="Pengalaman">
        {data.experience.map((e, i) => (
          <div key={i} className="space-y-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="grid sm:grid-cols-2 gap-2">
              <input
                placeholder="Posisi"
                value={e.title}
                onChange={(ev) => {
                  const experience = [...data.experience];
                  experience[i] = { ...e, title: ev.target.value };
                  set("experience", experience);
                }}
                className="field"
              />
              <input
                placeholder="Organisasi / perusahaan"
                value={e.org}
                onChange={(ev) => {
                  const experience = [...data.experience];
                  experience[i] = { ...e, org: ev.target.value };
                  set("experience", experience);
                }}
                className="field"
              />
              <input
                placeholder="Periode (2024–2025)"
                value={e.period}
                onChange={(ev) => {
                  const experience = [...data.experience];
                  experience[i] = { ...e, period: ev.target.value };
                  set("experience", experience);
                }}
                className="field"
              />
            </div>
            <textarea
              placeholder="Deskripsi singkat"
              value={e.desc}
              onChange={(ev) => {
                const experience = [...data.experience];
                experience[i] = { ...e, desc: ev.target.value };
                set("experience", experience);
              }}
              className="field h-16 resize-none"
            />
            {data.experience.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  set(
                    "experience",
                    data.experience.filter((_, j) => j !== i)
                  )
                }
                className="text-xs text-red-500 flex items-center gap-1"
              >
                <Trash2 size={12} /> Hapus
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            set("experience", [
              ...data.experience,
              { title: "", org: "", period: "", desc: "" },
            ])
          }
          className="text-sm text-slate-600 flex items-center gap-1"
        >
          <Plus size={14} /> Tambah pengalaman
        </button>
      </Section>

      <Section title="Organisasi">
        {data.organizations.map((organization, i) => (
          <div key={i} className="mb-4 space-y-2 border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800">
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                placeholder="Posisi / jabatan"
                value={organization.role}
                onChange={(event) => {
                  const organizations = [...data.organizations];
                  organizations[i] = { ...organization, role: event.target.value };
                  set("organizations", organizations);
                }}
                className="field"
              />
              <input
                placeholder="Nama organisasi"
                value={organization.name}
                onChange={(event) => {
                  const organizations = [...data.organizations];
                  organizations[i] = { ...organization, name: event.target.value };
                  set("organizations", organizations);
                }}
                className="field"
              />
              <input
                placeholder="Periode (2024–2025)"
                value={organization.period}
                onChange={(event) => {
                  const organizations = [...data.organizations];
                  organizations[i] = { ...organization, period: event.target.value };
                  set("organizations", organizations);
                }}
                className="field"
              />
            </div>
            <textarea
              placeholder="Kontribusi atau tanggung jawab"
              value={organization.desc}
              onChange={(event) => {
                const organizations = [...data.organizations];
                organizations[i] = { ...organization, desc: event.target.value };
                set("organizations", organizations);
              }}
              className="field h-16 resize-none"
            />
            {data.organizations.length > 1 && (
              <button type="button" onClick={() => set("organizations", data.organizations.filter((_, index) => index !== i))} className="flex items-center gap-1 text-xs text-red-500">
                <Trash2 size={12} /> Hapus
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => set("organizations", [...data.organizations, { role: "", name: "", period: "", desc: "" }])} className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
          <Plus size={14} /> Tambah organisasi
        </button>
      </Section>

      <Section title="Skills">
        <textarea
          value={data.skills}
          onChange={(e) => set("skills", e.target.value)}
          placeholder="JavaScript, React, Excel, Public speaking..."
          className="field h-20 resize-none"
        />
      </Section>

      <Section title="Proyek / Portfolio">
        {data.projects.map((p, i) => (
          <div key={i} className="space-y-2 mb-3">
            <input
              placeholder="Nama proyek"
              value={p.name}
              onChange={(ev) => {
                const projects = [...data.projects];
                projects[i] = { ...p, name: ev.target.value };
                set("projects", projects);
              }}
              className="field"
            />
            <input
              placeholder="Link (opsional)"
              value={p.link}
              onChange={(ev) => {
                const projects = [...data.projects];
                projects[i] = { ...p, link: ev.target.value };
                set("projects", projects);
              }}
              className="field"
            />
            <textarea
              placeholder="Deskripsi"
              value={p.desc}
              onChange={(ev) => {
                const projects = [...data.projects];
                projects[i] = { ...p, desc: ev.target.value };
                set("projects", projects);
              }}
              className="field h-16 resize-none"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            set("projects", [...data.projects, { name: "", desc: "", link: "" }])
          }
          className="text-sm text-slate-600 flex items-center gap-1"
        >
          <Plus size={14} /> Tambah proyek
        </button>
      </Section>

      <Section title="Template premium">
        <p className="text-sm text-gray-500 dark:text-gray-400">Pilih desain untuk pratinjau dan PDF CV kamu.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => setTemplate("classic")}
            aria-pressed={activeTemplate === "classic"}
            className={`group overflow-hidden rounded-xl border text-left transition ${activeTemplate === "classic" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200 hover:border-blue-300 dark:border-gray-700"}`}
          >
            <div className="h-28 bg-gray-100 p-3 dark:bg-gray-800">
              <div className="mx-auto h-full max-w-40 rounded bg-white p-2 shadow-sm">
                <div className="h-2 w-2/3 rounded-sm bg-slate-700" />
                <div className="mt-2 space-y-1"><div className="h-1 w-full rounded bg-gray-300" /><div className="h-1 w-4/5 rounded bg-gray-200" /><div className="mt-2 h-1 w-full rounded bg-gray-200" /><div className="h-1 w-3/4 rounded bg-gray-200" /></div>
              </div>
            </div>
            <div className="flex items-start justify-between gap-2 p-3">
              <span><span className="block text-sm font-semibold">Klasik</span><span className="mt-1 block text-xs text-gray-500">Satu kolom, simpel, gratis</span></span>
              {activeTemplate === "classic" ? <Check size={17} className="mt-0.5 shrink-0 text-blue-600" /> : <span className="mt-0.5 shrink-0 text-xs text-gray-400">Gratis</span>}
            </div>
          </button>
          {premiumTemplates.map((option) => {
            const selected = activeTemplate === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => isPro && setTemplate(option.id)}
                aria-pressed={isPro && selected}
                className={`group overflow-hidden rounded-xl border text-left transition ${selected && isPro ? "border-amber-500 ring-2 ring-amber-500/20" : "border-gray-200 hover:border-amber-300 dark:border-gray-700"}`}
              >
                <div className="h-28 bg-gray-100 p-3 dark:bg-gray-800">
                  <div className="mx-auto h-full max-w-40 overflow-hidden rounded bg-white shadow-sm">
                    {option.id === "creative" ? (
                      <div className="flex h-full">
                        <div className="w-[34%] bg-[#62576b] p-1.5"><div className="mb-2 h-6 rounded-sm bg-[#d8d1de]" /><div className="mb-1 h-1 rounded bg-[#c3bacb]" /><div className="mb-1 h-1 w-3/4 rounded bg-[#c3bacb]" /><div className="mt-3 h-1 rounded bg-white/80" /><div className="mt-1 h-1 w-4/5 rounded bg-white/50" /></div>
                        <div className="flex-1 p-2"><div className="h-2 w-4/5 rounded-sm bg-[#62576b]" /><div className="mt-1 h-1 w-1/2 rounded bg-gray-300" /><div className="mt-3 h-1 w-2/5 rounded bg-[#c3bacb]" /><div className="mt-1 h-1 rounded bg-gray-200" /><div className="mt-1 h-1 w-4/5 rounded bg-gray-200" /><div className="mt-3 h-1 w-2/5 rounded bg-[#c3bacb]" /><div className="mt-1 h-1 rounded bg-gray-200" /></div>
                      </div>
                    ) : <div className="h-full p-2">
                      <div className={`h-2 w-2/3 rounded-sm ${option.style}`} />
                      <div className="mt-2 grid grid-cols-[1fr_2fr] gap-1">
                        <div className={`h-14 rounded-sm ${option.id === "sidebar" ? "bg-blue-100" : option.id === "emerald" ? "bg-emerald-100" : option.id === "editorial" ? "bg-amber-100" : "bg-gray-100"}`} />
                        <div className="space-y-1"><div className="h-1 w-full rounded bg-gray-300" /><div className="h-1 w-4/5 rounded bg-gray-200" /><div className="mt-2 h-1 w-full rounded bg-gray-200" /><div className="h-1 w-3/4 rounded bg-gray-200" /></div>
                      </div>
                    </div>}
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2 p-3">
                  <span><span className="block text-sm font-semibold">{option.name}</span><span className="mt-1 block text-xs text-gray-500">{option.description}</span></span>
                  {!isPro ? <Lock size={16} className="mt-0.5 shrink-0 text-amber-600" /> : selected ? <Check size={17} className="mt-0.5 shrink-0 text-amber-600" /> : <Crown size={16} className="mt-0.5 shrink-0 text-amber-500" />}
                </div>
              </button>
            );
          })}
        </div>
        {!isPro && <Link to="/pricing" className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:underline"><Crown size={15} /> Upgrade Pro untuk membuka 3 template</Link>}
      </Section>

      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Eye size={19} className="text-slate-600" /> Pratinjau CV</h2>
          <p className="mt-1 text-sm text-gray-500">Perubahan pada formulir langsung terlihat di pratinjau ini.</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-100 p-3 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div ref={previewRef} className={`mx-auto min-h-[600px] w-full max-w-[800px] px-6 py-8 text-gray-800 shadow-sm sm:px-12 sm:py-12 ${activeTemplate === "editorial" ? "bg-[#fffdf8]" : "bg-white"} ${activeTemplate === "compact" ? "!px-7 !py-7 sm:!px-9 sm:!py-9" : ""}`} style={{ fontFamily: activeTemplate === "editorial" ? "Georgia, serif" : "Arial, sans-serif" }}>
            <header className={`pb-5 ${activeTemplate === "editorial" ? "border-b border-amber-700 text-center" : activeTemplate === "horizon" ? "-mx-6 -mt-8 bg-indigo-800 px-6 pb-6 pt-8 text-white sm:-mx-12 sm:-mt-12 sm:px-12 sm:pt-12" : activeTemplate === "creative" ? "border-b-4 border-[#62576b] pb-6" : activeTemplate === "emerald" ? "border-l-4 border-emerald-600 pl-4" : activeTemplate === "graphite" ? "border-y border-gray-800 py-4" : activeTemplate === "compact" ? "border-b-2 border-teal-700" : "border-b-2 border-slate-700"}`}>
              <div className="flex items-center gap-5">
                {data.photo && <img src={data.photo} alt="Foto CV" className="h-28 w-[5.25rem] shrink-0 rounded object-cover" />}
                <div className="min-w-0">
              <h3 className={`break-words text-3xl font-bold tracking-tight ${activeTemplate === "editorial" ? "text-amber-900" : activeTemplate === "horizon" ? "text-white" : activeTemplate === "creative" ? "text-[#4b4253]" : activeTemplate === "emerald" ? "text-emerald-900" : activeTemplate === "graphite" ? "text-gray-900" : activeTemplate === "compact" ? "text-teal-900" : "text-slate-900"}`}>{data.name || "Nama Lengkap"}</h3>
                  <p className={`mt-2 break-words text-sm ${activeTemplate === "horizon" ? "text-white/85" : "text-gray-600"}`}>{[data.email, data.phone, data.city].filter(Boolean).join(" | ") || "Email | Telepon | Kota"}</p>
                </div>
              </div>
            </header>
            <div className={activeTemplate === "sidebar" || activeTemplate === "creative" ? "grid gap-7 pt-5 sm:grid-cols-[0.8fr_1.6fr]" : ""}>
              {(activeTemplate === "sidebar" || activeTemplate === "creative") && <aside className={`space-y-5 rounded-xl p-4 ${activeTemplate === "creative" ? "border-l-4 border-[#81758a] bg-[#f3f0f5]" : "bg-blue-50"}`}>
                {data.summary.trim() && <PreviewSection template={activeTemplate} title="Profil">{data.summary}</PreviewSection>}
                {data.skills.trim() && <PreviewSection template={activeTemplate} title="Keahlian">{data.skills}</PreviewSection>}
                {data.education.some((item) => item.school || item.major || item.year) && <PreviewSection template={activeTemplate} title="Pendidikan">{data.education.filter((item) => item.school || item.major || item.year).map((item, index) => <div key={index} className="mb-3 break-inside-avoid"><p className="font-semibold">{item.school || "Institusi"}</p><p className="text-sm text-gray-600">{[item.major, item.year].filter(Boolean).join(" | ")}</p></div>)}</PreviewSection>}
              </aside>}
              <div className={activeTemplate === "sidebar" || activeTemplate === "creative" ? "min-w-0" : ""}>
                {activeTemplate !== "sidebar" && activeTemplate !== "creative" && data.summary.trim() && <PreviewSection template={activeTemplate} title="Profil">{data.summary}</PreviewSection>}
                {data.experience.some((item) => item.title || item.org || item.period || item.desc) && <PreviewSection template={activeTemplate} title="Pengalaman">{data.experience.filter((item) => item.title || item.org || item.period || item.desc).map((item, index) => <div key={index} className="mb-4 break-inside-avoid"><div className="flex flex-wrap justify-between gap-x-3"><p className="font-semibold">{item.title || "Posisi"}{item.org ? ` | ${item.org}` : ""}</p>{item.period && <p className="text-sm text-gray-500">{item.period}</p>}</div>{item.desc && <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{item.desc}</p>}</div>)}</PreviewSection>}
                {data.organizations?.some((item) => item.role || item.name || item.period || item.desc) && <PreviewSection template={activeTemplate} title="Organisasi">{data.organizations.filter((item) => item.role || item.name || item.period || item.desc).map((item, index) => <div key={index} className="mb-4 break-inside-avoid"><div className="flex flex-wrap justify-between gap-x-3"><p className="font-semibold">{item.role || "Posisi"}{item.name ? ` | ${item.name}` : ""}</p>{item.period && <p className="text-sm text-gray-500">{item.period}</p>}</div>{item.desc && <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{item.desc}</p>}</div>)}</PreviewSection>}
                {activeTemplate !== "sidebar" && activeTemplate !== "creative" && data.education.some((item) => item.school || item.major || item.year) && <PreviewSection template={activeTemplate} title="Pendidikan">{data.education.filter((item) => item.school || item.major || item.year).map((item, index) => <div key={index} className="mb-3 break-inside-avoid"><p className="font-semibold">{item.school || "Institusi"}</p><p className="text-sm text-gray-600">{[item.major, item.year].filter(Boolean).join(" | ")}</p></div>)}</PreviewSection>}
                {activeTemplate !== "sidebar" && activeTemplate !== "creative" && data.skills.trim() && <PreviewSection template={activeTemplate} title="Keahlian">{data.skills}</PreviewSection>}
                {data.certifications?.some((item) => item.name || item.issuer || item.year) && <PreviewSection template={activeTemplate} title="Sertifikasi">{data.certifications.filter((item) => item.name || item.issuer || item.year).map((item, index) => <div key={index} className="mb-3 break-inside-avoid"><p className="font-semibold">{item.name || "Sertifikasi"}</p><p className="text-sm text-gray-600">{[item.issuer, item.year].filter(Boolean).join(" | ")}</p></div>)}</PreviewSection>}
                {data.projects.some((item) => item.name || item.desc || item.link) && <PreviewSection template={activeTemplate} title="Proyek dan Portofolio">{data.projects.filter((item) => item.name || item.desc || item.link).map((item, index) => <div key={index} className="mb-4 break-inside-avoid"><p className="break-words font-semibold">{item.name || "Proyek"}</p>{item.link && <p className="break-all text-sm text-blue-700">{item.link}</p>}{item.desc && <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{item.desc}</p>}</div>)}</PreviewSection>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">Periksa isi dan tata letaknya di atas sebelum mengunduh.</p>
          <button onClick={downloadPdf} disabled={downloading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-white hover:bg-slate-900 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
            <Download size={16} /> {downloading ? "Menyiapkan PDF..." : "Unduh PDF"}
          </button>
        </div>
        {downloadError && <p role="alert" className="text-sm text-red-600">Gagal membuat PDF: {downloadError}</p>}
      </section>

      <style>{`
        .field {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.75rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: transparent;
        }
        .field:focus {
          outline: none;
          box-shadow: 0 0 0 2px #64748b;
        }
        .dark .field {
          border-color: #374151;
        }
      `}</style>
    </div>
  );
}

function PreviewSection({ title, children, template }: { title: string; children: React.ReactNode; template: CVTemplate }) {
  const headingColor = template === "editorial" ? "text-amber-800 border-amber-300" : template === "emerald" ? "text-emerald-800 border-emerald-300" : template === "horizon" ? "text-indigo-800 border-indigo-300" : template === "graphite" ? "text-gray-800 border-gray-400" : template === "compact" ? "text-teal-800 border-teal-300" : template === "creative" ? "text-[#62576b] border-[#d8d1de]" : template === "sidebar" ? "text-blue-800 border-blue-300" : "text-slate-700 border-gray-300";
  return (
    <section className="mt-6 break-inside-avoid">
      <h4 className={`mb-3 border-b pb-1 text-xs font-bold uppercase tracking-[0.14em] ${headingColor}`}>{title}</h4>
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-2">
      <h3 className="font-semibold text-sm">{title}</h3>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field mt-1"
      />
    </div>
  );
}
