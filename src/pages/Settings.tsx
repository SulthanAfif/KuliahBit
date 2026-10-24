import { usePlan } from "../context/PlanContext";
import { useTheme } from "../context/ThemeContext";
import { removeFromStorage } from "../lib/storage";

export default function Settings() {
  const { isPro, expiresAt } = usePlan();
  const { theme, toggleTheme } = useTheme();

  const handleClearAll = () => {
    if (confirm("Hapus SEMUA data (tugas, flashcard, quiz, catatan, dll)? Tidak bisa dibatalkan.")) {
      ["tasks", "courses", "flashcard-sets", "quiz-sets", "notes", "opp-tracker", "skripsi-progress", "skripsi-judul", "ai-usage-today", "ai-usage-monthly", "ipk-items", "schedule-items", "citations", "agenda-items", "habits", "attendance", "cv-data", "bank-soal-materi", "pdf-search-cache"].forEach(
        removeFromStorage
      );
      alert("Semua data dihapus. Refresh halaman.");
      window.location.reload();
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.tasks) localStorage.setItem("tasks", JSON.stringify(data.tasks));
        if (data.flashcards) localStorage.setItem("flashcard-sets", JSON.stringify(data.flashcards));
        if (data.quiz) localStorage.setItem("quiz-sets", JSON.stringify(data.quiz));
        if (data.notes) localStorage.setItem("notes", JSON.stringify(data.notes));
        if (data.opportunities) localStorage.setItem("opp-tracker", JSON.stringify(data.opportunities));
        if (data["opp-tracker"]) localStorage.setItem("opp-tracker", JSON.stringify(data["opp-tracker"]));
        if (data.skripsi) localStorage.setItem("skripsi-progress", JSON.stringify(data.skripsi));
        alert("Import berhasil! Refresh halaman.");
        window.location.reload();
      } catch {
        alert("File tidak valid");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl divide-y divide-gray-200 dark:divide-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium">Tema</p>
            <p className="text-sm text-gray-500">Saat ini: {theme === "dark" ? "Gelap" : "Terang"}</p>
          </div>
          <button onClick={toggleTheme} className="px-4 py-2 rounded-lg border text-sm">
            Ganti
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium">Paket</p>
            <p className="text-sm text-gray-500">{isPro ? `Pro aktif sampai ${new Date(expiresAt!).toLocaleDateString("id-ID")}` : "Free"}</p>
          </div>
        </div>

        <div className="p-4">
          <p className="font-medium mb-2">Import Data</p>
          <input type="file" accept=".json" onChange={handleImport} className="text-sm" />
        </div>

        <div className="p-4">
          <p className="font-medium mb-1">Hapus Semua Data</p>
          <p className="text-sm text-gray-500 mb-3">Menghapus semua data di browser ini</p>
          <button onClick={handleClearAll} className="px-4 py-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 text-sm border border-red-200 dark:border-red-800">
            Hapus Semua
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        KuliahBit v1.0 — Dibuat untuk mahasiswa Indonesia
      </p>
    </div>
  );
}
