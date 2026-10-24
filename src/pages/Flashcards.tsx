import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Play,
  ArrowLeft,
  Brain,
  Search,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { getFromStorage, saveToStorage, usePersistentState } from "../lib/storage";
import type { FlashcardSet, Flashcard } from "../types";
import { v4 as uuid } from "uuid";
import { usePlan } from "../context/PlanContext";
import { Link, useNavigate } from "react-router-dom";
import { FREE_LIMITS, getFeatureUsageThisMonth, incrementFeatureUsage } from "../lib/limits";
import { dueCards, reviewCard, ensureCardDefaults } from "../lib/spaced";

export default function Flashcards() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>(() =>
    getFromStorage<FlashcardSet[]>("flashcard-sets", []).map((set) => ({
      ...set,
      cards: (set.cards ?? []).map(ensureCardDefaults),
    }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = usePersistentState("draft-flashcards-open", false);
  const [newTitle, setNewTitle] = usePersistentState("draft-flashcards-title", "");
  const [front, setFront] = usePersistentState("draft-flashcards-front", "");
  const [back, setBack] = usePersistentState("draft-flashcards-back", "");
  const [studyMode, setStudyMode] = useState(false);
  const [srMode, setSrMode] = useState(false);
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [search, setSearch] = useState("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    saveToStorage("flashcard-sets", sets);
  }, [sets]);

  const selected = sets.find((s) => s.id === selectedId);
  const totalCards = sets.reduce((a, s) => a + s.cards.length, 0);
  const freeLimit = FREE_LIMITS.flashcardCardsTotal;
  const visibleSets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return sets.filter((set) => set.title.toLocaleLowerCase("id-ID").includes(query));
  }, [search, sets]);

  const dueCount = useMemo(() => {
    if (!selected) return 0;
    return dueCards(selected.cards).length;
  }, [selected]);

  const handleCreateSet = () => {
    if (!newTitle.trim()) {
      setFormError("Masukkan judul set terlebih dahulu.");
      return;
    }
    if (!isPro && getFeatureUsageThisMonth("flashcardSets") >= FREE_LIMITS.flashcardSets) {
      navigate("/pricing");
      return;
    }
    const newSet: FlashcardSet = {
      id: uuid(),
      title: newTitle.trim(),
      cards: [],
      createdAt: new Date().toISOString(),
    };
    setSets([newSet, ...sets]);
    if (!isPro) incrementFeatureUsage("flashcardSets");
    setNewTitle("");
    setIsCreating(false);
    setSelectedId(newSet.id);
    setFormError("");
  };

  const handleAddCard = () => {
    if (!selected) return;
    if (!front.trim() || !back.trim()) {
      setFormError("Isi bagian depan dan belakang kartu.");
      return;
    }
    if (!isPro && getFeatureUsageThisMonth("flashcardCardsTotal") >= freeLimit) {
      navigate("/pricing");
      return;
    }
    const card: Flashcard = ensureCardDefaults({
      id: uuid(),
      front: front.trim(),
      back: back.trim(),
    });
    setSets(
      (current) => current.map((s) =>
        s.id === selected.id ? { ...s, cards: [...s.cards, card] } : s
      )
    );
    if (!isPro) incrementFeatureUsage("flashcardCardsTotal");
    setFront("");
    setBack("");
    setFormError("");
  };

  const startEditCard = (card: Flashcard) => {
    setEditingCardId(card.id);
    setFront(card.front);
    setBack(card.back);
    setFormError("");
  };

  const handleUpdateCard = () => {
    if (!selected || !editingCardId) return;
    if (!front.trim() || !back.trim()) {
      setFormError("Isi bagian depan dan belakang kartu.");
      return;
    }
    setSets((current) => current.map((set) => set.id === selected.id
      ? { ...set, cards: set.cards.map((card) => card.id === editingCardId
        ? { ...card, front: front.trim(), back: back.trim() }
        : card) }
      : set));
    setEditingCardId(null);
    setFront("");
    setBack("");
    setFormError("");
  };

  const cancelCardEdit = () => {
    setEditingCardId(null);
    setFront("");
    setBack("");
    setFormError("");
  };

  const handleDeleteSet = (id: string) => {
    if (confirm("Hapus set ini?")) {
      setSets((current) => current.filter((s) => s.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  const handleDeleteCard = (cardId: string) => {
    if (!selected) return;
    setSets(
      (current) => current.map((s) =>
        s.id === selected.id
          ? { ...s, cards: s.cards.filter((c) => c.id !== cardId) }
          : s
      )
    );
  };

  const startNormalStudy = () => {
    if (!selected || selected.cards.length === 0) return;
    setQueue([...selected.cards]);
    setCardIndex(0);
    setFlipped(false);
    setSrMode(false);
    setStudyMode(true);
  };

  const startSpaced = () => {
    if (!selected) return;
    const due = dueCards(selected.cards);
    if (due.length === 0) {
      alert("Tidak ada kartu jatuh tempo hari ini. Semua sudah dijadwalkan ulang!");
      return;
    }
    setQueue(due);
    setCardIndex(0);
    setFlipped(false);
    setSrMode(true);
    setStudyMode(true);
  };

  const applyReview = (quality: 0 | 1 | 2 | 3) => {
    if (!selected || !queue[cardIndex]) return;
    const updatedCard = reviewCard(queue[cardIndex], quality);
    setSets(
      (current) => current.map((s) =>
        s.id === selected.id
          ? {
              ...s,
              cards: s.cards.map((c) =>
                c.id === updatedCard.id ? updatedCard : c
              ),
            }
          : s
      )
    );
    setFlipped(false);
    if (cardIndex + 1 >= queue.length) {
      setStudyMode(false);
      setQueue([]);
    } else {
      setCardIndex((i) => i + 1);
    }
  };

  // —— Mode belajar ——
  if (studyMode && queue.length > 0) {
    const card = queue[cardIndex];
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setStudyMode(false)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
          <span className="text-sm text-gray-500">
            {srMode ? "Spaced · " : ""}
            {cardIndex + 1} / {queue.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" && !srMode) {
              setFlipped(false);
              setCardIndex((index) => (index + 1 >= queue.length ? 0 : index + 1));
            }
            if (event.key === "ArrowLeft" && !srMode) {
              setFlipped(false);
              setCardIndex((index) => (index - 1 < 0 ? queue.length - 1 : index - 1));
            }
          }}
          aria-label={`Kartu ${cardIndex + 1} dari ${queue.length}. ${flipped ? "Jawaban" : "Pertanyaan"}: ${flipped ? card.back : card.front}. Tekan Enter untuk membalik.`}
          className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-10 min-h-[260px] flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <p className="text-xl text-center font-medium">
            {flipped ? card.back : card.front}
          </p>
        </button>
        <p className="text-center text-sm text-gray-400">
          Klik atau tekan Enter untuk membalik · gunakan tombol panah untuk berpindah
        </p>

        {srMode && flipped && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { q: 0 as const, label: "Lupa", sub: "ulang", color: "bg-red-600 hover:bg-red-700" },
                { q: 1 as const, label: "Susah", sub: "+1–2 hari", color: "bg-orange-500 hover:bg-orange-600" },
                { q: 2 as const, label: "Biasa", sub: "jadwal normal", color: "bg-blue-600 hover:bg-blue-700" },
                { q: 3 as const, label: "Mudah", sub: "lebih jarang", color: "bg-green-600 hover:bg-green-700" },
              ]
            ).map((b) => (
              <button
                key={b.q}
                onClick={() => applyReview(b.q)}
                className={`${b.color} text-white rounded-xl py-3 px-2 text-sm font-medium`}
              >
                {b.label}
                <span className="block text-xs opacity-80 font-normal">{b.sub}</span>
              </button>
            ))}
          </div>
        )}

        {!srMode && (
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setFlipped(false);
                setCardIndex((i) => (i - 1 < 0 ? queue.length - 1 : i - 1));
              }}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => {
                setFlipped(false);
                setCardIndex((i) => (i + 1 >= queue.length ? 0 : i + 1));
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm"
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>
    );
  }

  // —— List set ——
  if (!selectedId) {
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold">Flashcards</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isPro ? "Unlimited" : `Free bulan ini: ${getFeatureUsageThisMonth("flashcardSets")}/${FREE_LIMITS.flashcardSets} set · ${getFeatureUsageThisMonth("flashcardCardsTotal")}/${freeLimit} kartu`} •{" "}
              {totalCards} kartu · ada mode{" "}
              <span className="text-purple-600 dark:text-purple-400 font-medium">
                Spaced Repetition
              </span>
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-900 sm:w-56">
            <Search size={15} className="text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Cari set flashcard" placeholder="Cari set..." className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
          </label>
          <button
            onClick={() => {
              if (!isPro && getFeatureUsageThisMonth("flashcardSets") >= FREE_LIMITS.flashcardSets) {
                navigate("/pricing");
                return;
              }
              setIsCreating(true);
            }}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} /> Buat Set
          </button>
          </div>
        </div>

        {isCreating && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex gap-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Judul set (contoh: Anatomi Bab 1)"
              className="flex-1 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleCreateSet}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm"
            >
              Simpan
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="text-gray-500 text-sm px-3"
            >
              Batal
            </button>
          </div>
        )}
        {formError && !selectedId && <p role="alert" className="text-sm text-red-600">{formError}</p>}

        {visibleSets.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {search ? "Tidak ada set yang cocok dengan pencarian." : "Belum ada set flashcard"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleSets.map((s) => {
              const due = dueCards(s.cards).length;
              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <button onClick={() => setSelectedId(s.id)} className="text-left font-semibold hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{s.title}</button>
                      <p className="text-sm text-gray-500 mt-1">
                        {s.cards.length} kartu
                        {due > 0 && (
                          <span className="text-purple-600 dark:text-purple-400">
                            {" "}
                            · {due} jatuh tempo
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSet(s.id)}
                      aria-label={`Hapus set ${s.title}`}
                      className="shrink-0 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isPro && (
          <p className="text-sm text-center text-gray-500">
            Butuh lebih banyak?{" "}
            <Link to="/pricing" className="text-blue-600 hover:underline">
              Upgrade ke Pro
            </Link>
          </p>
        )}
      </div>
    );
  }

  // —— Detail set ——
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedId(null)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">{selected?.title}</h1>
            <p className="text-sm text-gray-500">
              {selected?.cards.length} kartu
              {dueCount > 0 && (
                <span className="text-purple-600"> · {dueCount} jatuh tempo</span>
              )}
            </p>
          </div>
        </div>
        {selected && selected.cards.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={startSpaced}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl hover:bg-purple-700 text-sm font-medium"
            >
              <Brain size={18} /> Review (Spaced)
            </button>
            <button
              onClick={startNormalStudy}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 text-sm font-medium"
            >
              <Play size={18} /> Belajar biasa
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-4 text-sm text-purple-900 dark:text-purple-100">
        <strong>Spaced Repetition:</strong> setelah membalik kartu, pilih Lupa /
        Susah / Biasa / Mudah. Kartu sulit muncul lebih sering; yang mudah lebih
        jarang — mirip sistem Anki.
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-medium">{editingCardId ? "Edit kartu" : "Tambah kartu"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            aria-label="Sisi depan kartu"
            maxLength={2000}
            placeholder="Depan (pertanyaan)"
            className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 h-24 resize-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            aria-label="Sisi belakang kartu"
            maxLength={2000}
            placeholder="Belakang (jawaban)"
            className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 h-24 resize-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
        <div className="flex gap-2">
          <button
            onClick={editingCardId ? handleUpdateCard : handleAddCard}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-blue-700"
          >
            {editingCardId ? <><Check size={15} /> Simpan perubahan</> : <><Plus size={15} /> Tambah</>}
          </button>
          {editingCardId && <button onClick={cancelCardEdit} className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300"><X size={15} /> Batal</button>}
        </div>
      </div>

      <div className="space-y-2">
        {selected?.cards.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex justify-between gap-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1 text-sm">
              <div>
                <p className="text-xs text-gray-400">Depan</p>
                <p>{c.front}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Belakang</p>
                <p>{c.back}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-start gap-1">
              <button onClick={() => startEditCard(c)} aria-label={`Edit kartu ${c.front}`} title="Edit kartu" className="rounded-lg p-1.5 text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
              <button
                onClick={() => {
                  if (confirm("Hapus kartu ini?")) handleDeleteCard(c.id);
                }}
                aria-label={`Hapus kartu ${c.front}`}
                className="rounded-lg p-1.5 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
