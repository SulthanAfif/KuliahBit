import { useState, useEffect } from "react";
import { Plus, Trash2, Play, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import type { FlashcardSet, Flashcard } from "../types";
import { v4 as uuid } from "uuid";
import { usePlan } from "../context/PlanContext";
import { Link, useNavigate } from "react-router-dom";
import { FREE_LIMITS } from "../lib/limits";

export default function Flashcards() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [studyMode, setStudyMode] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setSets(getFromStorage("flashcard-sets", []));
  }, []);

  useEffect(() => {
    saveToStorage("flashcard-sets", sets);
  }, [sets]);

  const selected = sets.find((s) => s.id === selectedId);
  const totalCards = sets.reduce((a, s) => a + s.cards.length, 0);
  const freeLimit = FREE_LIMITS.flashcardCardsTotal;

  const handleCreateSet = () => {
    if (!newTitle.trim()) return;
    if (!isPro && sets.length >= FREE_LIMITS.flashcardSets) {
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
    setNewTitle("");
    setIsCreating(false);
    setSelectedId(newSet.id);
  };

  const handleAddCard = () => {
    if (!selected || !front.trim() || !back.trim()) return;
    if (!isPro && totalCards >= freeLimit) {
      navigate("/pricing");
      return;
    }
    const card: Flashcard = { id: uuid(), front: front.trim(), back: back.trim() };
    setSets(
      sets.map((s) =>
        s.id === selected.id ? { ...s, cards: [...s.cards, card] } : s
      )
    );
    setFront("");
    setBack("");
  };

  const handleDeleteSet = (id: string) => {
    if (confirm("Hapus set ini?")) {
      setSets(sets.filter((s) => s.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  const handleDeleteCard = (cardId: string) => {
    if (!selected) return;
    setSets(
      sets.map((s) =>
        s.id === selected.id
          ? { ...s, cards: s.cards.filter((c) => c.id !== cardId) }
          : s
      )
    );
  };

  // Study mode
  if (studyMode && selected && selected.cards.length > 0) {
    const card = selected.cards[cardIndex];
    return (
      <div className="w-full space-y-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setStudyMode(false)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
          <span className="text-sm text-gray-500">
            {cardIndex + 1} / {selected.cards.length}
          </span>
        </div>
        <div
          onClick={() => setFlipped(!flipped)}
          className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-10 min-h-[260px] flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition"
        >
          <p className="text-xl text-center font-medium">
            {flipped ? card.back : card.front}
          </p>
        </div>
        <p className="text-center text-sm text-gray-400">Klik kartu untuk membalik</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setFlipped(false);
              setCardIndex((i) => (i - 1 < 0 ? selected.cards.length - 1 : i - 1));
            }}
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => setFlipped(!flipped)}
            className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={() => {
              setFlipped(false);
              setCardIndex((i) => (i + 1 >= selected.cards.length ? 0 : i + 1));
            }}
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // List sets
  if (!selectedId) {
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold">Flashcards</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isPro ? "Unlimited" : `Free: max 3 set / ${freeLimit} kartu`} • {totalCards} kartu
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
          >
            <Plus size={18} /> Buat Set
          </button>
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
            <button onClick={handleCreateSet} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm">
              Simpan
            </button>
            <button onClick={() => setIsCreating(false)} className="text-gray-500 text-sm px-3">
              Batal
            </button>
          </div>
        )}

        {sets.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Belum ada set flashcard</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{s.cards.length} kartu</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSet(s.id);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
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

  // Detail set
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">{selected?.title}</h1>
            <p className="text-sm text-gray-500">{selected?.cards.length} kartu</p>
          </div>
        </div>
        {selected && selected.cards.length > 0 && (
          <button
            onClick={() => {
              setStudyMode(true);
              setCardIndex(0);
              setFlipped(false);
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 text-sm font-medium"
          >
            <Play size={18} /> Mulai Belajar
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-medium">Tambah Kartu</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="Depan (pertanyaan)"
            className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 h-24 resize-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Belakang (jawaban)"
            className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 h-24 resize-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button onClick={handleAddCard} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-blue-700">
          Tambah Kartu
        </button>
      </div>

      <div className="space-y-2">
        {selected?.cards.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex gap-4"
          >
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Depan</p>
                <p>{c.front}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Belakang</p>
                <p>{c.back}</p>
              </div>
            </div>
            <button onClick={() => handleDeleteCard(c.id)} className="text-gray-400 hover:text-red-500 shrink-0">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
