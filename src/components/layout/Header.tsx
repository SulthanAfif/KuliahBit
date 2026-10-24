import { Moon, Sun, Download, Crown, Menu, RotateCcw } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { usePlan } from "../../context/PlanContext";
import { getFromStorage } from "../../lib/storage";
import { Link, useLocation } from "react-router-dom";

const RESET_KEYS: Record<string, string[]> = {
  "/tugas": ["tasks", "draft-task-open", "draft-task-title", "draft-task-due-date", "draft-task-priority", "draft-task-course"],
  "/agenda": ["agenda-items", "draft-agenda-open", "draft-agenda-title", "draft-agenda-date", "draft-agenda-time", "draft-agenda-type", "draft-agenda-notes"],
  "/flashcards": ["flashcard-sets", "draft-flashcards-open", "draft-flashcards-title", "draft-flashcards-front", "draft-flashcards-back"],
  "/quiz": ["quiz-sets", "draft-quiz-open", "draft-quiz-title", "draft-quiz-question", "draft-quiz-options"],
  "/ringkas": ["draft-ringkas-text", "draft-ringkas-result"],
  "/tanya-ai": ["draft-tanya-ai-context", "draft-tanya-ai-messages", "draft-tanya-ai-input", "draft-tanya-ai-questions", "draft-tanya-ai-answer", "draft-tanya-ai-term", "draft-tanya-ai-term-result"],
  "/laporan-praktikum": ["draft-laporan-praktikum"],
  "/beasiswa": ["opp-tracker"],
  "/cram": ["draft-cram-text", "draft-cram-minutes", "draft-cram-result"],
  "/notes": ["notes", "draft-note-open", "draft-note-title", "draft-note-content"],
  "/slides": ["draft-slide-topic", "draft-slide-material", "draft-slide-content", "draft-slide-template", "draft-slide-layout", "draft-slide-font", "draft-slide-font-sizes"],
  "/cv": ["cv-data", "draft-cv-template"],
  "/surat": ["draft-surat-template", "draft-surat-values"],
  "/parafrase": ["draft-parafrase-text", "draft-parafrase-result", "draft-parafrase-style"],
  "/citation": ["citations", "draft-citation-style", "draft-citation-type", "draft-citation-authors", "draft-citation-title", "draft-citation-year", "draft-citation-publisher", "draft-citation-city", "draft-citation-journal", "draft-citation-volume", "draft-citation-issue", "draft-citation-pages", "draft-citation-url", "draft-citation-access-date", "draft-citation-university"],
  "/absensi": ["attendance"],
  "/bank-soal": ["bank-soal", "draft-bank-soal-open", "draft-bank-soal-type", "draft-bank-soal-title", "draft-bank-soal-course", "draft-bank-soal-topic", "draft-bank-soal-content"],
  "/jadwal": ["schedule-items"],
  "/ipk": ["ipk-items"],
  "/skripsi": ["skripsi-progress", "skripsi-judul"],
};

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { isPro } = usePlan();
  const { pathname } = useLocation();

  const handleExport = () => {
    const data = {
      courses: getFromStorage("courses", []),
      tasks: getFromStorage("tasks", []),
      flashcards: getFromStorage("flashcard-sets", []),
      quiz: getFromStorage("quiz-sets", []),
      notes: getFromStorage("notes", []),
      opportunities: getFromStorage("opp-tracker", []),
      skripsi: getFromStorage("skripsi-progress", []),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kuliahbit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleReset = () => {
    if (!window.confirm("Reset fitur ini? Data yang tersimpan di fitur ini akan dihapus.")) return;
    const keys = RESET_KEYS[pathname];
    if (!keys?.length) return;
    keys.forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white/90 px-3 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90 sm:px-6">
      <div className="flex min-w-0 items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <button onClick={onMenuClick} aria-label="Tampilkan atau sembunyikan navigasi" className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 md:hidden">
          <Menu size={18} />
        </button>
        {isPro ? (
          <span className="hidden items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400 sm:flex">
            <Crown size={15} /> Pro aktif
          </span>
        ) : (
          <span className="hidden sm:inline">Data tersimpan di browser kamu</span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {!isPro && (
          <Link
            to="/pricing"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:opacity-90 transition shadow-sm shadow-amber-500/20 sm:gap-1.5 sm:px-3 sm:text-sm"
          >
            <Crown size={14} />
            Upgrade
          </Link>
        )}

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          title="Export semua data"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>

        {pathname !== "/dashboard" && pathname !== "/settings" && pathname !== "/pricing" && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            title="Reset fitur yang sedang dibuka"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition"
          title="Ganti tema"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
}
