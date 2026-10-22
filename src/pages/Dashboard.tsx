import { Link } from "react-router-dom";
import {
  CheckSquare,
  Layers,
  HelpCircle,
  Sparkles,
  BookOpen,
  FileText,
  Crown,
  TrendingUp,
  Calculator,
  Calendar,
  Timer,
  BookMarked,
  AlarmClock,
  Flame,
  UserCheck,
  FileOutput,
  Target,
  RefreshCw,
  Presentation,
  ListOrdered,
  Zap,
  Mail,
  Briefcase,
  Search,
  Archive,
  FileCheck,
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
    { title: "Tugas & Deadline", desc: "Kelola tugas kuliah dan deadline", icon: CheckSquare, path: "/tugas", color: "from-blue-500 to-blue-600" },
    { title: "Prioritas Malam Ini", desc: "Urutan tugas paling gawat", icon: ListOrdered, path: "/prioritas", color: "from-amber-400 to-amber-500" },
    { title: "Jadwal Kuliah", desc: "Jadwal mingguan visual", icon: Calendar, path: "/jadwal", color: "from-indigo-500 to-indigo-600" },
    { title: "Agenda & Countdown", desc: "UTS, UAS, deadline penting", icon: AlarmClock, path: "/agenda", color: "from-orange-500 to-orange-600" },
    { title: "Cari Materi", desc: "Cari di catatan & PDF", icon: Search, path: "/cari", color: "from-blue-500 to-blue-600" },
    { title: "Bank Soal & Materi", desc: "Arsip per matkul & topik", icon: Archive, path: "/bank", color: "from-orange-500 to-orange-600" },
    { title: "Nilai Akhir", desc: "Bobot tugas/UTS/UAS + minimal", icon: Calculator, path: "/nilai-akhir", color: "from-cyan-500 to-blue-500" },
    { title: "Flashcards", desc: "Buat & pelajari kartu hafalan", icon: Layers, path: "/flashcards", color: "from-violet-500 to-violet-600" },
    { title: "Quiz", desc: "Latihan soal pilihan ganda", icon: HelpCircle, path: "/quiz", color: "from-green-500 to-green-600" },
    { title: "Ringkas AI", desc: aiReady ? "AI real (Groq) aktif" : "Ringkas materi & generate soal", icon: Sparkles, path: "/ringkas", color: "from-purple-500 to-purple-600" },
    { title: "Mode Cram", desc: "Rencana belajar sisa beberapa jam", icon: Zap, path: "/cram", color: "from-yellow-400 to-yellow-500" },
    { title: "Kalkulator IPK", desc: "Hitung IPK + prediksi target", icon: Calculator, path: "/ipk", color: "from-cyan-500 to-cyan-600" },
    { title: "Nilai Minimal UAS", desc: "Bobot tugas, UTS, UAS → target", icon: Target, path: "/nilai-minimal", color: "from-cyan-400 to-cyan-500" },
    { title: "Cek Format Tugas", desc: "Struktur, sitasi, daftar pustaka", icon: FileCheck, path: "/format-tugas", color: "from-emerald-600 to-emerald-700" },
    { title: "Surat Kilat", desc: "Izin, cuti, perpanjang tugas", icon: Mail, path: "/surat", color: "from-blue-400 to-blue-500" },
    { title: "CV & Portofolio", desc: "Susun CV siap kerja", icon: Briefcase, path: "/cv", color: "from-slate-600 to-slate-700" },
    { title: "Buat Presentasi", desc: "Edit slide + unduh file .pptx", icon: Presentation, path: "/slides", color: "from-rose-500 to-rose-600" },
    { title: "Outline Slide", desc: "Kerangka PowerPoint dari materi", icon: Presentation, path: "/outline", color: "from-pink-400 to-pink-500" },
    { title: "Parafrase", desc: "Rapikan kalimat (bukan plagiat)", icon: RefreshCw, path: "/parafrase", color: "from-indigo-400 to-indigo-500" },
    { title: "Helper Makalah", desc: "Hitung kata + checklist struktur", icon: FileText, path: "/makalah", color: "from-sky-500 to-sky-600" },
    { title: "Konverter File", desc: "PDF, Word, CSV, Excel", icon: FileOutput, path: "/converter", color: "from-violet-500 to-violet-600" },
    { title: "Daftar Pustaka", desc: "APA, MLA, Chicago, Harvard", icon: BookMarked, path: "/citation", color: "from-teal-500 to-teal-600" },
    { title: "Focus Timer", desc: "Pomodoro 25 menit fokus", icon: Timer, path: "/pomodoro", color: "from-red-500 to-red-600" },
    { title: "Study Streak", desc: "Kebiasaan belajar + streak harian", icon: Flame, path: "/habit", color: "from-orange-400 to-orange-500" },
    { title: "Absensi", desc: "Tracker kehadiran min 75%", icon: UserCheck, path: "/absensi", color: "from-emerald-500 to-emerald-600" },
    { title: "Skripsi", desc: "Tracker progress skripsi", icon: BookOpen, path: "/skripsi", color: "from-amber-500 to-amber-600" },
    { title: "Catatan", desc: "Catatan cepat + pencarian", icon: FileText, path: "/notes", color: "from-pink-500 to-pink-600" },
  ];



  return (
    <div className="w-full space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Selamat datang di KuliahBit — tools lengkap buat mahasiswa
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
              Unlimited AI, tanpa batas flashcard & quiz, cloud sync, dan fitur advanced lainnya.
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
