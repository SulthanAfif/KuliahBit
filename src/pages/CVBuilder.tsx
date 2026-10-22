import { useState, useEffect, useRef } from "react";
import { Briefcase, Download, Eye, Plus, Trash2 } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import { usePlan } from "../context/PlanContext";
import { Link } from "react-router-dom";

interface CVData {
  name: string;
  email: string;
  phone: string;
  city: string;
  summary: string;
  education: { school: string; major: string; year: string }[];
  experience: { title: string; org: string; period: string; desc: string }[];
  skills: string;
  projects: { name: string; desc: string; link: string }[];
}

const empty: CVData = {
  name: "",
  email: "",
  phone: "",
  city: "",
  summary: "",
  education: [{ school: "", major: "", year: "" }],
  experience: [{ title: "", org: "", period: "", desc: "" }],
  skills: "",
  projects: [{ name: "", desc: "", link: "" }],
};

export default function CVBuilder() {
  const { isPro } = usePlan();
  const [data, setData] = useState<CVData>(() => getFromStorage("cv-data", empty));
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveToStorage("cv-data", data);
  }, [data]);

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
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
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
    <div className="space-y-6 max-w-3xl">
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

      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Eye size={19} className="text-slate-600" /> Pratinjau CV</h2>
          <p className="mt-1 text-sm text-gray-500">Perubahan pada formulir langsung terlihat di pratinjau ini.</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-100 p-3 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div ref={previewRef} className="mx-auto min-h-[600px] w-full max-w-[800px] bg-white px-6 py-8 text-gray-800 shadow-sm sm:px-12 sm:py-12" style={{ fontFamily: "Arial, sans-serif" }}>
            <header className="border-b-2 border-slate-700 pb-5">
              <h3 className="break-words text-3xl font-bold tracking-tight text-slate-900">{data.name || "Nama Lengkap"}</h3>
              <p className="mt-2 break-words text-sm text-gray-600">{[data.email, data.phone, data.city].filter(Boolean).join(" | ") || "Email | Telepon | Kota"}</p>
            </header>
            {data.summary.trim() && <PreviewSection title="Profil">{data.summary}</PreviewSection>}
            {data.education.some((item) => item.school || item.major || item.year) && <PreviewSection title="Pendidikan">{data.education.filter((item) => item.school || item.major || item.year).map((item, index) => <div key={index} className="mb-3 break-inside-avoid"><p className="font-semibold">{item.school || "Institusi"}</p><p className="text-sm text-gray-600">{[item.major, item.year].filter(Boolean).join(" | ")}</p></div>)}</PreviewSection>}
            {data.experience.some((item) => item.title || item.org || item.period || item.desc) && <PreviewSection title="Pengalaman">{data.experience.filter((item) => item.title || item.org || item.period || item.desc).map((item, index) => <div key={index} className="mb-4 break-inside-avoid"><div className="flex flex-wrap justify-between gap-x-3"><p className="font-semibold">{item.title || "Posisi"}{item.org ? ` | ${item.org}` : ""}</p>{item.period && <p className="text-sm text-gray-500">{item.period}</p>}</div>{item.desc && <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{item.desc}</p>}</div>)}</PreviewSection>}
            {data.skills.trim() && <PreviewSection title="Keahlian">{data.skills}</PreviewSection>}
            {data.projects.some((item) => item.name || item.desc || item.link) && <PreviewSection title="Proyek dan Portofolio">{data.projects.filter((item) => item.name || item.desc || item.link).map((item, index) => <div key={index} className="mb-4 break-inside-avoid"><p className="break-words font-semibold">{item.name || "Proyek"}</p>{item.link && <p className="break-all text-sm text-blue-700">{item.link}</p>}{item.desc && <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{item.desc}</p>}</div>)}</PreviewSection>}
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

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid">
      <h4 className="mb-3 border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-700">{title}</h4>
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
