import { useEffect, useMemo, useState } from "react";
import { BookMarked, Copy, Check, Plus, Trash2, Download, Search, Pencil, X } from "lucide-react";
import { getFromStorage, saveToStorage, usePersistentState } from "../lib/storage";
import { v4 as uuid } from "uuid";

type Style = "apa" | "mla" | "chicago" | "harvard";
type SourceType = "book" | "journal" | "website" | "skripsi";

interface CitationItem {
  id: string;
  type: SourceType;
  style: Style;
  // common fields
  authors: string; // "Nama Belakang, Nama Depan" or multiple separated by ;
  title: string;
  year: string;
  // book
  publisher?: string;
  city?: string;
  // journal
  journalName?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  // website
  url?: string;
  accessDate?: string;
  // skripsi
  university?: string;
  // result
  formatted: string;
}

const STYLES: { id: Style; label: string }[] = [
  { id: "apa", label: "APA 7th" },
  { id: "mla", label: "MLA 9th" },
  { id: "chicago", label: "Chicago" },
  { id: "harvard", label: "Harvard" },
];

const TYPES: { id: SourceType; label: string }[] = [
  { id: "book", label: "Buku" },
  { id: "journal", label: "Jurnal" },
  { id: "website", label: "Website" },
  { id: "skripsi", label: "Skripsi/Thesis" },
];

function formatCitation(
  type: SourceType,
  style: Style,
  data: {
    authors: string;
    title: string;
    year: string;
    publisher?: string;
    city?: string;
    journalName?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    url?: string;
    accessDate?: string;
    university?: string;
  }
): string {
  const authors = formatAuthors(data.authors, style);
  const title = data.title.trim();
  const year = data.year.trim() || "n.d.";

  if (style === "apa") {
    if (type === "book") {
      return `${authors ? `${authors}. ` : ""}(${year}). *${title}*. ${data.publisher?.trim() || ""}`;
    }
    if (type === "journal") {
      const vol = data.volume ? `*${data.volume}*` : "";
      const iss = data.issue ? `(${data.issue})` : "";
      const journalDetails = [vol + iss, data.pages ? data.pages : ""].filter(Boolean).join(", ");
      return `${authors ? `${authors}. ` : ""}(${year}). ${title}. *${data.journalName?.trim() || ""}*${journalDetails ? `, ${journalDetails}` : ""}.`;
    }
    if (type === "website") {
      return `${authors ? `${authors}. ` : ""}(${year}). *${title}*. ${data.url?.trim() || ""}${
        data.accessDate ? ` (Diakses ${data.accessDate.trim()})` : ""
      }`;
    }
    if (type === "skripsi") {
      return `${authors ? `${authors}. ` : ""}(${year}). *${title}* [Skripsi, ${data.university?.trim() || ""}].`;
    }
  }

  if (style === "mla") {
    if (type === "book") {
      return `${authors ? `${authors}. ` : ""}*${title}*. ${data.publisher?.trim() || ""}, ${year}.`;
    }
    if (type === "journal") {
      const details = [
        data.volume?.trim() ? `vol. ${data.volume.trim()}` : "",
        data.issue?.trim() ? `no. ${data.issue.trim()}` : "",
        year,
        data.pages?.trim() ? `pp. ${data.pages.trim()}` : "",
      ].filter(Boolean).join(", ");
      return `${authors ? `${authors}. ` : ""}"${title}." *${data.journalName?.trim() || ""}*${details ? `, ${details}` : ""}.`;
    }
    if (type === "website") {
      return `${authors ? `${authors}. ` : ""}"${title}." ${year}, ${data.url?.trim() || ""}.`;
    }
    if (type === "skripsi") {
      return `${authors ? `${authors}. ` : ""}*${title}*. ${year}. ${data.university?.trim() || ""}, Skripsi.`;
    }
  }

  if (style === "chicago") {
    if (type === "book") {
      const publication = [data.city?.trim(), data.publisher?.trim()].filter(Boolean).join(": ");
      return `${authors ? `${authors}. ` : ""}*${title}*. ${publication}${publication ? ", " : ""}${year}.`;
    }
    if (type === "journal") {
      const journalDetails = [data.volume?.trim(), data.issue?.trim() ? `no. ${data.issue.trim()}` : ""].filter(Boolean).join(", ");
      return `${authors ? `${authors}. ` : ""}"${title}." *${data.journalName?.trim() || ""}*${journalDetails ? ` ${journalDetails}` : ""} (${year})${data.pages?.trim() ? `: ${data.pages.trim()}` : ""}.`;
    }
    if (type === "website") {
      return `${authors ? `${authors}. ` : ""}"${title}."${data.accessDate ? ` Accessed ${data.accessDate.trim()}.` : ""} ${data.url?.trim() || ""}.`;
    }
    if (type === "skripsi") {
      return `${authors ? `${authors}. ` : ""}"${title}." Skripsi, ${data.university?.trim() || ""}, ${year}.`;
    }
  }

  // Harvard
  if (type === "book") {
    const publication = [data.city?.trim(), data.publisher?.trim()].filter(Boolean).join(": ");
    return `${authors ? `${authors} ` : ""}(${year}) *${title}*${publication ? `. ${publication}` : ""}.`;
  }
  if (type === "journal") {
    const issue = data.issue?.trim() ? `(${data.issue.trim()})` : "";
    const pages = data.pages?.trim() ? `, pp. ${data.pages.trim()}` : "";
    return `${authors ? `${authors} ` : ""}(${year}) '${title}', *${data.journalName?.trim() || ""}*${data.volume ? `, ${data.volume.trim()}${issue}` : issue}${pages}.`;
  }
  if (type === "website") {
    return `${authors ? `${authors} ` : ""}(${year}) *${title}*. Available at: ${data.url?.trim() || ""}${data.accessDate ? ` (Accessed: ${data.accessDate.trim()})` : ""}.`;
  }
  return `${authors ? `${authors} ` : ""}(${year}) *${title}*. Skripsi. ${data.university?.trim() || ""}.`;
}

