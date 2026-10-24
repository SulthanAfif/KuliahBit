import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  UserCheck,
  Layers,
  HelpCircle,
  FileText,
  Sparkles,
  MessageCircle,
  Award,
  FlaskConical,
  GraduationCap,
  Crown,
  Settings,
  FileOutput,
  AlarmClock,
  Zap,
  Presentation,
  BookMarked,
  RefreshCw,
  Mail,
  Briefcase,
} from "lucide-react";
import { usePlan } from "../../context/PlanContext";

/** Menu singkat — tools, bukan portal kampus */
const menuItems = [
  { path: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { path: "/tugas", label: "Tugas", icon: CheckSquare },
  { path: "/absensi", label: "Absensi", icon: UserCheck },
  { path: "/agenda", label: "Deadline", icon: AlarmClock },
  { path: "/ujian-minggu-ini", label: "Ujian Minggu Ini", icon: GraduationCap },
  { path: "/beasiswa", label: "Beasiswa/Magang", icon: Award },
  { path: "/laporan-praktikum", label: "Laporan Praktikum", icon: FlaskConical },

  { path: "/flashcards", label: "Flashcards", icon: Layers },
  { path: "/quiz", label: "Kuis", icon: HelpCircle },
  { path: "/ringkas", label: "Ringkas AI", icon: Sparkles },
  { path: "/tanya-ai", label: "Tanya AI", icon: MessageCircle },
  { path: "/cram", label: "Mode Cram", icon: Zap },
  { path: "/notes", label: "Catatan", icon: FileText },
  { path: "/converter", label: "Konverter", icon: FileOutput },
  { path: "/slides", label: "Slide PPT", icon: Presentation },
  { path: "/cv", label: "CV", icon: Briefcase },
  { path: "/surat", label: "Surat Kilat", icon: Mail },
  { path: "/parafrase", label: "Parafrase", icon: RefreshCw },
  { path: "/citation", label: "Daftar Pustaka", icon: BookMarked },
  { path: "/pricing", label: "Upgrade Pro", icon: Crown },
  { path: "/settings", label: "Pengaturan", icon: Settings },
];

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { isPro } = usePlan();

  return (
    <>
      {isOpen && (
        <button
          aria-label="Tutup navigasi"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white transition-transform dark:border-gray-800 dark:bg-gray-900 md:static md:z-auto md:w-64 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-gray-200 p-5 dark:border-gray-800">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <img
              src="/kuliahbit-logo.png"
              alt=""
              className="h-9 w-9 rounded-xl object-cover shadow-sm"
            />
            <div>
              <h1 className="font-brand text-lg leading-tight text-gray-900 dark:text-white">
                KuliahBit
              </h1>
              <p className="text-xs text-gray-500">
                {isPro ? (
                  <span className="font-medium text-amber-600">Pro</span>
                ) : (
                  "Tools belajar"
                )}
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4 text-center text-xs text-gray-400 dark:border-gray-800">
          Bukan portal kampus — hanya tools
        </div>
      </aside>
    </>
  );
}
