import { Link } from "react-router-dom";
import {
  CheckSquare,
  UserCheck,
  Layers,
  HelpCircle,
  Sparkles,
  FileText,
  Crown,
  TrendingUp,
  Calculator,
  AlarmClock,
  FileOutput,
  Presentation,
  Zap,
  BookMarked,
  RefreshCw,
  Mail,
  Briefcase,
} from "lucide-react";
import { usePlan } from "../context/PlanContext";
import { getFromStorage } from "../lib/storage";
import { useMemo } from "react";
import { hasAIKey } from "../lib/ai";

export default function Dashboard() {
  const { isPro } = usePlan();
  const aiReady = hasAIKey();

  const stats = useMemo(() => {
    const tasks = getFromStorage<any[]>("tasks", []);
    const sets = getFromStorage<any[]>("flashcard-sets", []);
    const quizzes = getFromStorage<any[]>("quiz-sets", []);
    const notes = getFromStorage<any[]>("notes", []);
    const pending = tasks.filter((t) => t.status !== "done").length;
    const totalCards = sets.reduce((acc, s) => acc + (s.cards?.length || 0), 0);
    return { pending, totalCards, quizzes: quizzes.length, notes: notes.length };
  }, []);

  const menus = [
    { title: "Tugas", desc: "Deadline & checklist tugas", icon: CheckSquare,
  UserCheck, path: "/tugas", color: "from-blue-500 to-blue-600" },
    { title: "Deadline", desc: "Countdown UTS / pengumpulan", icon: AlarmClock, path: "/agenda", color: "from-orange-500 to-orange-600" },
    { title: "Flashcards", desc: "Hafalan kartu", icon: Layers, path: "/flashcards", color: "from-violet-500 to-violet-600" },
    { title: "Kuis", desc: "Latihan soal", icon: HelpCircle, path: "/quiz", color: "from-green-500 to-green-600" },
    { title: "Ringkas AI", desc: aiReady ? "AI aktif" : "Ringkas materi / PDF", icon: Sparkles, path: "/ringkas", color: "from-purple-500 to-purple-600" },
    { title: "Mode Cram", desc: "Rencana belajar kilat", icon: Zap, path: "/cram", color: "from-yellow-500 to-amber-500" },
    { title: "Catatan", desc: "Catatan cepat", icon: FileText, path: "/notes", color: "from-pink-500 to-pink-600" },
    { title: "Konverter", desc: "PDF, Word, CSV, Excel", icon: FileOutput, path: "/converter", color: "from-violet-500 to-indigo-600" },
    { title: "Hitung Nilai", desc: "Bobot tugas / UTS / UAS", icon: Calculator, path: "/nilai-akhir", color: "from-cyan-500 to-cyan-600" },
    { title: "Slide PPT", desc: "Buat & unduh .pptx", icon: Presentation, path: "/slides", color: "from-rose-500 to-rose-600" },
    { title: "CV", desc: "Susun CV magang/kerja", icon: Briefcase, path: "/cv", color: "from-slate-500 to-slate-700" },
    { title: "Surat Kilat", desc: "Template izin & permohonan", icon: Mail, path: "/surat", color: "from-blue-400 to-blue-500" },
    { title: "Parafrase", desc: "Rapikan kalimat", icon: RefreshCw, path: "/parafrase", color: "from-indigo-400 to-indigo-500" },
    { title: "Daftar Pustaka", desc: "APA, MLA, Chicago, Harvard", icon: BookMarked, path: "/citation", color: "from-teal-500 to-teal-600" },
  ];



  return (
    <div className="w-full space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tools belajar & tugas — bukan portal kampus
          </p>
        </div>
        {!isPro && (
          <Link
            to="/pricing"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium hover:opacity-90 shadow-sm shadow-amber-500/20"
          >
            <Crown size={16} />
            Upgrade ke Pro
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tugas Pending", value: stats.pending },
          { label: "Flashcards", value: stats.totalCards },
          { label: "Kuis", value: stats.quizzes },
          { label: "Catatan", value: stats.notes },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {menus.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.path}
              to={m.path}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition group shadow-sm"
            >
              <div
                className={`w-11 h-11 bg-gradient-to-br ${m.color} rounded-xl flex items-center justify-center text-white mb-3 shadow-sm`}
              >
                <Icon size={22} />
              </div>
              <h3 className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                {m.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{m.desc}</p>
            </Link>
          );
        })}
      </div>

      {!isPro && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900 rounded-2xl p-5 flex items-start gap-4">
          <TrendingUp className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={22} />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Upgrade ke Pro</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              AI, flashcard, kuis, bank soal, dan catatan tanpa kuota bulanan, dengan impor PDF yang lebih besar.
            </p>
            <Link
              to="/pricing"
              className="inline-block mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Lihat paket Pro →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
