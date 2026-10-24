import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Edit2, Save, X, Download, Search, FileText, Clock } from "lucide-react";
import { getFromStorage, saveToStorage, usePersistentState } from "../lib/storage";
import type { Note } from "../types";
import { v4 as uuid } from "uuid";
import { Link, useNavigate } from "react-router-dom";
import { usePlan } from "../context/PlanContext";
import { canAddNote, incrementFeatureUsage, getFeatureUsageThisMonth, FREE_LIMITS } from "../lib/limits";

export default function Notes() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>(() => getFromStorage("notes", []));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = usePersistentState("draft-note-open", false);
  const [isEditing, setIsEditing] = useState(isCreating);
  const [title, setTitle] = usePersistentState("draft-note-title", "");
  const [content, setContent] = usePersistentState("draft-note-content", "");
  const [search, setSearch] = useState("");

  useEffect(() => {
    saveToStorage("notes", notes);
  }, [notes]);

  const selected = notes.find((n) => n.id === selectedId);
  const hasUnsavedChanges = isEditing && (isCreating
    ? Boolean(title.trim() || content.trim())
    : Boolean(selected && (title !== selected.title || content !== selected.content)));
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return notes
      .filter((note) => (
        note.title.toLocaleLowerCase("id-ID").includes(query) ||
        note.content.toLocaleLowerCase("id-ID").includes(query)
      ))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, search]);

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
    setNotes((current) => [note, ...current]);
    if (!isPro) incrementFeatureUsage("notes");
    setSelectedId(note.id);
    setIsCreating(false);
    setIsEditing(false);
    setTitle("");
    setContent("");
  };

  const handleUpdate = () => {
    if (!selected || !title.trim()) return;
    const updatedNote = {
      ...selected,
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((current) => [updatedNote, ...current.filter((note) => note.id !== selected.id)]);
    setIsEditing(false);
  };

  const startEdit = () => {
    if (!selected) return;
    setTitle(selected.title);
    setContent(selected.content);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (isCreating) {
      setIsCreating(false);
      setSelectedId(null);
      setTitle("");
      setContent("");
      return;
    }
    if (selected) {
      setTitle(selected.title);
      setContent(selected.content);
    }
    setIsEditing(false);
  };

  const handleDelete = (note: Note) => {
    if (!confirm(`Hapus catatan "${note.title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setNotes((current) => current.filter((item) => item.id !== note.id));
    if (selectedId === note.id) {
      setSelectedId(null);
      setIsEditing(false);
      setTitle("");
      setContent("");
    }
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
        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">Catatan tersimpan di browser ini. Ekspor sebagai cadangan, lalu gunakan <Link to="/settings" className="font-semibold text-blue-600 underline dark:text-blue-400">Pengaturan → Import Data</Link> di perangkat lain. Data tidak tersinkron otomatis.</p>
        <button onClick={handleExport} disabled={notes.length === 0} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-gray-800" title="Export catatan sebagai cadangan">
          <Download size={14} /> <span className="hidden sm:inline">Export catatan</span><span className="sm:hidden">Export</span>
        </button>
      </div>
      {!isPro && <p className="-mt-2 text-xs text-gray-500">Catatan baru bulan ini: {getFeatureUsageThisMonth("notes")}/{FREE_LIMITS.notes}</p>}
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
        <aside className="flex max-h-[38vh] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:max-h-none md:w-72">
          <div className="border-b border-gray-200 p-3 dark:border-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Catatan <span className="font-normal text-gray-400">({notes.length})</span></h2>
              <button
                onClick={() => {
                  if (hasUnsavedChanges && !confirm("Buang perubahan catatan yang belum disimpan?")) return;
                  if (!canAddNote(isPro, notes.length)) { navigate("/pricing"); return; }
                  setIsCreating(true);
                  setSelectedId(null);
                  setTitle("");
                  setContent("");
                  setIsEditing(true);
                }}
                aria-label="Buat catatan baru"
                title="Buat catatan baru"
                className="rounded-lg bg-blue-600 p-1.5 text-white transition hover:bg-blue-700"
              >
                <Plus size={16} />
              </button>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 dark:border-gray-700">
              <Search size={15} className="shrink-0 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul atau isi..."
                aria-label="Cari catatan"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Hapus pencarian" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-gray-400">
                <FileText size={22} />
                <p>{search ? "Tidak ada catatan yang cocok." : "Belum ada catatan. Buat catatan pertamamu."}</p>
              </div>
            ) : (
              filtered.map((note) => (
                <div
                  key={note.id}
                  className={`relative border-b border-gray-100 p-3 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 ${
                    selectedId === note.id ? "bg-blue-50 dark:bg-blue-950/40" : ""
                  }`}
                >
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges && !confirm("Buang perubahan catatan yang belum disimpan?")) return;
                      setSelectedId(note.id);
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
                    aria-pressed={selectedId === note.id}
                    className="block w-full rounded text-left pr-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                  >
                    <h3 className="truncate text-sm font-medium">{note.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">{note.content || "Belum ada isi"}</p>
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock size={11} /> {new Date(note.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDelete(note)}
                    aria-label={`Hapus catatan ${note.title}`}
                    title="Hapus catatan"
                    className="absolute right-3 top-3 rounded p-0.5 text-gray-400 transition hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-[45vh] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:min-h-0">
          {!selectedId && !isCreating ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-gray-400">
              <FileText size={28} />
              <p>Pilih catatan untuk dibaca atau buat catatan baru.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-800">
                {isEditing ? (
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Judul catatan..."
                    aria-label="Judul catatan"
                    className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none"
                    autoFocus
                  />
                ) : (
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold">{selected?.title}</h2>
                    {selected && (
                      <p className="mt-1 text-xs text-gray-400">
                        Diperbarui {new Date(selected.updatedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    )}
                  </div>
                )}
                {isEditing ? (
                  <div className="flex shrink-0 items-center gap-2">
                    {hasUnsavedChanges && <span className="hidden text-xs text-amber-600 sm:inline dark:text-amber-400">Belum disimpan</span>}
                    <button
                      onClick={isCreating ? handleCreate : handleUpdate}
                      disabled={!title.trim()}
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={14} /> Simpan
                    </button>
                    <button onClick={cancelEditing} aria-label="Batalkan edit" title="Batalkan edit" className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button onClick={startEdit} className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    <Edit2 size={14} /> Edit
                  </button>
                )}
              </div>
              <div className="min-h-0 flex-1 p-4">
                {isEditing ? (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tulis catatan di sini..."
                    aria-label="Isi catatan"
                    className="h-full min-h-40 w-full resize-none bg-transparent leading-relaxed outline-none"
                  />
                ) : (
                  <div className="h-full overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
                    {selected?.content || <span className="text-gray-400">Catatan ini belum memiliki isi.</span>}
                  </div>
                )}
                {isEditing && (
                  <p className="mt-2 text-right text-xs text-gray-400">{content.length.toLocaleString("id-ID")} karakter</p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
