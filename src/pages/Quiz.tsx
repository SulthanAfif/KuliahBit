import { useState, useEffect } from "react";
import { Plus, Trash2, Play, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { getFromStorage, saveToStorage } from "../lib/storage";
import type { QuizSet, QuizQuestion } from "../types";
import { v4 as uuid } from "uuid";
import { usePlan } from "../context/PlanContext";
import { Link, useNavigate } from "react-router-dom";
import { FREE_LIMITS } from "../lib/limits";

export default function Quiz() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [sets, setSets] = useState<QuizSet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setSets(getFromStorage("quiz-sets", []));
  }, []);
  useEffect(() => {
    saveToStorage("quiz-sets", sets);
  }, [sets]);

  const current = sets.find((s) => s.id === selectedId);
  const totalQ = sets.reduce((a, s) => a + s.questions.length, 0);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    if (!isPro && sets.length >= FREE_LIMITS.quizSets) {
      navigate("/pricing");
      return;
    }
    const s: QuizSet = { id: uuid(), title: newTitle.trim(), questions: [], createdAt: new Date().toISOString() };
    setSets([s, ...sets]);
    setNewTitle("");
    setIsCreating(false);
    setSelectedId(s.id);
  };

  const handleAddQ = () => {
    if (!current || !question.trim() || options.some((o) => !o.trim())) return;
    if (!isPro && totalQ >= FREE_LIMITS.quizSets) {
      navigate("/pricing");
      return;
    }
    const q: QuizQuestion = {
      id: uuid(),
      question: question.trim(),
      options: options.map((o) => o.trim()),
      correctAnswer: correct,
    };
    setSets(sets.map((s) => (s.id === current.id ? { ...s, questions: [...s.questions, q] } : s)));
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
  };

  const startQuiz = () => {
    if (!current || current.questions.length === 0) return;
    setQuizMode(true);
    setIdx(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setShowResult(false);
  };

  if (quizMode && showResult && current) {
    const pct = Math.round((score / current.questions.length) * 100);
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-10">
        <h1 className="text-3xl font-bold">Hasil Kuis</h1>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
          <p className="text-5xl font-bold text-blue-600">{pct}%</p>
          <p className="text-gray-500 mt-2">
            Benar {score} dari {current.questions.length} soal
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setShowResult(false);
              setIdx(0);
              setScore(0);
              setSelected(null);
              setAnswered(false);
            }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl"
          >
            Ulangi
          </button>
          <button onClick={() => setQuizMode(false)} className="px-5 py-2.5 border rounded-xl">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (quizMode && current) {
    const q = current.questions[idx];
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between text-sm text-gray-500">
          <button onClick={() => setQuizMode(false)} className="flex items-center gap-1 hover:text-gray-800">
            <ArrowLeft size={16} /> Keluar
          </button>
          <span>
            {idx + 1} / {current.questions.length}
          </span>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-semibold">{q.question}</h2>
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              let cls = "border-gray-200 dark:border-gray-700 hover:border-blue-400";
              if (answered) {
                if (i === q.correctAnswer) cls = "border-green-500 bg-green-50 dark:bg-green-950";
                else if (i === selected) cls = "border-red-500 bg-red-50 dark:bg-red-950";
                else cls = "opacity-50";
              } else if (selected === i) cls = "border-blue-500 bg-blue-50 dark:bg-blue-950";
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (answered) return;
                    setSelected(i);
                    setAnswered(true);
                    if (i === q.correctAnswer) setScore((s) => s + 1);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition ${cls}`}
                >
                  <span className="font-medium text-gray-500 mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                  {answered && i === q.correctAnswer && <CheckCircle className="inline ml-2 text-green-600" size={16} />}
                  {answered && i === selected && i !== q.correctAnswer && <XCircle className="inline ml-2 text-red-600" size={16} />}
                </button>
              );
            })}
          </div>
        </div>
        {answered && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (idx + 1 >= current.questions.length) setShowResult(true);
                else {
                  setIdx((i) => i + 1);
                  setSelected(null);
                  setAnswered(false);
                }
              }}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl"
            >
              {idx + 1 >= current.questions.length ? "Lihat Hasil" : "Berikutnya"}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!selectedId) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Quiz</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isPro ? "Unlimited" : `Free: max ${FREE_LIMITS.quizSets} kuis / ${FREE_LIMITS.quizSets} soal`}
            </p>
          </div>
          <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm">
            <Plus size={18} /> Buat Kuis
          </button>
        </div>
        {isCreating && (
          <div className="flex gap-3 bg-white dark:bg-gray-900 border rounded-2xl p-4">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Judul kuis"
              className="flex-1 border rounded-xl px-4 py-2 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
            <button onClick={handleCreate} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm">Simpan</button>
            <button onClick={() => setIsCreating(false)} className="text-gray-500 text-sm">Batal</button>
          </div>
        )}
        {sets.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Belum ada kuis</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.map((s) => (
              <div key={s.id} onClick={() => setSelectedId(s.id)} className="bg-white dark:bg-gray-900 border rounded-2xl p-5 cursor-pointer hover:shadow-md">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{s.questions.length} soal</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm("Hapus?")) setSets(sets.filter(x => x.id !== s.id)); }} className="text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!isPro && <p className="text-center text-sm text-gray-500"><Link to="/pricing" className="text-blue-600 hover:underline">Upgrade Pro</Link> untuk unlimited</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold">{current?.title}</h1>
            <p className="text-sm text-gray-500">{current?.questions.length} soal</p>
          </div>
        </div>
        {current && current.questions.length > 0 && (
          <button onClick={startQuiz} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm">
            <Play size={18} /> Mulai Kuis
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border rounded-2xl p-5 space-y-4">
        <h3 className="font-medium">Tambah Soal</h3>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Pertanyaan..." className="w-full border rounded-xl px-4 py-2 h-20 resize-none bg-transparent focus:ring-2 focus:ring-blue-500 outline-none" />
        <div className="grid sm:grid-cols-2 gap-2">
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} className="accent-blue-600" />
              <input value={o} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} placeholder={`Pilihan ${String.fromCharCode(65 + i)}`} className="flex-1 border rounded-lg px-3 py-2 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">Centang radio untuk jawaban benar</p>
        <button onClick={handleAddQ} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm">Tambah Soal</button>
      </div>

      <div className="space-y-2">
        {current?.questions.map((q, i) => (
          <div key={q.id} className="bg-white dark:bg-gray-900 border rounded-xl p-4 flex justify-between gap-4">
            <div>
              <p className="font-medium text-sm">{i + 1}. {q.question}</p>
              <ul className="mt-1 text-xs text-gray-500 space-y-0.5">
                {q.options.map((o, j) => (
                  <li key={j} className={j === q.correctAnswer ? "text-green-600 font-medium" : ""}>
                    {String.fromCharCode(65 + j)}. {o} {j === q.correctAnswer && "✓"}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => setSets(sets.map(s => s.id === current.id ? { ...s, questions: s.questions.filter(x => x.id !== q.id) } : s))} className="text-gray-400 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
