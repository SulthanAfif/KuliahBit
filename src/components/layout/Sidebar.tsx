import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Layers,
  HelpCircle,
  FileText,
  BookOpen,
  Sparkles,
  Crown,
  Settings,
  Calculator,
  Calendar,
  Timer,
  BookMarked,
  AlarmClock,
  Flame,
  UserCheck,
  FileOutput,
  Mail,
  Zap,
  ListOrdered,
  Presentation,
  RefreshCw,
  Target,
  FileCheck,
  Archive,
  Briefcase,
  Search,
} from "lucide-react";

import { usePlan } from "../../context/PlanContext";

const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tugas", label: "Tugas & Deadline", icon: CheckSquare },
  { path: "/jadwal", label: "Jadwal Kuliah", icon: Calendar },
  { path: "/agenda", label: "Agenda & Countdown", icon: AlarmClock },
  { path: "/flashcards", label: "Flashcards", icon: Layers },
  { path: "/quiz", label: "Quiz", icon: HelpCircle },
  { path: "/ringkas", label: "Ringkas AI", icon: Sparkles },
  { path: "/ipk", label: "Kalkulator IPK", icon: Calculator },
  { path: "/pomodoro", label: "Focus Timer", icon: Timer },
  { path: "/habit", label: "Study Streak", icon: Flame },
  { path: "/absensi", label: "Absensi", icon: UserCheck },
  { path: "/makalah", label: "Helper Makalah", icon: FileText },
  { path: "/converter", label: "Konverter File", icon: FileOutput },
  { path: "/surat", label: "Surat Kilat", icon: Mail },
  { path: "/nilai-minimal", label: "Nilai Minimal UAS", icon: Target },
  { path: "/prioritas", label: "Prioritas Malam Ini", icon: ListOrdered },
  { path: "/cram", label: "Mode Cram", icon: Zap },
  { path: "/outline", label: "Outline Slide", icon: Presentation },
  { path: "/slides", label: "Buat Presentasi", icon: Presentation },
  { path: "/cv", label: "CV & Portofolio", icon: Briefcase },
  { path: "/bank", label: "Bank Soal & Materi", icon: Archive },
  { path: "/nilai-akhir", label: "Nilai Akhir", icon: Calculator },
  { path: "/format-tugas", label: "Cek Format Tugas", icon: FileCheck },
  { path: "/cari", label: "Cari Materi", icon: Search },

  { path: "/parafrase", label: "Parafrase", icon: RefreshCw },

  { path: "/citation", label: "Daftar Pustaka", icon: BookMarked },
  { path: "/skripsi", label: "Skripsi", icon: BookOpen },
  { path: "/notes", label: "Catatan", icon: FileText },
  { path: "/pricing", label: "Upgrade Pro", icon: Crown },
  { path: "/settings", label: "Pengaturan", icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isPro } = usePlan();

  return (
    <>
    {isOpen && <button aria-label="Tutup navigasi" onClick={onClose} className="fixed inset-0 z-30 bg-black/40 md:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white transition-transform dark:border-gray-800 dark:bg-gray-900 md:static md:z-auto md:w-64 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="p-5 border-b border-gray-200 dark:border-gray-800">
        <Link
          to="/"
          onClick={onClose}
          aria-label="KuliahBit, kembali ke halaman utama"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <img
            src="/kuliahbit-logo.png"
            alt=""
            aria-hidden="true"
            className="w-9 h-9 rounded-xl object-cover shadow-sm"
          />
          <div>
            <div>
              <h1 className="font-brand text-lg leading-tight text-gray-900 dark:text-white">
                KuliahBit
              </h1>
              <p className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                by Karyabit Studio
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isPro ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">Pro Plan ✨</span>
              ) : (
                "Free Plan"
              )}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400 text-center">
        Tools untuk mahasiswa Indonesia
      </div>
    </aside>
    </>
  );
}
