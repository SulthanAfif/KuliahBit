import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Clock } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import type { Task, Course } from "../types";
import { v4 as uuid } from "uuid";
import { format, isPast, isToday } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function Tugas() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [courseId, setCourseId] = useState("");
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");

  useEffect(() => {
    setTasks(getFromStorage("tasks", []));
    setCourses(getFromStorage("courses", []));
  }, []);

  useEffect(() => {
    saveToStorage("tasks", tasks);
  }, [tasks]);

  const handleAdd = () => {
    if (!title.trim() || !dueDate) return;
    const newTask: Task = {
      id: uuid(),
      title: title.trim(),
      dueDate,
      status: "todo",
      priority,
      courseId: courseId || undefined,
      createdAt: new Date().toISOString(),
    };
    setTasks([newTask, ...tasks]);
    setTitle("");
    setDueDate("");
    setPriority("medium");
    setCourseId("");
    setShowForm(false);
  };

  const toggleStatus = (id: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "done" ? "todo" : "done" }
          : t
      )
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus tugas ini?")) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  const filtered = tasks.filter((t) => {
    if (filter === "todo") return t.status !== "done";
    if (filter === "done") return t.status === "done";
    return true;
  });

  const priorityColor = {
    low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Tugas & Deadline</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Kelola semua tugas kuliahmu
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"
        >
          <Plus size={18} />
          Tambah Tugas
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
          <input
            type="text"
            placeholder="Judul tugas..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Prioritas Rendah</option>
              <option value="medium">Prioritas Sedang</option>
              <option value="high">Prioritas Tinggi</option>
            </select>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tanpa mata kuliah</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 text-sm font-medium"
            >
              Simpan
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "todo", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            {f === "all" ? "Semua" : f === "todo" ? "Belum Selesai" : "Selesai"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            Belum ada tugas. Yuk tambah yang pertama!
          </div>
        ) : (
          filtered.map((task) => {
            const overdue =
              task.status !== "done" &&
              isPast(new Date(task.dueDate)) &&
              !isToday(new Date(task.dueDate));
            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-gray-900 border rounded-xl p-4 flex items-start gap-3 ${
                  task.status === "done"
                    ? "border-gray-200 dark:border-gray-800 opacity-60"
                    : overdue
                    ? "border-red-300 dark:border-red-800"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <button onClick={() => toggleStatus(task.id)} className="mt-0.5">
                  {task.status === "done" ? (
                    <CheckCircle2 className="text-green-500" size={22} />
                  ) : (
                    <Circle className="text-gray-400" size={22} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${
                      task.status === "done" ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                    <span
                      className={`flex items-center gap-1 ${
                        overdue ? "text-red-500 font-medium" : "text-gray-500"
                      }`}
                    >
                      <Clock size={12} />
                      {format(new Date(task.dueDate), "d MMM yyyy", {
                        locale: localeId,
                      })}
                      {overdue && " (terlambat)"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${priorityColor[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
