import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Play, ArrowLeft, CheckCircle, XCircle, Search, Pencil, Check, X } from "lucide-react";
import { getFromStorage, saveToStorage, usePersistentState } from "../lib/storage";
import type { QuizSet, QuizQuestion } from "../types";
import { v4 as uuid } from "uuid";
import { usePlan } from "../context/PlanContext";
import { Link, useNavigate } from "react-router-dom";
import { FREE_LIMITS, canUseFeature, incrementFeatureUsage, getFeatureUsageThisMonth } from "../lib/limits";

export default function Quiz() {
  const { isPro } = usePlan();
  const navigate = useNavigate();
  const [sets, setSets] = useState<QuizSet[]>(() => getFromStorage("quiz-sets", []));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = usePersistentState("draft-quiz-open", false);
  const [newTitle, setNewTitle] = usePersistentState("draft-quiz-title", "");
  const [question, setQuestion] = usePersistentState("draft-quiz-question", "");
  const [options, setOptions] = usePersistentState("draft-quiz-options", ["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    saveToStorage("quiz-sets", sets);
  }, [sets]);

  const current = sets.find((s) => s.id === selectedId);
  const visibleSets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return sets.filter((set) => set.title.toLocaleLowerCase("id-ID").includes(query));
  }, [search, sets]);

  const handleCreate = () => {
    if (!newTitle.trim()) {
      setFormError("Masukkan judul kuis terlebih dahulu.");
      return;
    }
    if (!canUseFeature(isPro, "quizSets")) {
      navigate("/pricing");
      return;
    }
    const s: QuizSet = { id: uuid(), title: newTitle.trim(), questions: [], createdAt: new Date().toISOString() };
    setSets((currentSets) => [s, ...currentSets]);
    if (!isPro) incrementFeatureUsage("quizSets");
    setNewTitle("");
    setIsCreating(false);
    setSelectedId(s.id);
    setFormError("");
  };

  const handleAddQ = () => {
    if (!current) return;
    if (!question.trim() || options.some((option) => !option.trim())) {
      setFormError("Isi pertanyaan dan keempat pilihan jawaban.");
      return;
    }
    if (new Set(options.map((option) => option.trim().toLocaleLowerCase("id-ID"))).size !== options.length) {
      setFormError("Setiap pilihan jawaban harus berbeda.");
      return;
    }
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
      setFormError("Pilih jawaban yang benar.");
      return;
    }
    if (!editingQuestionId && !canUseFeature(isPro, "quizQuestions")) {
      navigate("/pricing");
      return;
    }
    const q: QuizQuestion = {
      id: editingQuestionId ?? uuid(),
      question: question.trim(),
      options: options.map((o) => o.trim()),
      correctAnswer: correct,
    };
    setSets((currentSets) => currentSets.map((s) => (s.id === current.id
      ? { ...s, questions: editingQuestionId
        ? s.questions.map((existing) => existing.id === editingQuestionId ? q : existing)
        : [...s.questions, q] }
      : s)));
    if (!isPro && !editingQuestionId) incrementFeatureUsage("quizQuestions");
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
    setEditingQuestionId(null);
    setFormError("");
  };

  const editQuestion = (q: QuizQuestion) => {
    setEditingQuestionId(q.id);
    setQuestion(q.question);
    setOptions([...q.options]);
    setCorrect(q.correctAnswer);
    setFormError("");
  };

  const cancelQuestionEdit = () => {
    setEditingQuestionId(null);
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
    setFormError("");
  };

  const startQuiz = () => {
    if (!current || current.questions.length === 0) return;
    setQuizMode(true);
    setIdx(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setShowResult(false);
    setResponses({});
  };

  if (quizMode && showResult && current) {
    const pct = Math.round((score / current.questions.length) * 100);
    return (
      <div className="w-full text-center space-y-6 py-10">
        <h1 className="text-3xl font-bold">Hasil Kuis</h1>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
          <p className="text-5xl font-bold text-blue-600">{pct}%</p>
          <p className="text-gray-500 mt-2">
            Benar {score} dari {current.questions.length} soal
          </p>
        </div>
        <div className="space-y-2 text-left">
          {current.questions.map((q, questionIndex) => {
            const response = responses[q.id];
            const isCorrect = response === q.correctAnswer;
            return (
              <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm font-medium">{questionIndex + 1}. {q.question}</p>
                <p className={`mt-1 text-sm ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                  Jawabanmu: {response === undefined ? "Tidak dijawab" : q.options[response]}
                </p>
                {!isCorrect && <p className="text-sm text-green-600">Jawaban benar: {q.options[q.correctAnswer]}</p>}
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setShowResult(false);
              setIdx(0);
              setScore(0);
              setSelected(null);
              setAnswered(false);
              setResponses({});
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
      <div className="w-full space-y-6">
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
                    setResponses((currentResponses) => ({ ...currentResponses, [q.id]: i }));
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
      <div className="w-full space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Quiz</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isPro ? "Unlimited" : `Free bulan ini: ${getFeatureUsageThisMonth("quizSets")}/${FREE_LIMITS.quizSets} kuis · ${getFeatureUsageThisMonth("quizQuestions")}/${FREE_LIMITS.quizQuestions} soal`}
            </p>
          </div>
          <div className="flex gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-900">
            <Search size={15} className="text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Cari set kuis" placeholder="Cari kuis..." className="w-28 bg-transparent py-2 text-sm outline-none sm:w-40" />
          </label>
          <button onClick={() => { if (!canUseFeature(isPro, "quizSets")) { navigate("/pricing"); return; } setFormError(""); setIsCreating(true); }} className="flex shrink-0 items-center gap-2 bg-blue-600 px-4 py-2.5 rounded-xl text-sm text-white">
            <Plus size={18} /> Buat Kuis
          </button>
          </div>
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
        {formError && !selectedId && <p role="alert" className="text-sm text-red-600">{formError}</p>}
        {visibleSets.length === 0 ? (
          <div className="text-center py-20 text-gray-400">{search ? "Tidak ada kuis yang cocok." : "Belum ada kuis"}</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleSets.map((s) => (
              <div key={s.id} className="bg-white dark:bg-gray-900 border rounded-2xl p-5 hover:shadow-md">
                <div className="flex justify-between">
                  <div>
                    <button onClick={() => setSelectedId(s.id)} className="text-left font-semibold hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{s.title}</button>
                    <p className="text-sm text-gray-500 mt-1">{s.questions.length} soal</p>
                  </div>
                  <button aria-label={`Hapus kuis ${s.title}`} onClick={() => { if (confirm(`Hapus kuis "${s.title}"?`)) setSets((currentSets) => currentSets.filter((x) => x.id !== s.id)); }} className="text-gray-400 hover:text-red-500">
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
    <div className="w-full space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-bold">{current?.title}</h1>
            <p className="text-sm text-gray-500">{current?.questions.length} soal</p>
          </div>
        </div>
        {current && current.questions.length > 0 && (
          <button onClick={startQuiz} className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm text-white sm:w-auto">
            <Play size={18} /> Mulai Kuis
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border rounded-2xl p-5 space-y-4">
        <h3 className="font-medium">{editingQuestionId ? "Edit soal" : "Tambah soal"}</h3>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} aria-label="Pertanyaan kuis" maxLength={2000} placeholder="Pertanyaan..." className="w-full border rounded-xl px-4 py-2 h-20 resize-none bg-transparent focus:ring-2 focus:ring-blue-500 outline-none" />
        <div className="grid sm:grid-cols-2 gap-2">
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" aria-label={`Tandai pilihan ${String.fromCharCode(65 + i)} sebagai jawaban benar`} checked={correct === i} onChange={() => setCorrect(i)} className="accent-blue-600" />
              <input value={o} maxLength={500} aria-label={`Pilihan ${String.fromCharCode(65 + i)}`} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} placeholder={`Pilihan ${String.fromCharCode(65 + i)}`} className="flex-1 border rounded-lg px-3 py-2 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">Centang radio untuk jawaban benar</p>
        {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
        <div className="flex gap-2">
          <button onClick={handleAddQ} className="flex items-center gap-1.5 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm">{editingQuestionId ? <><Check size={15} /> Simpan perubahan</> : <><Plus size={15} /> Tambah soal</>}</button>
          {editingQuestionId && <button onClick={cancelQuestionEdit} className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm"><X size={15} /> Batal</button>}
        </div>
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
            <div className="flex shrink-0 gap-1">
              <button onClick={() => editQuestion(q)} aria-label={`Edit soal ${i + 1}`} title="Edit soal" className="rounded-lg p-1.5 text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
              <button onClick={() => { if (confirm("Hapus soal ini?")) setSets((currentSets) => currentSets.map((s) => s.id === current.id ? { ...s, questions: s.questions.filter((x) => x.id !== q.id) } : s)); }} aria-label={`Hapus soal ${i + 1}`} className="rounded-lg p-1.5 text-gray-400 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
