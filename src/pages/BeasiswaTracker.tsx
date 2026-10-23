import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink, Award } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import { v4 as uuid } from "uuid";

type Status = "belum" | "proses" | "selesai" | "gagal";

interface Opp {
  id: string;
  title: string;
  type: "beasiswa" | "magang" | "lomba" | "lain";
  deadline: string;
  link?: string;
  status: Status;
  notes?: string;
}

const STATUS_LABEL: Record<Status, string> = {
  belum: "Belum daftar",
  proses: "Proses",
  selesai: "Selesai / lolos",
  gagal: "Tidak lolos",
};

export default function BeasiswaTracker() {
  const [items, setItems] = useState<Opp[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Opp["type"]>("beasiswa");
  const [deadline, setDeadline] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    setItems(getFromStorage<Opp[]>("opp-tracker", []));
  }, []);

  useEffect(() => {
    saveToStorage("opp-tracker", items);
  }, [items]);

  const add = () => {
    if (!title.trim() || !deadline) return;
    setItems([
      {
        id: uuid(),
        title: title.trim(),
        type,
        deadline,
        link: link.trim() || undefined,
        status: "belum",
      },
      ...items,
    ]);
    setTitle("");
    setDeadline("");
    setLink("");
  };

  const daysLeft = (d: string) => {
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - now.getTime()) / 86400000);
  };

  const sorted = [...items].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="text-amber-500" size={26} />
          Beasiswa / Magang / Lomba
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Lacak deadline daftar — terpisah dari tugas kuliah
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nama program (contoh: Magang Batch 7, Beasiswa X)"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Opp["type"])}
            className="border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent"
          >
            <option value="beasiswa">Beasiswa</option>
            <option value="magang">Magang</option>
            <option value="lomba">Lomba</option>
            <option value="lain">Lainnya</option>
          </select>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent"
          />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link pendaftaran (opsional)"
            className="border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent"
          />
        </div>
        <button
          onClick={add}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-600"
        >
          <Plus size={18} /> Tambah
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-gray-400 py-12">Belum ada yang dilacak</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((item) => {
            const d = daysLeft(item.deadline);
            return (
              <li
                key={item.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-gray-400">
                      {item.type}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                        d < 0
                          ? "bg-gray-100 text-gray-500"
                          : d <= 3
                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                      }`}
                    >
                      {d < 0 ? "Deadline lewat" : d === 0 ? "Hari ini" : `${d} hari lagi`}
                    </span>
                  </div>
                  <p className="font-semibold mt-1 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500">
                    Deadline:{" "}
                    {new Date(item.deadline).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      setItems(
                        items.map((x) =>
                          x.id === item.id
                            ? { ...x, status: e.target.value as Status }
                            : x
                        )
                      )
                    }
                    className="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent"
                  >
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                  <button
                    onClick={() => setItems(items.filter((x) => x.id !== item.id))}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
