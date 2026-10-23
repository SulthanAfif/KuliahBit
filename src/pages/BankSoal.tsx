import { useState, useEffect, useMemo } from "react";
import { Library, Plus, Trash2, Search } from "lucide-react";
import { getFromStorage, saveToStorage, usePersistentState } from "../lib/storage";
import { v4 as uuid } from "uuid";
import { usePlan } from "../context/PlanContext";
import { canAddBankItem, FREE_LIMITS, incrementFeatureUsage, getFeatureUsageThisMonth } from "../lib/limits";
import { UpgradeCard } from "../components/ProGate";
import { useNavigate } from "react-router-dom";

interface Item {
  id: string;
  type: "soal" | "materi";
  title: string;
  course: string;
  topic: string;
  content: string;
  createdAt: string;
}

export default function BankSoal() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [showForm, setShowForm] = usePersistentState("draft-bank-soal-open", false);
  const [type, setType] = usePersistentState<"soal" | "materi">("draft-bank-soal-type", "soal");
  const [title, setTitle] = usePersistentState("draft-bank-soal-title", "");
  const [course, setCourse] = usePersistentState("draft-bank-soal-course", "");
  const [topic, setTopic] = usePersistentState("draft-bank-soal-topic", "");
  const [content, setContent] = usePersistentState("draft-bank-soal-content", "");

  useEffect(() => {
    setItems(getFromStorage("bank-soal", []));
  }, []);

  useEffect(() => {
    saveToStorage("bank-soal", items);
  }, [items]);

  const courses = useMemo(
    () => [...new Set(items.map((i) => i.course).filter(Boolean))].sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const qq = q.toLowerCase();
    return items.filter((i) => {
      if (filterCourse && i.course !== filterCourse) return false;
      if (!qq) return true;
      return (
        i.title.toLowerCase().includes(qq) ||
        i.course.toLowerCase().includes(qq) ||
        i.topic.toLowerCase().includes(qq) ||
        i.content.toLowerCase().includes(qq)
      );
    });
  }, [items, q, filterCourse]);

  const add = () => {
    if (!title.trim()) return;
    if (!canAddBankItem(isPro, items.length)) {
      navigate("/pricing");
      return;
    }
    setItems([
      {
        id: uuid(),
        type,
        title: title.trim(),
        course: course.trim(),
        topic: topic.trim(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
      },
      ...items,
    ]);
    if (!isPro) incrementFeatureUsage("bankItems");
    setTitle("");
    setCourse("");
    setTopic("");
    setContent("");
    setShowForm(false);
  };

  return (
    <div className="w-full space-y-6">
      {!isPro && getFeatureUsageThisMonth("bankItems") >= FREE_LIMITS.bankItems && (
        <UpgradeCard title="Kuota bank bulan ini habis" description={`Paket Free: ${FREE_LIMITS.bankItems} soal/materi per bulan. Pro = unlimited.`} />
      )}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Library className="text-emerald-600" size={26} />
            Bank Soal & Materi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Arsip soal & materi — cari per matkul / topik
          </p>
        </div>
        <button
          onClick={() => {
            if (!showForm && !canAddBankItem(isPro, items.length)) { navigate("/pricing"); return; }
            setShowForm(!showForm);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm text-white hover:bg-emerald-700 sm:w-auto"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari judul, topik, isi..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-transparent text-sm"
        >
          <option value="">Semua matkul</option>
          {courses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex gap-2">
            {(["soal", "materi"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                  type === t ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent text-sm"
          />
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Mata kuliah"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent text-sm"
            />
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topik"
              className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-transparent text-sm"
            />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Isi soal / ringkasan materi..."
            className="w-full h-28 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 bg-transparent text-sm resize-none"
          />
          <div className="flex gap-2">
            <button onClick={add} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm">
              Simpan
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-3">
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">Belum ada arsip. Tambah soal atau materi.</p>
        ) : (
          filtered.map((i) => (
            <div
              key={i.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4"
            >
              <div className="flex justify-between gap-2">
                <div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      i.type === "soal"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    }`}
                  >
                    {i.type}
                  </span>
                  <h3 className="font-medium mt-1">{i.title}</h3>
                  <p className="text-xs text-gray-500">
                    {[i.course, i.topic].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  onClick={() => setItems(items.filter((x) => x.id !== i.id))}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {i.content && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap line-clamp-4">
                  {i.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
