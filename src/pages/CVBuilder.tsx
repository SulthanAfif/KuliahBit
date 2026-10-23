import { useState, useEffect, useRef } from "react";
import { Briefcase, Download, Plus, Trash2, ImagePlus, Printer, Crown, Check } from "lucide-react";
import { getFromStorage, saveToStorage, usePersistentState } from "../lib/storage";
import { usePlan } from "../context/PlanContext";
import { Link, useNavigate } from "react-router-dom";

interface CVData {
  photo: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  linkedin: string;
  summary: string;
  education: { school: string; major: string; year: string }[];
  experience: { title: string; org: string; period: string; desc: string }[];
  certifications: { name: string; issuer: string; year: string }[];
  languages: { name: string; proficiency: string }[];
  organizations: { role: string; org: string; period: string; desc: string }[];
  skills: string;
  projects: { name: string; desc: string; link: string }[];
}

const empty: CVData = {
  photo: "",
  name: "",
  email: "",
  phone: "",
  city: "",
  linkedin: "",
  summary: "",
  education: [{ school: "", major: "", year: "" }],
  experience: [{ title: "", org: "", period: "", desc: "" }],
  certifications: [{ name: "", issuer: "", year: "" }],
  languages: [{ name: "", proficiency: "" }],
  organizations: [{ role: "", org: "", period: "", desc: "" }],
  skills: "",
  projects: [{ name: "", desc: "", link: "" }],
};

const CV_TEMPLATES = [
  { id: "classic", name: "Klasik", description: "Satu kolom, simpel, gratis", accent: "334155", premium: false, serif: false, sidebar: false },
  { id: "sidebar", name: "Sidebar Kreatif", description: "Dua kolom dengan aksen warna", accent: "2563EB", premium: true, serif: false, sidebar: true },
  { id: "editorial", name: "Editorial Elegan", description: "Serif klasik dengan aksen emas", accent: "B45309", premium: true, serif: true, sidebar: false },
  { id: "horizon", name: "Horizon", description: "Header navy yang tegas dan modern", accent: "4338CA", premium: true, serif: false, sidebar: false },
  { id: "emerald", name: "Emerald", description: "Aksen hijau untuk kesan segar", accent: "047857", premium: true, serif: false, sidebar: true },
  { id: "graphite", name: "Graphite", description: "Dua kolom editorial bernuansa charcoal", accent: "374151", premium: true, serif: false, sidebar: true },
  { id: "teal", name: "Compact Teal", description: "Ringkas dengan aksen teal", accent: "0F766E", premium: true, serif: false, sidebar: false },
  { id: "plum", name: "Portfolio Plum", description: "Dua kolom editorial dengan aksen plum lembut", accent: "6B5B73", premium: true, serif: true, sidebar: true },
] as const;

