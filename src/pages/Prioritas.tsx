import { useMemo, useState, useEffect } from "react";
import { ListOrdered, AlertTriangle } from "lucide-react";
import { getFromStorage } from "../lib/storage";
import type { Task } from "../types";
import { differenceInHours, parseISO, isPast } from "date-fns";
import { Link } from "react-router-dom";

function scoreTask(t: Task): number {
  if (t.status === "done") return -999;
  const due = parseISO(t.dueDate);
  const hours = differenceInHours(due, new Date());
  const urgency =
    hours < 0 ? 100 : hours < 24 ? 90 : hours < 72 ? 70 : hours < 168 ? 50 : 20;
  const pri = t.priority === "high" ? 30 : t.priority === "medium" ? 15 : 5;
  return urgency + pri;
}

export default function Prioritas() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    setTasks(getFromStorage<Task[]>("tasks", []));
  }, []);

  const ranked = useMemo(() => {
    return [...tasks]
      .filter((t) => t.status !== "done")
      .map((t) => ({ ...t, score: scoreTask(t) }))
      .sort((a, b) => b.score - a.score);
  }, [tasks]);

  const tonight = ranked.slice(0, 5);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ListOrdered className="text-amber-500" size={26} />
          Prioritas Malam Ini
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Diurutkan dari deadline + prioritas tugas yang sudah kamu simpan
        </p>
      </div>

      {ranked.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Belum ada tugas aktif.{" "}
          <Link to="/tugas" className="text-blue-600 underline">
            Tambah di Tugas & Deadline
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Fokus {Math.min(3, tonight.length)} teratas dulu
            </p>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              Selesaiin yang paling gawat sebelum yang longgar.
            </p>
          </div>

          <ol className="space-y-2">
            {ranked.map((t, i) => {
              const overdue = isPast(parseISO(t.dueDate));
              return (
                <li
                  key={t.id}
                  className={`bg-white dark:bg-gray-900 border rounded-xl p-4 flex gap-3 ${
                    overdue
                      ? "border-red-300 dark:border-red-800"
                      : "border-gray-200 dark:border-gray-800"
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      i < 3
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      {overdue && <AlertTriangle size={12} className="text-red-500" />}
                      Deadline: {t.dueDate} · {t.priority}
                      {overdue ? " · TERLAMBAT" : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
