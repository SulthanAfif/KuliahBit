import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, UserCheck, AlertTriangle } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import { v4 as uuid } from "uuid";

interface CourseAttendance {
  id: string;
  name: string;
  totalMeetings: number; // total pertemuan semester
  attended: number;
  sick: number; // sakit/izin dihitung hadir di banyak kampus, atau terpisah
}

export default function Absensi() {
  const [courses, setCourses] = useState<CourseAttendance[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [total, setTotal] = useState(14);

  useEffect(() => {
    setCourses(getFromStorage("attendance", []));
  }, []);

  useEffect(() => {
    saveToStorage("attendance", courses);
  }, [courses]);

  const handleAdd = () => {
    if (!name.trim() || total < 1) return;
    setCourses([
      {
        id: uuid(),
        name: name.trim(),
        totalMeetings: total,
        attended: 0,
        sick: 0,
      },
      ...courses,
    ]);
    setName("");
    setTotal(14);
    setShowForm(false);
  };

  const update = (id: string, field: "attended" | "sick" | "totalMeetings", delta: number) => {
    setCourses(
      courses.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, [field]: Math.max(0, c[field] + delta) };
        if (field === "attended") next.attended = Math.min(next.attended, next.totalMeetings);
        if (field === "sick") next.sick = Math.min(next.sick, next.totalMeetings);
        return next;
      })
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus mata kuliah ini?")) {
      setCourses(courses.filter((c) => c.id !== id));
    }
  };

  const stats = useMemo(() => {
    return courses.map((c) => {
      const present = c.attended + c.sick; // sakit sering dihitung hadir
      const pct = c.totalMeetings > 0 ? (present / c.totalMeetings) * 100 : 0;
      // Berapa kali boleh absen agar tetap >= 75%
      const minRequired = Math.ceil(c.totalMeetings * 0.75);
      // Better: meetings done = attended + sick + absent_so_far; we only track attended+sick
      const meetingsDone = c.attended + c.sick; // assume user marks as they go; remaining slots
      const slotsLeft = c.totalMeetings - meetingsDone;
      const stillNeed = Math.max(0, minRequired - meetingsDone);
      const canSkip = Math.max(0, slotsLeft - stillNeed);
      const danger = pct < 75 && meetingsDone > 0;
      return { ...c, pct, minRequired, canSkip, stillNeed, slotsLeft, danger, present };
    });
  }, [courses]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="text-emerald-500" size={26} />
            Tracker Absensi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pantau kehadiran — target minimal 75%
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 sm:w-auto"
        >
          <Plus size={18} /> Tambah Matkul
        </button>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-sm text-emerald-800 dark:text-emerald-200">
        Banyak kampus mensyaratkan kehadiran minimal <strong>75%</strong>. Sakit/izin biasanya
        tetap dihitung hadir — sesuaikan dengan aturan kampusmu.
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama mata kuliah"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            autoFocus
          />
          <div>
            <label className="text-xs text-gray-500">Total pertemuan semester</label>
            <input
              type="number"
              min={1}
              max={30}
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
              className="w-full mt-1 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-emerald-700">
              Simpan
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 text-sm">
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {stats.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">
            Belum ada mata kuliah. Tambah untuk mulai tracking.
          </p>
        ) : (
          stats.map((c) => (
            <div
              key={c.id}
              className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 shadow-sm ${
                c.danger
                  ? "border-red-300 dark:border-red-800"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.present}/{c.totalMeetings} pertemuan tercatat
                  </p>
                </div>
                <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className={c.pct >= 75 ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                    {c.pct.toFixed(0)}%
                  </span>
                  <span className="text-gray-400">min 75%</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      c.pct >= 75 ? "bg-emerald-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, c.pct)}%` }}
                  />
                </div>
              </div>

              {c.danger && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mt-2">
                  <AlertTriangle size={12} />
                  Di bawah 75% — hadir terus di sisa pertemuan!
                </p>
              )}

              {c.slotsLeft > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Sisa {c.slotsLeft} pertemuan · boleh absen max{" "}
                  <strong>{c.canSkip}x</strong> agar tetap ≥75%
                  {c.stillNeed > 0 && ` · wajib hadir min ${c.stillNeed}x lagi`}
                </p>
              )}

              {/* Controls */}
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1">
                  <span className="text-xs text-gray-500 mr-1">Hadir</span>
                  <button
                    onClick={() => update(c.id, "attended", -1)}
                    className="w-7 h-7 rounded-md bg-white dark:bg-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{c.attended}</span>
                  <button
                    onClick={() => update(c.id, "attended", 1)}
                    className="w-7 h-7 rounded-md bg-white dark:bg-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1">
                  <span className="text-xs text-gray-500 mr-1">Sakit/Izin</span>
                  <button
                    onClick={() => update(c.id, "sick", -1)}
                    className="w-7 h-7 rounded-md bg-white dark:bg-gray-700 text-sm font-medium"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{c.sick}</span>
                  <button
                    onClick={() => update(c.id, "sick", 1)}
                    className="w-7 h-7 rounded-md bg-white dark:bg-gray-700 text-sm font-medium"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
