import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award, Bell, CalendarClock, Check, Clock3, ExternalLink, Filter,
  ListTodo, Pencil, Plus, Search, Trash2, Trophy, X,
} from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import { v4 as uuid } from "uuid";

type Status = "belum" | "proses" | "selesai" | "gagal";
type OpportunityType = "beasiswa" | "magang" | "lomba" | "lain";
type FilterType = "semua" | OpportunityType;
type FilterStatus = "aktif" | Status | "semua";

interface Opp {
  id: string;
  title: string;
  type: OpportunityType;
  deadline: string;
  link?: string;
  status: Status;
  notes?: string;
}

interface OpportunityDraft {
  title: string;
  type: OpportunityType;
  deadline: string;
  link: string;
  notes: string;
}

const STORAGE_KEY = "opp-tracker";
const STATUS_LABEL: Record<Status, string> = {
  belum: "Belum daftar",
  proses: "Sedang proses",
  selesai: "Selesai / lolos",
  gagal: "Tidak lolos",
};
const TYPE_LABEL: Record<OpportunityType, string> = {
  beasiswa: "Beasiswa",
  magang: "Magang",
  lomba: "Lomba",
  lain: "Lainnya",
};
const EMPTY_DRAFT: OpportunityDraft = {
  title: "",
  type: "beasiswa",
  deadline: "",
  link: "",
  notes: "",
};

function readOpportunities(): Opp[] {
  const stored = getFromStorage<unknown>(STORAGE_KEY, []);
  if (!Array.isArray(stored)) return [];
  return stored.filter((item): item is Opp => (
    item !== null &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.deadline === "string" &&
    ["beasiswa", "magang", "lomba", "lain"].includes(item.type) &&
    ["belum", "proses", "selesai", "gagal"].includes(item.status)
  ));
}

function deadlineDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

function getTimeLeft(deadline: string, now: Date): { days: number; milliseconds: number } {
  const target = deadlineDate(deadline);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return {
    days: Math.round((dueDay.getTime() - today.getTime()) / 86400000),
    milliseconds: target.getTime() - now.getTime(),
  };
}

function formatTimeLeft(milliseconds: number): string {
  const minutesLeft = Math.max(0, Math.ceil(milliseconds / 60000));
  const days = Math.floor(minutesLeft / 1440);
  const hours = Math.floor((minutesLeft % 1440) / 60);
  const minutes = minutesLeft % 60;
  if (days > 0) return `${days} hari ${hours} jam lagi`;
  if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
  return `${minutes} menit lagi`;
}

function validHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function BeasiswaTracker() {
  const [items, setItems] = useState<Opp[]>(readOpportunities);
  const [draft, setDraft] = useState<OpportunityDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("semua");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("aktif");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const serialized = JSON.stringify(items);
    if (localStorage.getItem(STORAGE_KEY) !== serialized) {
      saveToStorage(STORAGE_KEY, items);
    }
  }, [items]);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  useEffect(() => {
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      if (event.key === null) {
        setItems([]);
        return;
      }
      try {
        const parsed: unknown = event.newValue ? JSON.parse(event.newValue) : [];
        if (Array.isArray(parsed)) {
          setItems(parsed.filter((item): item is Opp => (
            item !== null &&
            typeof item === "object" &&
            typeof item.id === "string" &&
            typeof item.title === "string" &&
            typeof item.deadline === "string" &&
            ["beasiswa", "magang", "lomba", "lain"].includes(item.type) &&
            ["belum", "proses", "selesai", "gagal"].includes(item.status)
          )));
        }
      } catch {
        setFormError("Data pelacak di tab lain tidak dapat dibaca. Muat ulang halaman untuk mencoba lagi.");
      }
    };
    window.addEventListener("storage", syncAcrossTabs);
    return () => window.removeEventListener("storage", syncAcrossTabs);
  }, []);

  const updateItems = useCallback((update: (current: Opp[]) => Opp[]) => {
    setItems(update);
  }, []);

  const openNewForm = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError("");
    setFormOpen(true);
  };

  const openEditForm = (item: Opp) => {
    setEditingId(item.id);
    setDraft({
      title: item.title,
      type: item.type,
      deadline: item.deadline,
      link: item.link ?? "",
      notes: item.notes ?? "",
    });
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError("");
  };

  const saveOpportunity = () => {
    if (!draft.title.trim() || !draft.deadline) {
      setFormError("Isi nama program dan tanggal deadline terlebih dahulu.");
      return;
    }
    const trimmedLink = draft.link.trim();
    if (trimmedLink && !validHttpUrl(trimmedLink)) {
      setFormError("Masukkan tautan lengkap yang diawali http:// atau https://.");
      return;
    }
    if (editingId) {
      updateItems((current) => current.map((item) => item.id === editingId
        ? {
          ...item,
          title: draft.title.trim(),
          type: draft.type,
          deadline: draft.deadline,
          link: trimmedLink || undefined,
          notes: draft.notes.trim() || undefined,
        }
        : item));
    } else {
      updateItems((current) => [{
        id: uuid(),
        title: draft.title.trim(),
        type: draft.type,
        deadline: draft.deadline,
        link: trimmedLink || undefined,
        notes: draft.notes.trim() || undefined,
        status: "belum",
      }, ...current]);
    }
    closeForm();
  };

  const sorted = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return items
      .filter((item) => {
        const matchesQuery = !query || [item.title, item.notes ?? "", TYPE_LABEL[item.type]]
          .some((value) => value.toLocaleLowerCase("id-ID").includes(query));
        const matchesType = typeFilter === "semua" || item.type === typeFilter;
        const matchesStatus = statusFilter === "semua" ||
          (statusFilter === "aktif" ? item.status === "belum" || item.status === "proses" : item.status === statusFilter);
        return matchesQuery && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        const aActive = a.status === "belum" || a.status === "proses";
        const bActive = b.status === "belum" || b.status === "proses";
        if (aActive !== bActive) return aActive ? -1 : 1;
        return deadlineDate(a.deadline).getTime() - deadlineDate(b.deadline).getTime();
      });
  }, [items, search, statusFilter, typeFilter]);

  const activeCount = items.filter((item) => item.status === "belum" || item.status === "proses").length;
  const urgentCount = items.filter((item) => (
    (item.status === "belum" || item.status === "proses") &&
    getTimeLeft(item.deadline, now).days >= 0 &&
    getTimeLeft(item.deadline, now).days <= 3
  )).length;
  const successCount = items.filter((item) => item.status === "selesai").length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Award className="text-amber-500" size={26} />
            Beasiswa / Magang / Lomba
          </h1>
          <p className="mt-1 text-sm text-gray-500">Pantau progres dan hitung mundur deadline secara langsung.</p>
        </div>
        <button onClick={openNewForm} className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600">
          <Plus size={18} /> Tambah peluang
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard icon={ListTodo} label="Sedang dilacak" value={activeCount} tone="blue" />
        <SummaryCard icon={Bell} label="Deadline ≤ 3 hari" value={urgentCount} tone="amber" />
        <SummaryCard icon={Trophy} label="Selesai / lolos" value={successCount} tone="green" />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs leading-relaxed text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        <CalendarClock size={16} className="mt-0.5 shrink-0" />
        <p>Sisa waktu diperbarui otomatis setiap 30 detik dan saat tab kembali aktif. Perubahan data juga tersinkron antar-tab pada browser ini. Status pendaftaran perlu diperbarui olehmu; situs penyelenggara tidak dipantau otomatis.</p>
      </div>

      {formOpen && (
        <section className="space-y-4 rounded-2xl border border-amber-200 bg-white p-5 dark:border-amber-900 dark:bg-gray-900" aria-label={editingId ? "Edit peluang" : "Tambah peluang"}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editingId ? "Edit peluang" : "Tambah peluang baru"}</h2>
            <button onClick={closeForm} aria-label="Tutup formulir" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} /></button>
          </div>
          <input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder="Nama program atau kompetisi"
            aria-label="Nama program"
            maxLength={120}
            className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-700"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-gray-500">
              Jenis
              <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as OpportunityType })} className="block w-full rounded-xl border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100">
                {(Object.keys(TYPE_LABEL) as OpportunityType[]).map((type) => <option key={type} value={type}>{TYPE_LABEL[type]}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-xs text-gray-500">
              Deadline pendaftaran
              <input type="date" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} className="block w-full rounded-xl border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100" />
            </label>
          </div>
          <input
            type="url"
            value={draft.link}
            onChange={(event) => setDraft({ ...draft, link: event.target.value })}
            placeholder="https://tautan-pendaftaran.id (opsional)"
            aria-label="Tautan pendaftaran"
            className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-700"
          />
          <textarea
            value={draft.notes}
            onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            placeholder="Catatan: dokumen yang dibutuhkan, jadwal wawancara, kontak, dan lainnya"
            aria-label="Catatan peluang"
            rows={3}
            maxLength={1000}
            className="w-full resize-y rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-700"
          />
          {formError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
          <div className="flex flex-wrap gap-2">
            <button onClick={saveOpportunity} className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600"><Check size={16} /> {editingId ? "Simpan perubahan" : "Simpan peluang"}</button>
            <button onClick={closeForm} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Batal</button>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900">
            <Search size={16} className="shrink-0 text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau catatan..." aria-label="Cari peluang" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900">
            <Filter size={15} className="text-gray-400" />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as FilterType)} aria-label="Filter jenis peluang" className="bg-transparent py-2.5 text-sm outline-none">
              <option value="semua">Semua jenis</option>
              {(Object.keys(TYPE_LABEL) as OpportunityType[]).map((type) => <option key={type} value={type}>{TYPE_LABEL[type]}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900">
            <Filter size={15} className="text-gray-400" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as FilterStatus)} aria-label="Filter status" className="bg-transparent py-2.5 text-sm outline-none">
              <option value="aktif">Sedang berjalan</option>
              <option value="semua">Semua status</option>
              {(Object.keys(STATUS_LABEL) as Status[]).map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
            </select>
          </label>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-12 text-center dark:border-gray-700">
            <Award className="mx-auto mb-3 text-gray-300" size={32} />
            <p className="font-medium text-gray-600 dark:text-gray-300">{items.length === 0 ? "Belum ada peluang yang dilacak" : "Tidak ada peluang yang cocok"}</p>
            <p className="mt-1 text-sm text-gray-400">{items.length === 0 ? "Tambahkan beasiswa, magang, atau lomba agar deadline dan progresnya mudah dipantau." : "Coba ubah kata kunci atau filter."}</p>
            {items.length === 0 && <button onClick={openNewForm} className="mt-4 text-sm font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400">Tambah peluang pertama →</button>}
          </div>
        ) : (
          <ul className="space-y-3">
            {sorted.map((item) => {
              const { days, milliseconds } = getTimeLeft(item.deadline, now);
              const isActive = item.status === "belum" || item.status === "proses";
              const expired = isActive && milliseconds < 0;
              const urgent = isActive && days >= 0 && days <= 3;
              const countdownLabel = isActive
                ? expired
                  ? "Deadline lewat"
                  : days === 0
                    ? `Hari ini · ${formatTimeLeft(milliseconds)}`
                    : formatTimeLeft(milliseconds)
                : days < 0 ? "Deadline lewat" : formatTimeLeft(milliseconds);
              return (
                <li key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">{TYPE_LABEL[item.type] ?? TYPE_LABEL.lain}</span>
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${
                          expired ? "bg-gray-100 text-gray-500 dark:bg-gray-800" :
                            urgent ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" :
                              isActive ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" :
                                "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                        }`}>
                          {expired || urgent ? <Bell size={12} /> : <Clock3 size={12} />}
                          {countdownLabel}
                        </span>
                        <span className="text-xs text-gray-400">{STATUS_LABEL[item.status] ?? STATUS_LABEL.belum}</span>
                      </div>
                      <h2 className="truncate font-semibold">{item.title}</h2>
                      <p className="mt-1 text-xs text-gray-500">Deadline: {deadlineDate(item.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                      {item.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{item.notes}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <label className="sr-only" htmlFor={`status-${item.id}`}>Status {item.title}</label>
                      <select
                        id={`status-${item.id}`}
                        value={item.status}
                        onChange={(event) => updateItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: event.target.value as Status } : entry))}
                        className="max-w-full rounded-lg border border-gray-300 bg-transparent px-2 py-2 text-sm dark:border-gray-700"
                      >
                        {(Object.keys(STATUS_LABEL) as Status[]).map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
                      </select>
                      {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" aria-label={`Buka tautan ${item.title}`} title="Buka tautan pendaftaran" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"><ExternalLink size={18} /></a>}
                      <button onClick={() => openEditForm(item)} aria-label={`Edit ${item.title}`} title="Edit peluang" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><Pencil size={17} /></button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus "${item.title}" dari daftar pelacakan?`)) {
                            updateItems((current) => current.filter((entry) => entry.id !== item.id));
                          }
                        }}
                        aria-label={`Hapus ${item.title}`}
                        title="Hapus peluang"
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }: {
  icon: typeof Award;
  label: string;
  value: number;
  tone: "blue" | "amber" | "green";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    green: "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className={`rounded-xl p-2.5 ${tones[tone]}`}><Icon size={19} /></div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
