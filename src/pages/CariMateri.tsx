import { useState, useMemo, useEffect } from "react";
import { Search, FileText, Library, Upload, Loader2 } from "lucide-react";
import { getFromStorage } from "../lib/storage";
import { extractTextFromPDF } from "../lib/pdf";
import { FREE_LIMITS } from "../lib/limits";
import { Link } from "react-router-dom";

interface Hit {
  source: string;
  title: string;
  snippet: string;
  path?: string;
}

export default function CariMateri() {
  const [q, setQ] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [bank, setBank] = useState<any[]>([]);

  useEffect(() => {
    setNotes(getFromStorage("notes", []));
    setBank(getFromStorage("bank-soal", []));
  }, []);

  const hits = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (qq.length < 2) return [];
    const out: Hit[] = [];

    for (const n of notes) {
      const body = `${n.title || ""} ${n.content || ""}`;
      if (body.toLowerCase().includes(qq)) {
        const idx = body.toLowerCase().indexOf(qq);
        const snippet = body.slice(Math.max(0, idx - 40), idx + qq.length + 60);
        out.push({
          source: "Catatan",
          title: n.title || "Tanpa judul",
          snippet: "…" + snippet + "…",
          path: "/notes",
        });
      }
    }

    for (const b of bank) {
      const body = `${b.title} ${b.course} ${b.topic} ${b.content}`;
      if (body.toLowerCase().includes(qq)) {
        const idx = body.toLowerCase().indexOf(qq);
        const snippet = body.slice(Math.max(0, idx - 40), idx + qq.length + 60);
        out.push({
          source: b.type === "soal" ? "Bank soal" : "Bank materi",
          title: b.title,
          snippet: "…" + snippet + "…",
          path: "/bank",
        });
      }
    }

    if (pdfText && pdfText.toLowerCase().includes(qq)) {
      const idx = pdfText.toLowerCase().indexOf(qq);
      const snippet = pdfText.slice(Math.max(0, idx - 50), idx + qq.length + 80);
      out.push({
        source: "PDF",
        title: pdfName || "PDF upload",
        snippet: "…" + snippet.replace(/\s+/g, " ") + "…",
      });
    }

    return out.slice(0, 50);
  }, [q, notes, bank, pdfText, pdfName]);

  const onPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const text = await extractTextFromPDF(file, FREE_LIMITS.pdfMaxChars + 1);
      if (!text.trim()) throw new Error("PDF tidak berisi teks (mungkin scan).");
      setPdfText(text);
      setPdfName(file.name);
    } catch (err: any) {
      setError(err.message || "Gagal baca PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="text-blue-500" size={26} />
          Cari Materi Cepat
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Cari di catatan, bank soal/materi, dan PDF yang di-upload
        </p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ketik kata kunci (min. 2 huruf)..."
          className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm px-4 py-2 border border-dashed border-blue-300 dark:border-blue-700 rounded-xl text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {loading ? "Membaca PDF..." : "Tambah PDF ke pencarian"}
          <input type="file" accept="application/pdf" className="hidden" onChange={onPdf} />
        </label>
        {pdfName && <span className="text-xs text-gray-500">📄 {pdfName}</span>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        {q.trim().length >= 2 && hits.length === 0 && (
          <p className="text-center text-gray-400 py-10 text-sm">
            Tidak ketemu. Tambah catatan, isi bank materi, atau upload PDF.
          </p>
        )}
        {hits.map((h, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {h.source === "Catatan" ? <FileText size={12} /> : <Library size={12} />}
              {h.source}
              {h.path && (
                <Link to={h.path} className="text-blue-600 ml-auto hover:underline">
                  Buka
                </Link>
              )}
            </div>
            <p className="font-medium text-sm mt-1">{h.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{h.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
