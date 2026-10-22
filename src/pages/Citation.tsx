import { useState } from "react";
import { BookMarked, Copy, Check, Plus, Trash2 } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
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
  const authors = data.authors.trim() || "Anonim";
  const title = data.title.trim() || "Tanpa judul";
  const year = data.year.trim() || "n.d.";

  if (style === "apa") {
    if (type === "book") {
      return `${authors}. (${year}). *${title}*. ${data.publisher || "Publisher"}.`;
    }
    if (type === "journal") {
      const vol = data.volume ? `*${data.volume}*` : "";
      const iss = data.issue ? `(${data.issue})` : "";
      const pg = data.pages ? `, ${data.pages}` : "";
      return `${authors}. (${year}). ${title}. *${data.journalName || "Journal"}*, ${vol}${iss}${pg}.`;
    }
    if (type === "website") {
      return `${authors}. (${year}). *${title}*. ${data.url || ""}${
        data.accessDate ? ` (Diakses ${data.accessDate})` : ""
      }`;
    }
    if (type === "skripsi") {
      return `${authors}. (${year}). *${title}* [Skripsi, ${
        data.university || "Universitas"
      }].`;
    }
  }

  if (style === "mla") {
    if (type === "book") {
      return `${authors}. *${title}*. ${data.publisher || "Publisher"}, ${year}.`;
    }
    if (type === "journal") {
      return `${authors}. "${title}." *${data.journalName || "Journal"}*, vol. ${
        data.volume || "?"
      }, no. ${data.issue || "?"}, ${year}, pp. ${data.pages || "?"}.`;
    }
    if (type === "website") {
      return `${authors}. "${title}." *Website*, ${year}, ${data.url || ""}.`;
    }
    if (type === "skripsi") {
      return `${authors}. *${title}*. ${year}. ${
        data.university || "Universitas"
      }, Skripsi.`;
    }
  }

  if (style === "chicago") {
    if (type === "book") {
      return `${authors}. *${title}*. ${data.city || "City"}: ${
        data.publisher || "Publisher"
      }, ${year}.`;
    }
    if (type === "journal") {
      return `${authors}. "${title}." *${data.journalName || "Journal"}* ${
        data.volume || "?"
      }, no. ${data.issue || "?"} (${year}): ${data.pages || "?"}.`;
    }
    if (type === "website") {
      return `${authors}. "${title}." Accessed ${
        data.accessDate || "n.d."
      }. ${data.url || ""}.`;
    }
    if (type === "skripsi") {
      return `${authors}. "${title}." Skripsi, ${
        data.university || "Universitas"
      }, ${year}.`;
    }
  }

  // Harvard
  if (type === "book") {
    return `${authors} (${year}) *${title}*. ${data.city || "City"}: ${
      data.publisher || "Publisher"
    }.`;
  }
  if (type === "journal") {
    return `${authors} (${year}) '${title}', *${
      data.journalName || "Journal"
    }*, ${data.volume || "?"}(${data.issue || "?"}), pp. ${data.pages || "?"}.`;
  }
  if (type === "website") {
    return `${authors} (${year}) *${title}*. Available at: ${
      data.url || ""
    } (Accessed: ${data.accessDate || "n.d."}).`;
  }
  return `${authors} (${year}) *${title}*. Skripsi. ${
    data.university || "Universitas"
  }.`;
}

export default function Citation() {
  const [style, setStyle] = useState<Style>("apa");
  const [type, setType] = useState<SourceType>("book");
  const [authors, setAuthors] = useState("");
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [publisher, setPublisher] = useState("");
  const [city, setCity] = useState("");
  const [journalName, setJournalName] = useState("");
  const [volume, setVolume] = useState("");
  const [issue, setIssue] = useState("");
  const [pages, setPages] = useState("");
  const [url, setUrl] = useState("");
  const [accessDate, setAccessDate] = useState("");
  const [university, setUniversity] = useState("");
  const [preview, setPreview] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<CitationItem[]>(() =>
    getFromStorage("citations", [])
  );

  const generate = () => {
    const formatted = formatCitation(type, style, {
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
    setPreview(formatted);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!preview) return;
    await navigator.clipboard.writeText(preview.replace(/\*/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!preview) return;
    const item: CitationItem = {
      id: uuid(),
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
      formatted: preview,
    };
    const next = [item, ...saved];
    setSaved(next);
    saveToStorage("citations", next);
  };

  const handleDelete = (id: string) => {
    const next = saved.filter((c) => c.id !== id);
    setSaved(next);
    saveToStorage("citations", next);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookMarked className="text-teal-500" size={26} />
          Generator Daftar Pustaka
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          APA, MLA, Chicago, Harvard — siap copy-paste ke makalah
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
        <input
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          placeholder="Penulis (contoh: Siregar, Andi atau Siregar, A.; Putri, B.)"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Tahun"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />

        {type === "book" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="Penerbit"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
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
              placeholder="Nama jurnal"
              className="sm:col-span-2 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <input
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="Volume"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <input
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Issue/Nomor"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <input
              value={pages}
              onChange={(e) => setPages(e.target.value)}
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
              placeholder="URL"
              className="sm:col-span-2 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <input
              value={accessDate}
              onChange={(e) => setAccessDate(e.target.value)}
              placeholder="Tanggal akses (contoh: 22 Oktober 2026)"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
        )}

        {type === "skripsi" && (
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="Nama universitas"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
        )}

        <button
          onClick={generate}
          className="bg-teal-600 text-white px-5 py-2.5 rounded-xl hover:bg-teal-700 text-sm font-medium"
        >
          Generate
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <p className="text-sm leading-relaxed italic">
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
              <Plus size={14} /> Simpan
            </button>
          </div>
        </div>
      )}

      {/* Saved list */}
      {saved.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-gray-500">Tersimpan ({saved.length})</h3>
          {saved.map((c) => (
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
                    await navigator.clipboard.writeText(c.formatted.replace(/\*/g, ""));
                  }}
                  className="p-1.5 text-gray-400 hover:text-teal-600"
                  title="Salin"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
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