function formatAuthors(value: string, style: Style): string {
  const authors = value.split(/[;\n]+/).map((author) => author.trim()).filter(Boolean);
  if (!authors.length) return "";
  const normalized = authors.map((author) => {
    const [lastName, ...givenNames] = author.split(",").map((part) => part.trim());
    if (!givenNames.length) return lastName;
    if (style === "apa") {
      const initials = givenNames.join(" ").split(/\s+/).filter(Boolean).map((name) => `${name[0].toLocaleUpperCase("id-ID")}.`).join(" ");
      return `${lastName}, ${initials}`;
    }
    return `${givenNames.join(" ")} ${lastName}`;
  });
  if (normalized.length === 1) return normalized[0];
  if (style === "apa") return `${normalized.slice(0, -1).join(", ")}, & ${normalized.at(-1)}`;
  return `${normalized.slice(0, -1).join(", ")}, and ${normalized.at(-1)}`;
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function Citation() {
  const [style, setStyle] = usePersistentState<Style>("draft-citation-style", "apa");
  const [type, setType] = usePersistentState<SourceType>("draft-citation-type", "book");
  const [authors, setAuthors] = usePersistentState("draft-citation-authors", "");
  const [title, setTitle] = usePersistentState("draft-citation-title", "");
  const [year, setYear] = usePersistentState("draft-citation-year", "");
  const [publisher, setPublisher] = usePersistentState("draft-citation-publisher", "");
  const [city, setCity] = usePersistentState("draft-citation-city", "");
  const [journalName, setJournalName] = usePersistentState("draft-citation-journal", "");
  const [volume, setVolume] = usePersistentState("draft-citation-volume", "");
  const [issue, setIssue] = usePersistentState("draft-citation-issue", "");
  const [pages, setPages] = usePersistentState("draft-citation-pages", "");
  const [url, setUrl] = usePersistentState("draft-citation-url", "");
  const [accessDate, setAccessDate] = usePersistentState("draft-citation-access-date", "");
  const [university, setUniversity] = usePersistentState("draft-citation-university", "");
  const [preview, setPreview] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<CitationItem[]>(() =>
    getFromStorage("citations", [])
  );
  const visibleSaved = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return saved
      .filter((item) => `${item.title} ${item.authors} ${item.formatted}`.toLocaleLowerCase("id-ID").includes(query))
      .sort((a, b) => (a.authors || a.title).localeCompare(b.authors || b.title, "id-ID"));
  }, [saved, search]);

  const getValidationError = () => {
    if (!title.trim()) {
      return "Judul sumber wajib diisi.";
    }
    if (year.trim() && !/^(?:\d{4}|n\.?d\.?)$/i.test(year.trim())) {
      return "Isi tahun dengan empat angka atau gunakan n.d. jika tidak diketahui.";
    }
    if (type === "book" && !publisher.trim()) {
      return "Nama penerbit wajib diisi untuk referensi buku.";
    }
    if (type === "journal" && !journalName.trim()) {
      return "Nama jurnal wajib diisi.";
    }
    if (type === "website" && !isValidUrl(url.trim())) {
      return "Masukkan URL website lengkap yang diawali http:// atau https://.";
    }
    if (type === "skripsi" && !university.trim()) {
      return "Nama universitas wajib diisi untuk referensi skripsi.";
    }
    return "";
  };

  const citationData = () => ({
    authors,
    title,
    year,
    publisher,
    city,
    journalName,
    volume,
    issue,
    pages,
    url,
    accessDate,
    university,
  });

  useEffect(() => {
    if (!preview) return;
    if (getValidationError()) {
      setPreview("");
      setCopied(false);
      return;
    }
    setPreview(formatCitation(type, style, citationData()));
    setCopied(false);
  }, [
    authors,
    title,
    year,
    publisher,
    city,
    journalName,
    volume,
    issue,
    pages,
    url,
    accessDate,
    university,
    type,
    style,
  ]);

  const generate = () => {
    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }
    setPreview(formatCitation(type, style, citationData()));
    setCopied(false);
    setError("");
    setNotice("");
  };

  const handleCopy = async () => {
    if (!preview) return;
    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }
    const formatted = formatCitation(type, style, citationData());
    setPreview(formatted);
    try {
      await navigator.clipboard.writeText(formatted.replace(/\*/g, ""));
      setCopied(true);
      setNotice("Referensi disalin ke clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Tidak dapat menyalin. Periksa izin clipboard browser.");
    }
  };

  const handleSave = () => {
    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }
    const formatted = formatCitation(type, style, citationData());
    setPreview(formatted);
    const item: CitationItem = {
      id: editingId ?? uuid(),
      type,
      style,
      authors,
      title,
      year,
      publisher,
      city,
      journalName,
      volume,
      issue,
      pages,
      url,
      accessDate,
      university,
      formatted,
    };
    const next = editingId
      ? saved.map((entry) => entry.id === editingId ? item : entry)
      : [item, ...saved];
    setSaved(next);
    saveToStorage("citations", next);
    setEditingId(null);
    setNotice(editingId ? "Referensi diperbarui." : "Referensi disimpan.");
  };

  const handleDelete = (id: string) => {
    const next = saved.filter((c) => c.id !== id);
    setSaved(next);
    saveToStorage("citations", next);
  };

  const editSaved = (item: CitationItem) => {
    setEditingId(item.id);
    setStyle(item.style);
    setType(item.type);
    setAuthors(item.authors);
    setTitle(item.title);
    setYear(item.year);
    setPublisher(item.publisher ?? "");
    setCity(item.city ?? "");
    setJournalName(item.journalName ?? "");
    setVolume(item.volume ?? "");
    setIssue(item.issue ?? "");
    setPages(item.pages ?? "");
    setUrl(item.url ?? "");
    setAccessDate(item.accessDate ?? "");
    setUniversity(item.university ?? "");
    setPreview(item.formatted);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportBibliography = () => {
    if (!visibleSaved.length) return;
    const contents = visibleSaved.map((item) => item.formatted.replace(/\*/g, "")).join("\n\n");
    const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `daftar-pustaka-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookMarked className="text-teal-500" size={26} />
          Generator Daftar Pustaka
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          APA, MLA, Chicago, dan Harvard. Periksa kembali format akhir sesuai panduan kampus atau jurnal.
        </p>
      </div>

      {/* Style & Type */}
      <div className="flex flex-wrap gap-2">
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyle(s.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              style === s.id
                ? "bg-teal-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            aria-pressed={type === t.id}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              type === t.id
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
        {editingId && <div className="flex items-center justify-between rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800 dark:bg-teal-950/40 dark:text-teal-200"><span>Mengedit referensi tersimpan</span><button onClick={() => { setEditingId(null); setPreview(""); }} aria-label="Batal edit referensi" className="rounded p-1 hover:bg-teal-100 dark:hover:bg-teal-900"><X size={15} /></button></div>}
        <input
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          aria-label="Nama penulis"
          placeholder="Penulis (pisahkan dengan titik koma; format: Siregar, Andi)"
          maxLength={500}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Judul sumber"
          maxLength={300}
          placeholder="Judul"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Tahun terbit"
          placeholder="Tahun terbit (opsional; contoh: 2024)"
          inputMode="numeric"
          maxLength={4}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />

        {type === "book" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              aria-label="Penerbit"
              placeholder="Penerbit"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label="Kota terbit"
              placeholder="Kota"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
        )}

        {type === "journal" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={journalName}
              onChange={(e) => setJournalName(e.target.value)}
              aria-label="Nama jurnal"
              placeholder="Nama jurnal"
              className="sm:col-span-2 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <input
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              aria-label="Volume jurnal"
              placeholder="Volume"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <input
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              aria-label="Nomor jurnal"
              placeholder="Issue/Nomor"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <input
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              aria-label="Halaman jurnal"
              placeholder="Halaman (contoh: 12-28)"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
        )}

        {type === "website" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-label="URL sumber"
              type="url"
              placeholder="URL"
              className="sm:col-span-2 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <input
              value={accessDate}
              onChange={(e) => setAccessDate(e.target.value)}
              aria-label="Tanggal akses"
              type="date"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
        )}

        {type === "skripsi" && (
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            aria-label="Nama universitas"
            placeholder="Nama universitas"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={generate}
            className="bg-teal-600 text-white px-5 py-2.5 rounded-xl hover:bg-teal-700 text-sm font-medium"
          >
            Buat pratinjau
          </button>
          <p className="self-center text-xs text-gray-400">Penulis dan tahun boleh dikosongkan jika tidak diketahui.</p>
        </div>
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {notice && <p role="status" className="text-sm text-green-600 dark:text-green-400">{notice}</p>}
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <p className="break-words text-sm leading-relaxed italic">
            {preview.split("*").map((part, i) =>
              i % 2 === 1 ? <em key={i}>{part}</em> : <span key={i}>{part}</span>
            )}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              {copied ? "Disalin" : "Salin"}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
            >
              {editingId ? <Check size={14} /> : <Plus size={14} />} {editingId ? "Simpan perubahan" : "Simpan"}
            </button>
          </div>
        </div>
      )}

      {/* Saved list */}
      {saved.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium text-sm text-gray-500">Daftar referensi ({saved.length})</h3>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 dark:border-gray-700 dark:bg-gray-900">
                <Search size={14} className="text-gray-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Cari referensi tersimpan" placeholder="Cari..." className="w-24 bg-transparent py-1.5 text-sm outline-none sm:w-36" />
              </label>
              <button onClick={exportBibliography} disabled={!visibleSaved.length} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"><Download size={14} /> Ekspor daftar</button>
            </div>
          </div>
          {visibleSaved.length === 0 && <p className="py-5 text-center text-sm text-gray-400">Tidak ada referensi yang cocok.</p>}
          {visibleSaved.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex gap-3"
            >
              <p className="flex-1 text-sm leading-relaxed">
                {c.formatted.split("*").map((part, i) =>
                  i % 2 === 1 ? <em key={i}>{part}</em> : <span key={i}>{part}</span>
                )}
              </p>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(c.formatted.replace(/\*/g, ""));
                      setNotice("Referensi disalin ke clipboard.");
                    } catch {
                      setError("Tidak dapat menyalin. Periksa izin clipboard browser.");
                    }
                  }}
                  aria-label={`Salin referensi ${c.title}`}
                  className="p-1.5 text-gray-400 hover:text-teal-600"
                  title="Salin"
                >
                  <Copy size={14} />
                </button>
                <button onClick={() => editSaved(c)} aria-label={`Edit referensi ${c.title}`} className="p-1.5 text-gray-400 hover:text-blue-600" title="Edit"><Pencil size={14} /></button>
                <button
                  onClick={() => { if (confirm(`Hapus referensi "${c.title}"?`)) handleDelete(c.id); }}
                  aria-label={`Hapus referensi ${c.title}`}
                  className="p-1.5 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
