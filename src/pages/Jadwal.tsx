import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import { v4 as uuid } from "uuid";

interface ScheduleItem {
  id: string;
  day: number; // 0=Senin ... 5=Sabtu
  name: string;
  start: string; // "08:00"
  end: string;
  room?: string;
  color: string;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-red-500",
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 07:00 - 18:00

export default function Jadwal() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [day, setDay] = useState(0);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("10:00");
  const [room, setRoom] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    setItems(getFromStorage("schedule-items", []));
  }, []);

  useEffect(() => {
    saveToStorage("schedule-items", items);
  }, [items]);

  const handleAdd = () => {
    if (!name.trim() || !start || !end) return;
    setItems([
      ...items,
      {
        id: uuid(),
        day,
        name: name.trim(),
        start,
        end,
        room: room.trim() || undefined,
        color,
      },
    ]);
    setName("");
    setRoom("");
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus jadwal ini?")) {
      setItems(items.filter((i) => i.id !== id));
    }
  };

  // Convert time "08:30" to minutes from 07:00 for positioning
  const timeToOffset = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h - 7) * 60 + m;
  };

  const durationMin = (start: string, end: string) =>
    timeToOffset(end) - timeToOffset(start);

  const today = new Date().getDay(); // 0=Minggu
  const todayIdx = today === 0 ? -1 : today - 1; // Senin=0

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="text-indigo-500" size={26} />
            Jadwal Kuliah
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Atur jadwal mingguan kamu
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 sm:w-auto"
        >
          <Plus size={18} /> Tambah
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama mata kuliah"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              autoFocus
            />
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              {DAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Ruangan (opsional)"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="flex gap-1.5 items-center">
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
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-indigo-700"
            >
              Simpan
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-500 text-sm"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Grid jadwal */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="min-w-[700px]">
          {/* Header hari */}
          <div className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-gray-200 dark:border-gray-800">
            <div className="p-2" />
            {DAYS.map((d, i) => (
              <div
                key={d}
                className={`p-2 text-center text-sm font-medium ${
                  i === todayIdx
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {d}
                {i === todayIdx && (
                  <span className="block text-[10px] font-normal">Hari ini</span>
                )}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="grid grid-cols-[60px_repeat(6,1fr)] relative" style={{ height: 12 * 48 }}>
            {/* Time labels */}
            <div className="relative border-r border-gray-100 dark:border-gray-800">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 text-[10px] text-gray-400 pr-2 text-right"
                  style={{ top: (h - 7) * 48 }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((_, dayIdx) => (
              <div
                key={dayIdx}
                className={`relative border-r border-gray-100 dark:border-gray-800 last:border-r-0 ${
                  dayIdx === todayIdx ? "bg-indigo-50/30 dark:bg-indigo-950/20" : ""
                }`}
              >
                {/* Hour lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-gray-50 dark:border-gray-800/50"
                    style={{ top: (h - 7) * 48 }}
                  />
                ))}

                {/* Events */}
                {items
                  .filter((item) => item.day === dayIdx)
                  .map((item) => {
                    const top = (timeToOffset(item.start) / 60) * 48;
                    const height = Math.max((durationMin(item.start, item.end) / 60) * 48, 24);
                    return (
                      <div
                        key={item.id}
                        className={`absolute left-1 right-1 rounded-lg ${item.color} text-white text-xs p-1.5 overflow-hidden cursor-pointer group shadow-sm`}
                        style={{ top, height }}
                        title={`${item.name} ${item.start}-${item.end}`}
                      >
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="opacity-80 truncate">
                          {item.start}–{item.end}
                          {item.room ? ` · ${item.room}` : ""}
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/30 rounded p-0.5"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {items.length === 0 && (
        <p className="text-center text-gray-400 text-sm">
          Belum ada jadwal. Klik “Tambah” untuk mulai.
        </p>
      )}
    </div>
  );
}
