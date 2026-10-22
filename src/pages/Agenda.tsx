import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, AlarmClock, CalendarDays } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import { v4 as uuid } from "uuid";
import { format, differenceInDays, differenceInHours, isPast, isToday } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface AgendaItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: "uts" | "uas" | "deadline" | "bimbingan" | "lainnya";
  notes?: string;
}

const TYPE_LABEL: Record<AgendaItem["type"], string> = {
  uts: "UTS",
  uas: "UAS",
  deadline: "Deadline",
  bimbingan: "Bimbingan",
  lainnya: "Lainnya",
};

const TYPE_COLOR: Record<AgendaItem["type"], string> = {
  uts: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  uas: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  deadline: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  bimbingan: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  lainnya: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function getCountdown(dateStr: string, timeStr?: string) {
  const target = new Date(dateStr + (timeStr ? `T${timeStr}` : "T23:59:59"));
  const now = new Date();
  if (isPast(target) && !isToday(target)) {
    return { label: "Sudah lewat", urgent: false, days: -1 };
  }
  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  if (days === 0) {
    return {
      label: hours <= 0 ? "Hari ini!" : `${hours} jam lagi`,
      urgent: true,
      days: 0,
    };
  }
  if (days === 1) return { label: "Besok", urgent: true, days: 1 };
  if (days <= 7) return { label: `${days} hari lagi`, urgent: true, days };
  return { label: `${days} hari lagi`, urgent: false, days };
}

export default function Agenda() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<AgendaItem["type"]>("deadline");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setItems(getFromStorage("agenda-items", []));
  }, []);

  useEffect(() => {
    saveToStorage("agenda-items", items);
  }, [items]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = new Date(a.date + (a.time ? `T${a.time}` : "T23:59")).getTime();
      const db = new Date(b.date + (b.time ? `T${b.time}` : "T23:59")).getTime();
      return da - db;
    });
  }, [items]);

  const upcoming = sorted.filter((i) => {
    const t = new Date(i.date + (i.time ? `T${i.time}` : "T23:59:59"));
    return !isPast(t) || isToday(t);
  });

  const handleAdd = () => {
    if (!title.trim() || !date) return;
    setItems([
      {
        id: uuid(),
        title: title.trim(),
        date,
        time: time || undefined,
        type,
        notes: notes.trim() || undefined,
      },
      ...items,
    ]);
    setTitle("");
    setDate("");
    setTime("");
    setType("deadline");
    setNotes("");
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus agenda ini?")) {
      setItems(items.filter((i) => i.id !== id));
    }
  };

  // Next urgent item for big countdown
  const nextUrgent = upcoming[0];
  const nextCd = nextUrgent ? getCountdown(nextUrgent.date, nextUrgent.time) : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlarmClock className="text-orange-500" size={26} />
            Agenda & Countdown
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            UTS, UAS, deadline, bimbingan — jangan sampai kelewat
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 sm:w-auto"
        >
          <Plus size={18} /> Tambah
        </button>
      </div>

      {/* Big countdown */}
      {nextUrgent && nextCd && nextCd.days >= 0 && (
        <div
          className={`rounded-2xl p-6 text-center shadow-sm border ${
            nextCd.urgent
              ? "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/40 dark:to-red-950/40 border-orange-200 dark:border-orange-800"
              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
          }`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Berikutnya</p>
          <p className="text-xl font-bold">{nextUrgent.title}</p>
          <p
            className={`text-4xl font-bold mt-2 ${
              nextCd.urgent
                ? "text-orange-600 dark:text-orange-400"
                : "text-gray-800 dark:text-gray-100"
            }`}
          >
            {nextCd.label}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {format(new Date(nextUrgent.date), "EEEE, d MMMM yyyy", { locale: localeId })}
            {nextUrgent.time ? ` · ${nextUrgent.time}` : ""}
          </p>
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul (contoh: UTS Matematika Diskrit)"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            autoFocus
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AgendaItem["type"])}
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            >
              {(Object.keys(TYPE_LABEL) as AgendaItem["type"][]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan (opsional)"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
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

      {/* List */}
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Belum ada agenda. Tambah UTS, UAS, atau deadline.</p>
          </div>
        ) : (
          sorted.map((item) => {
            const cd = getCountdown(item.date, item.time);
            const past = cd.days < 0;
            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-gray-900 border rounded-xl p-4 flex items-start gap-3 ${
                  past
                    ? "border-gray-200 dark:border-gray-800 opacity-50"
                    : cd.urgent
                    ? "border-orange-300 dark:border-orange-700"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[item.type]}`}>
                      {TYPE_LABEL[item.type]}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        past
                          ? "text-gray-400"
                          : cd.urgent
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-gray-500"
                      }`}
                    >
                      {cd.label}
                    </span>
                  </div>
                  <p className={`font-medium mt-1 ${past ? "line-through text-gray-400" : ""}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(item.date), "d MMM yyyy", { locale: localeId })}
                    {item.time ? ` · ${item.time}` : ""}
                    {item.notes ? ` · ${item.notes}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-400 hover:text-red-500 shrink-0"
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