export default function CVBuilder() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [data, setData] = useState<CVData>(() => ({ ...empty, ...getFromStorage("cv-data", empty) }));
  const [templateId, setTemplateId] = usePersistentState<(typeof CV_TEMPLATES)[number]["id"]>("draft-cv-template", "classic");
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveToStorage("cv-data", data);
  }, [data]);

  const set = <K extends keyof CVData>(key: K, val: CVData[K]) =>
    setData((d) => ({ ...d, [key]: val }));
  const selectedTemplate = CV_TEMPLATES.find((template) => template.id === templateId) || CV_TEMPLATES[0];

  const downloadTxt = () => {
    const lines = [
      data.name,
      [data.email, data.phone, data.city, data.linkedin].filter(Boolean).join(" · "),
      "",
      "RINGKASAN",
      data.summary,
      "",
      "PENDIDIKAN",
      ...data.education.map(
        (e) => `${e.school} — ${e.major} (${e.year})`
      ),
      "",
      "PENGALAMAN",
      ...data.experience.flatMap((e) => [
        `${e.title} @ ${e.org} (${e.period})`,
        e.desc,
        "",
      ]),
      "",
      "SERTIFIKASI",
      ...data.certifications.map((c) => [c.name, c.issuer, c.year].filter(Boolean).join(" — ")),
      "",
      "BAHASA",
      ...data.languages.map((l) => [l.name, l.proficiency].filter(Boolean).join(" — ")),
      "",
      "ORGANISASI",
      ...data.organizations.flatMap((o) => [
        [o.role, o.org, o.period].filter(Boolean).join(" @ "),
        o.desc,
        "",
      ]),
      "SKILLS",
      data.skills,
      "",
      "PROYEK / PORTFOLIO",
      ...data.projects.flatMap((p) => [
        `${p.name}${p.link ? ` — ${p.link}` : ""}`,
        p.desc,
        "",
      ]),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `CV-${data.name || "saya"}.txt`;
    a.click();
  };

  const handlePhoto = (file?: File) => {
    if (!file) return;
    setPhotoError("");
    if (!file.type.startsWith("image/")) {
      setPhotoError("Pilih file foto JPG, PNG, atau WebP.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setPhotoError("Foto tidak dapat dibaca. Coba pilih file gambar lain.");
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => setPhotoError("Format foto ini belum didukung. Coba gunakan JPG, PNG, atau WebP.");
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(1, 600 / image.naturalWidth, 800 / image.naturalHeight);
        canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const context = canvas.getContext("2d");
        if (!context) {
          setPhotoError("Foto tidak dapat diproses di browser ini.");
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        set("photo", canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="text-slate-600" size={26} />
            CV & Portfolio
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Susun CV untuk magang / kerja — tersimpan di browser
            {!isPro && (
              <> · Free: unduh teks · <Link to="/pricing" className="text-amber-600 hover:underline">Pro</Link> untuk template premium</>
            )}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-wrap gap-2 print:hidden sm:w-auto">
          <button
            onClick={downloadTxt}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-slate-900"
          >
            <Download size={16} /> Unduh teks
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-slate-600 px-4 py-2.5 text-sm text-white hover:bg-slate-700">
            <Printer size={16} /> Cetak / PDF
          </button>
        </div>
      </div>

      <Section title="Template premium">
        <p className="-mt-1 text-sm text-gray-500">Pilih desain untuk pratinjau dan PDF CV kamu.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {CV_TEMPLATES.map((template) => {
            const active = templateId === template.id;
            const locked = template.premium && !isPro;
            return (
              <button key={template.id} type="button" aria-pressed={active} onClick={() => {
                if (locked) { navigate("/pricing"); return; }
                setTemplateId(template.id);
              }} className={`overflow-hidden rounded-xl border text-left transition ${active ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200 hover:border-gray-400 dark:border-gray-700"}`}>
                <div className="flex h-28 items-center justify-center bg-slate-100 p-3 dark:bg-slate-800">
                  <div className="relative flex h-full w-40 gap-1.5 overflow-hidden rounded bg-white p-2 shadow-sm">
                    {template.sidebar && <div className={`absolute inset-y-0 left-0 w-[27%] ${template.id === "graphite" ? "opacity-90" : "opacity-15"}`} style={{ backgroundColor: template.id === "graphite" ? "#252a32" : `#${template.accent}` }} />}
                    {template.id === "horizon" && <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: `#${template.accent}` }} />}
                    {template.id === "graphite" && <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: `#${template.accent}` }} />}
                    {template.id === "teal" && <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: `#${template.accent}` }} />}
                    <div className={`relative flex-1 space-y-1.5 ${template.sidebar ? "ml-[28%]" : ""}`}>
                      <div className="h-2 w-3/5 rounded-full" style={{ backgroundColor: `#${template.accent}` }} />
                      <div className="h-1 w-full rounded-full bg-slate-300" /><div className="h-1 w-4/5 rounded-full bg-slate-200" />
                      <div className="mt-2 h-1 w-2/5 rounded-full opacity-60" style={{ backgroundColor: `#${template.accent}` }} />
                      <div className="h-1 w-full rounded-full bg-slate-200" /><div className="h-1 w-3/4 rounded-full bg-slate-200" />
                    </div>
                  </div>
                </div>
                <div className="flex min-h-[62px] items-start justify-between gap-2 bg-white p-3 dark:bg-gray-900">
                  <span><span className="block text-sm font-semibold">{template.name}</span><span className="mt-1 block text-[11px] text-gray-500">{template.description}</span></span>
                  {locked ? <Crown size={16} className="mt-0.5 shrink-0 text-amber-500" /> : active ? <Check size={16} className="mt-0.5 shrink-0 text-blue-500" /> : null}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Pratinjau CV">
        <p className="-mt-1 text-sm text-gray-500">Pratinjau mengikuti template dan akan digunakan saat cetak / simpan PDF.</p>
        <CVDocument data={data} template={selectedTemplate} />
      </Section>

      <Section title="Data diri">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="h-36 w-28 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              {data.photo ? <img src={data.photo} alt="Foto profil CV" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-center text-xs text-gray-400">Foto 3 × 4</div>}
            </div>
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="hidden" onChange={(e) => { handlePhoto(e.currentTarget.files?.[0]); e.currentTarget.value = ""; }} />
            <button type="button" onClick={() => photoInputRef.current?.click()} className="flex cursor-pointer items-center gap-1 text-xs text-slate-600 hover:underline">
              <ImagePlus size={14} /> {data.photo ? "Ganti foto" : "Pilih foto"}
            </button>
            {photoError && <p role="alert" className="max-w-40 text-center text-xs text-red-500">{photoError}</p>}
            {data.photo && <button type="button" onClick={() => set("photo", "")} className="text-xs text-red-500">Hapus foto</button>}
          </div>
          <div className="grid flex-1 content-start gap-3 sm:grid-cols-2">
            <Input label="Nama" value={data.name} onChange={(v) => set("name", v)} />
            <Input label="Email" value={data.email} onChange={(v) => set("email", v)} />
            <Input label="Telepon" value={data.phone} onChange={(v) => set("phone", v)} />
            <Input label="Kota" value={data.city} onChange={(v) => set("city", v)} />
            <Input label="LinkedIn" value={data.linkedin} onChange={(v) => set("linkedin", v)} />
          </div>
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

      <Section title="Sertifikasi">
        {data.certifications.map((c, i) => (
          <div key={i} className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem_auto]">
            <input placeholder="Nama sertifikasi" value={c.name} onChange={(ev) => { const items = [...data.certifications]; items[i] = { ...c, name: ev.target.value }; set("certifications", items); }} className="field min-w-0" />
            <input placeholder="Penerbit" value={c.issuer} onChange={(ev) => { const items = [...data.certifications]; items[i] = { ...c, issuer: ev.target.value }; set("certifications", items); }} className="field min-w-0" />
            <input placeholder="Tahun" value={c.year} onChange={(ev) => { const items = [...data.certifications]; items[i] = { ...c, year: ev.target.value }; set("certifications", items); }} className="field min-w-0" />
            {data.certifications.length > 1 && <button type="button" onClick={() => set("certifications", data.certifications.filter((_, j) => j !== i))} aria-label="Hapus sertifikasi" className="text-red-500"><Trash2 size={15} /></button>}
          </div>
        ))}
        <button type="button" onClick={() => set("certifications", [...data.certifications, { name: "", issuer: "", year: "" }])} className="text-sm text-slate-600 flex items-center gap-1"><Plus size={14} /> Tambah sertifikasi</button>
      </Section>

      <Section title="Bahasa">
        {data.languages.map((language, i) => (
          <div key={i} className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <input placeholder="Bahasa (contoh: Inggris)" value={language.name} onChange={(ev) => { const items = [...data.languages]; items[i] = { ...language, name: ev.target.value }; set("languages", items); }} className="field min-w-0" />
            <input placeholder="Kemampuan (contoh: Menengah)" value={language.proficiency} onChange={(ev) => { const items = [...data.languages]; items[i] = { ...language, proficiency: ev.target.value }; set("languages", items); }} className="field min-w-0" />
            {data.languages.length > 1 && <button type="button" onClick={() => set("languages", data.languages.filter((_, j) => j !== i))} aria-label="Hapus bahasa" className="text-red-500"><Trash2 size={15} /></button>}
          </div>
        ))}
        <button type="button" onClick={() => set("languages", [...data.languages, { name: "", proficiency: "" }])} className="text-sm text-slate-600 flex items-center gap-1"><Plus size={14} /> Tambah bahasa</button>
      </Section>

      <Section title="Organisasi">
        {data.organizations.map((o, i) => (
          <div key={i} className="mb-4 space-y-2 border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800">
            <div className="grid gap-2 sm:grid-cols-3">
              <input placeholder="Jabatan / peran" value={o.role} onChange={(ev) => { const items = [...data.organizations]; items[i] = { ...o, role: ev.target.value }; set("organizations", items); }} className="field" />
              <input placeholder="Nama organisasi" value={o.org} onChange={(ev) => { const items = [...data.organizations]; items[i] = { ...o, org: ev.target.value }; set("organizations", items); }} className="field" />
              <input placeholder="Periode" value={o.period} onChange={(ev) => { const items = [...data.organizations]; items[i] = { ...o, period: ev.target.value }; set("organizations", items); }} className="field" />
            </div>
            <textarea placeholder="Deskripsi kegiatan atau pencapaian" value={o.desc} onChange={(ev) => { const items = [...data.organizations]; items[i] = { ...o, desc: ev.target.value }; set("organizations", items); }} className="field h-16 resize-none" />
            {data.organizations.length > 1 && <button type="button" onClick={() => set("organizations", data.organizations.filter((_, j) => j !== i))} className="text-xs text-red-500 flex items-center gap-1"><Trash2 size={12} /> Hapus</button>}
          </div>
        ))}
        <button type="button" onClick={() => set("organizations", [...data.organizations, { role: "", org: "", period: "", desc: "" }])} className="text-sm text-slate-600 flex items-center gap-1"><Plus size={14} /> Tambah organisasi</button>
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

      <CVDocument data={data} template={selectedTemplate} print />

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
        .cv-document { --cv-accent: #334155; max-width: 850px; min-height: 420px; margin: 0 auto; padding: 32px; color: #111827; background: #fff; box-shadow: 0 1px 5px #0002; font: 13px/1.45 Arial, sans-serif; }
        .cv-document.cv-classic { --cv-accent: #172554; padding: 48px; box-shadow: 0 0 0 18px #0f172a; }
        .cv-classic .cv-doc-header { gap: 20px; padding-bottom: 20px; margin-bottom: 24px; border-bottom: 2px solid #172554; }
        .cv-classic .cv-doc-header img { width: 84px; height: 112px; border-radius: 4px; }
        .cv-classic .cv-doc-header h1 { font-size: 28px; color: #111827; }
        .cv-classic .cv-doc-section { margin: 16px 0 22px; }
        .cv-classic .cv-doc-section h2 { padding-bottom: 5px; color: #172554; border-bottom: 1px solid #cbd5e1; font-size: 12px; font-weight: 500; letter-spacing: .16em; }
        .cv-classic .cv-experience-row { display: flex; justify-content: space-between; gap: 16px; }
        .cv-classic .cv-experience-period { flex-shrink: 0; color: #475569; }
        .cv-document.cv-serif { font-family: Georgia, serif; }
        .cv-doc-header { display: flex; align-items: center; gap: 20px; border-bottom: 2px solid var(--cv-accent); padding-bottom: 14px; margin-bottom: 16px; }
        .cv-doc-header img { width: 90px; height: 120px; object-fit: cover; }
        .cv-doc-header h1 { margin: 0 0 6px; font-size: 27px; color: var(--cv-accent); }
        .cv-doc-header p { margin: 0; color: #475569; }
        .cv-doc-body { display: block; }
        .cv-doc-sidebar { display: none; }
        .cv-document.cv-horizon .cv-doc-header { margin: 0 0 22px; padding: 14px 0 18px 16px; color: #111827; background: transparent; border: 0; border-bottom: 1px solid #dbe3f0; border-left: 4px solid var(--cv-accent); }
        .cv-document.cv-horizon .cv-doc-header img { border-radius: 6px; }
        .cv-document.cv-horizon .cv-doc-header h1 { color: #172554; }
        .cv-document.cv-horizon .cv-doc-header p { color: #475569; }
        .cv-document.cv-horizon .cv-doc-section h2 { padding-bottom: 5px; border-bottom: 1px solid #dbe3f0; color: var(--cv-accent); }
        .cv-document.cv-editorial { background: #fffdf8; }
        .cv-document.cv-editorial .cv-doc-header { border: 0; padding-bottom: 24px; }
        .cv-document.cv-editorial .cv-doc-header h1, .cv-document.cv-plum .cv-doc-header h1 { font-family: Georgia, serif; }
        .cv-document.cv-editorial .cv-doc-header h1 { font-size: 34px; }
        .cv-document.cv-editorial .cv-doc-section h2 { border-bottom: 1px solid #e7cda5; }
        .cv-document.cv-sidebar .cv-doc-header { margin: -32px -32px 20px; padding: 25px 32px; color: white; background: linear-gradient(110deg, #1d4ed8, #60a5fa); border: 0; }
        .cv-document.cv-sidebar .cv-doc-header h1, .cv-document.cv-sidebar .cv-doc-header p { color: white; }
        .cv-document.cv-sidebar .cv-doc-header img { border: 3px solid white; }
        .cv-document.cv-graphite .cv-doc-header { border-bottom: 5px solid #252a32; padding-bottom: 18px; }
        .cv-document.cv-graphite .cv-doc-body { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
        .cv-document.cv-graphite .cv-doc-sidebar { display: block; align-self: stretch; padding: 16px; background: #252a32; color: white; }
        .cv-document.cv-graphite .cv-doc-sidebar h2 { padding: 6px 8px; color: #252a32; background: #f3f4f6; border: 0; }
        .cv-document.cv-graphite .cv-doc-sidebar p { color: #f3f4f6; }
        .cv-document.cv-graphite .cv-doc-section h2 { padding: 6px 9px; background: #f3f4f6; border: 0; }
        .cv-document.cv-teal { background: #f5fbfa; }
        .cv-document.cv-teal .cv-doc-header { border-bottom: 0; border-top: 5px solid var(--cv-accent); padding-top: 18px; }
        .cv-document.cv-teal .cv-doc-section h2 { border-left: 4px solid var(--cv-accent); border-bottom: 0; padding-left: 8px; }
        .cv-document.cv-sidebar .cv-doc-body, .cv-document.cv-emerald .cv-doc-body, .cv-document.cv-plum .cv-doc-body { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
        .cv-document.cv-sidebar .cv-doc-sidebar, .cv-document.cv-emerald .cv-doc-sidebar, .cv-document.cv-plum .cv-doc-sidebar { display: block; align-self: start; min-height: 100%; padding: 16px; background: color-mix(in srgb, var(--cv-accent) 9%, white); }
        .cv-document.cv-sidebar .cv-doc-header { border-bottom: 4px solid #2563EB; }
        .cv-document.cv-emerald { background: #fbfefc; }
        .cv-document.cv-emerald .cv-doc-header { margin: -32px -32px 20px; padding: 25px 32px; background: #ecfdf5; border-bottom: 3px solid #047857; }
        .cv-document.cv-emerald .cv-doc-header img { border-radius: 50%; border: 3px solid #047857; }
        .cv-document.cv-emerald .cv-doc-sidebar { background: #047857; color: white; }
        .cv-document.cv-emerald .cv-doc-sidebar h2 { color: white; border-color: #6ee7b7; }
        .cv-document.cv-emerald .cv-doc-sidebar p { color: #ecfdf5; }
        .cv-document.cv-plum .cv-doc-sidebar { background: #eee9f0; }
        .cv-document.cv-plum .cv-doc-header { margin: -32px -32px 20px; border-bottom: 0; background: linear-gradient(100deg, #e9dfea, #faf7fb); padding: 24px 32px; }
        .cv-document.cv-plum .cv-doc-section h2 { border-bottom-color: #d8cbdc; }
        .cv-doc-section { margin: 13px 0; break-inside: avoid; }
        .cv-doc-section h2 { margin: 0 0 5px; padding-bottom: 3px; border-bottom: 1px solid #cbd5e1; color: var(--cv-accent); font-size: 12px; letter-spacing: .05em; }
        .cv-doc-section p { margin: 4px 0; white-space: pre-wrap; }
        .cv-year-row { display: flex; justify-content: space-between; gap: 16px; }
        .cv-year-value { flex-shrink: 0; color: #475569; text-align: right; }
        .cv-print-only { display: none; }
        @media print {
          @page { size: A4; margin: 16mm; }
          body * { visibility: hidden !important; }
          .cv-print-only, .cv-print-only * { visibility: visible !important; }
          .cv-print-only { display: block !important; position: absolute; inset: 0; padding: 16mm; color: #111827; background: white; font: 10pt/1.45 Arial, sans-serif; }
          .cv-document.cv-print-only { max-width: none; min-height: 0; padding: 0; box-shadow: none; font-size: 10pt; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .cv-document.cv-classic.cv-print-only { padding: 0; box-shadow: none; }
          .cv-classic.cv-document { box-shadow: none; }
          .cv-document.cv-print-only.cv-horizon .cv-doc-header { margin: 0 0 16px; padding: 12px 0 12px 12px; }
          .cv-document.cv-print-only .cv-doc-header { margin: 0 0 14px; padding: 12px; }
          .cv-doc-header img { width: 30mm; height: 40mm; }
          .cv-doc-header h1 { font-size: 22pt; }
        }
      `}</style>
    </div>
  );
}

type CVTemplate = (typeof CV_TEMPLATES)[number];

function CVDocument({ data, template, print = false }: { data: CVData; template: CVTemplate; print?: boolean }) {
  const style = { "--cv-accent": `#${template.accent}` } as React.CSSProperties;
  const summary = data.summary && <PrintSection title="RINGKASAN"><p>{data.summary}</p></PrintSection>;
  const skills = data.skills && <PrintSection title="SKILLS"><p>{data.skills}</p></PrintSection>;
  const educationItems = data.education.filter((e) => e.school || e.major || e.year);
  const experienceItems = data.experience.filter((e) => e.title || e.org || e.desc);
  const certificationItems = data.certifications.filter((c) => c.name || c.issuer || c.year);
  const languageItems = data.languages.filter((l) => l.name || l.proficiency);
  const organizationItems = data.organizations.filter((o) => o.role || o.org || o.desc);
  const projectItems = data.projects.filter((p) => p.name || p.desc || p.link);
  const education = educationItems.length > 0 && <PrintSection title="PENDIDIKAN">{educationItems.map((e, i) => <div key={i} className="cv-year-row"><span><b>{e.school}</b>{e.major && <span> — {e.major}</span>}</span><span className="cv-year-value">{e.year}</span></div>)}</PrintSection>;
  const experience = experienceItems.length > 0 && <PrintSection title="PENGALAMAN">{experienceItems.map((e, i) => <div key={i}><div className="cv-experience-row"><b>{e.title}{e.org && ` | ${e.org}`}</b><span className="cv-experience-period">{e.period}</span></div>{e.desc && <p>{e.desc}</p>}</div>)}</PrintSection>;
  const certifications = certificationItems.length > 0 && <PrintSection title="SERTIFIKASI">{certificationItems.map((c, i) => <div key={i} className="cv-year-row"><span><b>{c.name}</b>{c.issuer && <span> · {c.issuer}</span>}</span><span className="cv-year-value">{c.year}</span></div>)}</PrintSection>;
  const languages = languageItems.length > 0 && <PrintSection title="BAHASA">{languageItems.map((l, i) => <p key={i}>{l.name} · {l.proficiency}</p>)}</PrintSection>;
  const organizations = organizationItems.length > 0 && <PrintSection title="ORGANISASI">{organizationItems.map((o, i) => <div key={i}><div className="cv-year-row"><span><b>{o.role}</b>{o.org && <span> · {o.org}</span>}</span><span className="cv-year-value">{o.period}</span></div>{o.desc && <p>{o.desc}</p>}</div>)}</PrintSection>;
  const projects = projectItems.length > 0 && <PrintSection title="PROYEK / PORTOFOLIO">{projectItems.map((p, i) => <p key={i}><b>{p.name}</b>{p.link && ` · ${p.link}`}<br />{p.desc}</p>)}</PrintSection>;
  return (
    <div className={`cv-document cv-${template.id} ${template.serif ? "cv-serif" : ""} ${print ? "cv-print-only" : ""}`} style={style}>
      <header className="cv-doc-header">
        {data.photo && <img src={data.photo} alt="Foto profil" />}
        <div><h1>{data.name || "Nama"}</h1><p>{[data.email, data.phone, data.city, data.linkedin].filter(Boolean).join(" · ")}</p></div>
      </header>
      <div className="cv-doc-body">
        {template.sidebar && <aside className="cv-doc-sidebar">{summary}{skills}{languages}</aside>}
        <main>
          {!template.sidebar && template.id === "classic" ? <>
            {summary && <PrintSection title="PROFIL"><p>{data.summary}</p></PrintSection>}
            {experience}
            {education}
            {skills && <PrintSection title="KEAHLIAN"><p>{data.skills}</p></PrintSection>}
            {projects}
            {certifications}{languages}{organizations}
          </> : <>{!template.sidebar && <>{summary}{skills}</>}{education}{experience}{certifications}{!template.sidebar && languages}{organizations}{projects}</>}
        </main>
      </div>
    </div>
  );
}

function PrintSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="cv-doc-section"><h2>{title}</h2>{children}</section>;
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
