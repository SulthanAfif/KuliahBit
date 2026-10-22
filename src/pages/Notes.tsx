import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Download } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import type { Note } from "../types";
import { v4 as uuid } from "uuid";
import { Link, useNavigate } from "react-router-dom";
import { usePlan } from "../context/PlanContext";
import { canAddNote } from "../lib/limits";

export default function Notes() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setNotes(getFromStorage("notes", []));
  }, []);
  useEffect(() => {
    saveToStorage("notes", notes);
  }, [notes]);

  const selected = notes.find((n) => n.id === selectedId);
  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!title.trim()) return;
    if (!canAddNote(isPro, notes.length)) {
      navigate("/pricing");
      return;
    }
    const note: Note = {
      id: uuid(),
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    };
    setNotes([note, ...notes]);
    setSelectedId(note.id);
    setIsCreating(false);
    setIsEditing(false);
    setTitle("");
    setContent("");
  };

  const handleUpdate = () => {
    if (!selected || !title.trim()) return;
    setNotes(
      notes.map((n) =>
        n.id === selected.id
          ? { ...n, title: title.trim(), content: content.trim(), updatedAt: new Date().toISOString() }
          : n
      )
    );
    setIsEditing(false);
  };

  const startEdit = () => {
    if (!selected) return;
    setTitle(selected.title);
    setContent(selected.content);
    setIsEditing(true);
  };

  const handleExport = () => {
    const backup = { notes, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kuliahbit-catatan-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4 md:h-[calc(100vh-8rem)] md:min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-3 dark:border-blue-900 dark:bg-blue-950/30 sm:px-4">
        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">Catatan tersimpan di browser ini. Export file untuk cadangan, lalu gunakan <Link to="/settings" className="font-semibold text-blue-600 underline dark:text-blue-400">Pengaturan → Import Data</Link> di perangkat lain. Data tidak tersinkron otomatis.</p>
        <button onClick={handleExport} disabled={notes.length === 0} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-gray-800" title="Export catatan sebagai cadangan">
          <Download size={14}/> <span className="hidden sm:inline">Export catatan</span><span className="sm:hidden">Export</span>
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
      <div className="flex max-h-[38vh] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:max-h-none md:w-72">
        <div className="flex gap-2 border-b border-gray-200 p-3 dark:border-gray-800">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari..."
            className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              setIsCreating(true);
              setSelectedId(null);
              setTitle("");
              setContent("");
              setIsEditing(true);
            }}
            className="p-1.5 bg-blue-600 text-white rounded-lg"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-400">Belum ada catatan</p>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  setSelectedId(n.id);
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                className={`p-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  selectedId === n.id ? "bg-blue-50 dark:bg-blue-950/40" : ""
                }`}
              >
                <div className="flex justify-between gap-2">
                  <h3 className="font-medium text-sm truncate">{n.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Hapus?")) {
                        setNotes(notes.filter((x) => x.id !== n.id));
                        if (selectedId === n.id) setSelectedId(null);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.content || "Kosong"}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex min-h-[45vh] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:min-h-0">
        {!selectedId && !isCreating ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Pilih atau buat catatan
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
              {isEditing ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Judul..."
                  className="flex-1 text-lg font-semibold bg-transparent outline-none"
                  autoFocus
                />
              ) : (
                <h2 className="flex-1 text-lg font-semibold">{selected?.title}</h2>
              )}
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={isCreating ? handleCreate : handleUpdate}
                    className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    <Save size={14} /> Simpan
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                    className="p-1.5 text-gray-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={startEdit} className="flex items-center gap-1 border px-3 py-1.5 rounded-lg text-sm">
                  <Edit2 size={14} /> Edit
                </button>
              )}
            </div>
            <div className="flex-1 p-4">
              {isEditing ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis catatan..."
                  className="w-full h-full resize-none outline-none bg-transparent leading-relaxed"
                />
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed text-sm">
                  {selected?.content || <span className="text-gray-400">Kosong</span>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
