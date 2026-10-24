import { Link, useLocation } from "react-router-dom";
import {
  AlarmClock,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock3,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { usePlan } from "../context/PlanContext";
import { getFromStorage } from "../lib/storage";
import { useMemo } from "react";
import type { Task } from "../types";
import { format, isBefore, isToday, parseISO, startOfWeek } from "date-fns";
import { id as localeId } from "date-fns/locale";

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export default function Dashboard() {
  const { isPro } = usePlan();
  const location = useLocation();
  const data = useMemo(() => {
    const tasks = getFromStorage<Task[]>("tasks", []);
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const key = dateKey(date);
      const completed = tasks.filter((task) => task.completedAt && dateKey(parseISO(task.completedAt)) === key).length;
      return { date, key, completed };
    });
    const completedThisWeek = weekDays.reduce((sum, day) => sum + day.completed, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const dueThisWeek = tasks.filter((task) => {
      const dueDate = parseISO(task.dueDate);
      return !isBefore(dueDate, weekStart) && isBefore(dueDate, weekEnd);
    });
    const completedDueThisWeek = dueThisWeek.filter((task) => task.status === "done").length;
    const activeTasks = tasks.filter((task) => task.status !== "done");
    const overdue = activeTasks.filter((task) => isBefore(parseISO(task.dueDate), today) && !isToday(parseISO(task.dueDate)));
    const upcoming = activeTasks
      .filter((task) => !isBefore(parseISO(task.dueDate), today) || isToday(parseISO(task.dueDate)))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 4);
    const taskRate = dueThisWeek.length ? Math.round((completedDueThisWeek / dueThisWeek.length) * 100) : 0;
    return { tasks, weekDays, completedThisWeek, dueThisWeek: dueThisWeek.length, completedDueThisWeek, activeTasks, overdue, upcoming, taskRate };
  }, [location.pathname]);

  const maxCompleted = Math.max(1, ...data.weekDays.map((day) => day.completed));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId })}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Ringkasan belajarmu</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Pantau langkah kecilmu dan tentukan fokus hari ini.</p>
        </div>
        <Link to="/tugas" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
          <CheckSquare size={17} /> Kelola tugas <ArrowRight size={16} />
        </Link>
      </header>

      <section>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><TrendingUp className="text-blue-500" size={19} /><h2 className="font-semibold">Progres tugas minggu ini</h2></div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tugas yang kamu tandai selesai per hari.</p>
            </div>
            <div className="rounded-xl bg-blue-50 px-3 py-2 text-right dark:bg-blue-950/50">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.taskRate}%</p>
              <p className="text-xs text-gray-500">{data.completedDueThisWeek} dari {data.dueThisWeek} deadline minggu ini</p>
            </div>
          </div>
          <div className="mt-6 grid h-36 grid-cols-7 items-end gap-2 sm:gap-4" role="img" aria-label={`Progres tugas tujuh hari. ${data.completedThisWeek} tugas selesai minggu ini.`}>
            {data.weekDays.map((day, index) => {
              const height = day.completed ? Math.max(12, (day.completed / maxCompleted) * 100) : 5;
              return <div key={day.key} className="flex h-full flex-col items-center justify-end gap-2">
                <span className="text-xs font-medium text-gray-500">{day.completed || ""}</span>
                <div className="flex h-24 w-full items-end rounded-lg bg-gray-100 dark:bg-gray-800"><div className={`w-full rounded-lg transition-all ${day.completed ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`} style={{ height: `${height}%` }} /></div>
                <span className={`text-[11px] ${isToday(day.date) ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-500"}`}>{DAY_LABELS[index]}</span>
              </div>;
            })}
          </div>
          {!data.completedThisWeek && <p className="mt-3 text-center text-xs text-gray-500">Tandai tugas sebagai selesai untuk melihat progres harian.</p>}
        </div>

      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <SummaryCard icon={CheckCircle2} label="Tugas selesai" value={data.tasks.filter((task) => task.status === "done").length} detail={`dari ${data.tasks.length} tugas`} color="text-green-600 bg-green-50 dark:bg-green-950/40" />
        <SummaryCard icon={Clock3} label="Belum selesai" value={data.activeTasks.length} detail={`${data.overdue.length} sudah lewat deadline`} color="text-amber-600 bg-amber-50 dark:bg-amber-950/40" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Fokus berikutnya</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Deadline terdekat yang perlu diselesaikan.</p></div><Link to="/tugas" className="text-sm font-medium text-blue-600 hover:underline">Semua tugas</Link></div>
          <div className="mt-4 space-y-2">
            {data.upcoming.length ? data.upcoming.map((task) => <div key={task.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70"><Circle size={18} className="shrink-0 text-gray-400" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{task.title}</p><p className="text-xs text-gray-500">Deadline {format(parseISO(task.dueDate), "d MMM yyyy", { locale: localeId })}</p></div><span className={`rounded-full px-2 py-1 text-[11px] font-medium ${task.priority === "high" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : task.priority === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>{task.priority === "high" ? "Tinggi" : task.priority === "medium" ? "Sedang" : "Rendah"}</span></div>) : <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center dark:border-gray-700"><p className="text-sm text-gray-500">Tidak ada deadline aktif. Tambahkan tugas agar rencanamu terlihat di sini.</p><Link to="/tugas" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600">Tambah tugas <ArrowRight size={14} /></Link></div>}
          </div>
          {data.overdue.length > 0 && <p className="mt-3 flex items-center gap-2 text-xs font-medium text-red-600"><AlarmClock size={14} />{data.overdue.length} tugas melewati deadline.</p>}
        </div>
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:border-blue-900 dark:from-blue-950/40 dark:to-indigo-950/40">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300"><Target size={19} /><h2 className="font-semibold">Ruang belajar</h2></div>
          <p className="mt-2 text-sm text-blue-900/75 dark:text-blue-100/75">Butuh mulai belajar atau mengolah materi? Lanjutkan dari alat yang kamu perlukan.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <QuickLink to="/flashcards" icon={BookOpenCheck} label="Flashcards" />
            <QuickLink to="/ringkas" icon={Sparkles} label="Ringkas materi" />
          </div>
          {!isPro && <Link to="/pricing" className="mt-4 inline-block text-xs font-medium text-blue-700 hover:underline dark:text-blue-300">Lihat fitur Pro →</Link>}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, detail, color }: { icon: typeof CheckCircle2; label: string; value: number | string; detail: string; color: string }) {
  return <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon size={20} /></div><div><p className="text-sm text-gray-500 dark:text-gray-400">{label}</p><p className="text-xl font-bold">{value} <span className="text-xs font-normal text-gray-500">{detail}</span></p></div></div>;
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: typeof BookOpenCheck; label: string }) {
  return <Link to={to} className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white/80 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-blue-900 dark:bg-gray-900/70 dark:text-gray-200 dark:hover:text-blue-300"><Icon size={16} />{label}</Link>;
}
