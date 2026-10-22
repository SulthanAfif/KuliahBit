import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Flame, Check } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import { v4 as uuid } from "uuid";
import { format, subDays, parseISO } from "date-fns";

interface Habit {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  /** ISO date strings when completed */
  completedDates: string[];
}

const COLORS = [
  "bg-orange-500",
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-teal-500",
];

function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let streak = 0;
  let d = new Date();
  // If today not done, start from yesterday
  if (!set.has(format(d, "yyyy-MM-dd"))) {
    d = subDays(d, 1);
  }
  while (set.has(format(d, "yyyy-MM-dd"))) {
    streak++;
    d = subDays(d, 1);
  }
  return streak;
}

function calcLongest(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseISO(sorted[i - 1]);
    const curr = parseISO(sorted[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diff > 1) {
      current = 1;
    }
  }
  return longest;
}

export default function Habit() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setHabits(getFromStorage("habits", []));
  }, []);

  useEffect(() => {
    saveToStorage("habits", habits);
  }, [habits]);

  const today = todayISO();

  // Last 7 days for heatmap
  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return format(d, "yyyy-MM-dd");
    });
  }, []);

  const totalStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => calcStreak(h.completedDates)));
  }, [habits]);

  const handleAdd = () => {
    if (!name.trim()) return;
    setHabits([
      {
        id: uuid(),
        name: name.trim(),
        color,
        createdAt: new Date().toISOString(),
        completedDates: [],
      },
      ...habits,
    ]);
    setName("");
    setShowForm(false);
  };

  const toggleDay = (habitId: string, date: string) => {
    setHabits(
      habits.map((h) => {
        if (h.id !== habitId) return h;
        const has = h.completedDates.includes(date);
        return {
          ...h,
          completedDates: has
            ? h.completedDates.filter((d) => d !== date)
            : [...h.completedDates, date],
        };
      })
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus kebiasaan ini?")) {
      setHabits(habits.filter((h) => h.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="text-orange-500" size={26} />
            Study Streak
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Bangun kebiasaan belajar konsisten
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 sm:w-auto"
        >
          <Plus size={18} /> Tambah
        </button>
      </div>

      {/* Big streak */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-200 dark:border-orange-800 rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400">
          <Flame size={28} />
          <span className="text-4xl font-bold">{totalStreak}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {totalStreak === 0
            ? "Belum ada streak — centang hari ini untuk mulai!"
            : totalStreak === 1
            ? "hari streak — lanjutkan besok!"
            : `hari streak terbaik — jangan putus!`}
        </p>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Baca 30 menit, Kerjakan soal, Review catatan..."
            className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            autoFocus
          />
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full ${c} ${
                  color === c ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900" : ""
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="bg-orange-500 text-white px-5 py-2 rounded-xl text-sm hover:bg-orange-600"
            >
              Simpan
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 text-sm">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Habit list */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">
            Belum ada kebiasaan. Tambah yang ingin kamu jaga setiap hari.
          </p>
        ) : (
          habits.map((h) => {
            const streak = calcStreak(h.completedDates);
            const longest = calcLongest(h.completedDates);
            const doneToday = h.completedDates.includes(today);

            return (
              <div
                key={h.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleDay(h.id, today)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${
                        doneToday
                          ? `${h.color} text-white`
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Check size={20} />
                    </button>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{h.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        🔥 {streak} streak · terbaik {longest}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="text-gray-400 hover:text-red-500 shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* 7-day dots */}
                <div className="flex gap-1.5 mt-3 ml-13 pl-[52px]">
                  {last7.map((d) => {
                    const done = h.completedDates.includes(d);
                    const isToday = d === today;
                    return (
                      <button
                        key={d}
                        onClick={() => toggleDay(h.id, d)}
                        title={format(parseISO(d), "d MMM")}
                        className={`w-7 h-7 rounded-lg text-[10px] font-medium transition ${
                          done
                            ? `${h.color} text-white`
                            : isToday
                            ? "border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                        }`}
                      >
                        {format(parseISO(d), "d")}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
