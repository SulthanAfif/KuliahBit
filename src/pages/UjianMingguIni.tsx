import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  CheckSquare,
  Layers,
  Zap,
  Sparkles,
  AlarmClock,
  ArrowRight,
} from "lucide-react";
import { getFromStorage } from "../lib/storage";
import { dueCards } from "../lib/spaced";
import type { Task, FlashcardSet } from "../types";

function daysUntil(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

export default function UjianMingguIni() {
  const data = useMemo(() => {
    const tasks = getFromStorage<Task[]>("tasks", []);
    const agenda = getFromStorage<{ id: string; title: string; date: string; type?: string }[]>(
      "agenda-items",
      []
    );
    const sets = getFromStorage<FlashcardSet[]>("flashcard-sets", []);

    const upcomingTasks = tasks
      .filter((t) => t.status !== "done")
      .map((t) => ({ ...t, days: daysUntil(t.dueDate) }))
      .filter((t) => t.days >= -1 && t.days <= 7)
      .sort((a, b) => a.days - b.days);

    const upcomingAgenda = agenda
      .map((a) => ({ ...a, days: daysUntil(a.date) }))
      .filter((a) => a.days >= -1 && a.days <= 7)
      .sort((a, b) => a.days - b.days);

    let dueFlash = 0;
    sets.forEach((s) => {
      dueFlash += dueCards(s.cards || []).length;
    });

    return { upcomingTasks, upcomingAgenda, dueFlash, setCount: sets.length };
  }, []);

  const labelDays = (d: number) => {
    if (d < 0) return "Terlewat";
    if (d === 0) return "Hari ini";
    if (d === 1) return "Besok";
    return `${d} hari lagi`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="text-indigo-600" size={28} />
          Ujian Minggu Ini
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Fokus 7 hari ke depan: deadline, review flashcard, dan mode cram
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500">Tugas dekat</p>
          <p className="text-2xl font-bold mt-1">{data.upcomingTasks.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500">Agenda / UTS</p>
          <p className="text-2xl font-bold mt-1">{data.upcomingAgenda.length}</p>
        </div>
        <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-purple-700 dark:text-purple-300">Flashcard jatuh tempo</p>
          <p className="text-2xl font-bold mt-1 text-purple-700 dark:text-purple-200">
            {data.dueFlash}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Link
          to="/flashcards"
          className="flex items-center gap-3 rounded-2xl bg-purple-600 text-white p-4 hover:bg-purple-700 transition"
        >
          <Layers size={22} />
          <div className="flex-1">
            <p className="font-medium text-sm">Review Spaced</p>
            <p className="text-xs opacity-80">{data.dueFlash} kartu due</p>
          </div>
          <ArrowRight size={18} />
        </Link>
        <Link
          to="/cram"
          className="flex items-center gap-3 rounded-2xl bg-amber-500 text-white p-4 hover:bg-amber-600 transition"
        >
          <Zap size={22} />
          <div className="flex-1">
            <p className="font-medium text-sm">Mode Cram</p>
            <p className="text-xs opacity-80">Rencana kilat</p>
          </div>
          <ArrowRight size={18} />
        </Link>
        <Link
          to="/ringkas"
          className="flex items-center gap-3 rounded-2xl bg-indigo-600 text-white p-4 hover:bg-indigo-700 transition"
        >
          <Sparkles size={22} />
          <div className="flex-1">
            <p className="font-medium text-sm">Ringkas materi</p>
            <p className="text-xs opacity-80">PDF → belajar</p>
          </div>
          <ArrowRight size={18} />
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <CheckSquare size={18} /> Tugas (7 hari)
        </h2>
        {data.upcomingTasks.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center border border-dashed rounded-2xl">
            Tidak ada tugas dalam 7 hari.{" "}
            <Link to="/tugas" className="text-blue-600 underline">
              Kelola tugas
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {data.upcomingTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
              >
                <span className="font-medium truncate">{t.title}</span>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-1 rounded-lg ${
                    t.days <= 0
                      ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : t.days <= 2
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800"
                  }`}
                >
                  {labelDays(t.days)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <AlarmClock size={18} /> Agenda & ujian
        </h2>
        {data.upcomingAgenda.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center border border-dashed rounded-2xl">
            Belum ada agenda.{" "}
            <Link to="/agenda" className="text-blue-600 underline">
              Tambah di Deadline
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {data.upcomingAgenda.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm"
              >
                <span className="font-medium truncate">{a.title}</span>
                <span className="shrink-0 text-xs text-gray-500">{labelDays(a.days)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
