import { useEffect, useState } from "react";
import { Check, Crown, MessageSquareText, Send, X } from "lucide-react";
import { usePlan } from "../context/PlanContext";
import { FREE_LIMITS, PRO_LIMITS } from "../lib/limits";

const FREE_FEATURES = [
  { text: "Tugas, agenda, absensi, beasiswa/magang, dan laporan praktikum", ok: true },
  { text: "Kalkulator nilai, daftar pustaka, konverter, dan alat dokumen", ok: true },
  { text: `AI ${FREE_LIMITS.aiPerMonth} kali per bulan: ringkasan, Tanya AI, Cram, parafrase, outline, dan slide`, ok: true },
  { text: `Flashcard: ${FREE_LIMITS.flashcardSets} set dan ${FREE_LIMITS.flashcardCardsTotal} kartu per bulan`, ok: true },
  { text: `Kuis: ${FREE_LIMITS.quizSets} set dan ${FREE_LIMITS.quizQuestions} soal per bulan`, ok: true },
  { text: `Bank soal/materi: ${FREE_LIMITS.bankItems} item per bulan`, ok: true },
  { text: `Catatan: ${FREE_LIMITS.notes} catatan baru per bulan`, ok: true },
  { text: `Impor PDF: ${FREE_LIMITS.pdfUploadsPerMonth} kali per bulan, maks. ${FREE_LIMITS.pdfMaxMb} MB dan ${FREE_LIMITS.pdfMaxChars.toLocaleString("id-ID")} karakter teks per file`, ok: true },
  { text: `Semua unduhan PDF: ${FREE_LIMITS.pdfExports} kali per bulan total`, ok: true },
  { text: `Unduh teks CV: ${FREE_LIMITS.cvExports} kali per bulan`, ok: true },
  { text: "Kuota AI, impor/unduh PDF, flashcard, kuis, bank materi, dan catatan tanpa batas", ok: false },
  { text: "Template CV premium", ok: false },
];

const PRO_FEATURES = [
  "Semua fitur Free, dengan AI tanpa kuota bulanan",
  "Flashcard, kuis, bank soal/materi, dan catatan tanpa kuota bulanan",
  `Impor PDF tanpa kuota bulanan, maks. ${PRO_LIMITS.pdfMaxMb} MB dan ${PRO_LIMITS.pdfMaxChars.toLocaleString("id-ID")} karakter teks per file`,
  "Semua template CV, termasuk template premium",
  "Unduh PDF tanpa kuota bulanan",
  "Langganan Pro berlaku 1 bulan",
];

export default function Pricing() {
  const { isPro, expiresAt, refreshPlan } = usePlan();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<"review" | "support">("review");
  const [rating, setRating] = useState("5");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("payment") !== "return") return;
    setMessage("Memeriksa pembayaran…");
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      void refreshPlan().then((active) => {
        if (active) {
          window.clearInterval(timer);
          setMessage("Pembayaran berhasil. Pro aktif selama satu bulan.");
          window.history.replaceState({}, "", window.location.pathname);
        } else if (attempts >= 24) {
          window.clearInterval(timer);
          setMessage("Pembayaran belum terkonfirmasi. Jika sudah membayar, tunggu beberapa saat lalu muat ulang halaman ini.");
        }
      });
    }, 5000);
    void refreshPlan().then((active) => {
      if (active) setMessage("Pembayaran berhasil. Pro aktif selama satu bulan.");
    });
    return () => window.clearInterval(timer);
  }, [refreshPlan]);

  const startCheckout = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/doku-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout tidak dapat dimulai.");
      window.location.assign(data.paymentUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout tidak dapat dimulai.");
      setBusy(false);
    }
  };

  const submitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedbackBusy(true);
    setFeedbackNotice("");
    try {
      const response = await fetch("/api/pro-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          type: feedbackType,
          rating: feedbackType === "review" ? Number(rating) : null,
          message: feedbackMessage,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ulasan atau dukungan tidak dapat dikirim.");
      setFeedbackMessage("");
      setFeedbackNotice("Terima kasih! Pesanmu sudah terkirim ke dashboard admin.");
    } catch (error) {
      setFeedbackNotice(error instanceof Error ? error.message : "Ulasan atau dukungan tidak dapat dikirim.");
    } finally {
      setFeedbackBusy(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold">
          <Crown className="text-amber-500" size={28} />
          Paket Free dan Pro
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Free menyediakan kuota bulanan yang cukup untuk mencoba alat belajar. Pro menghapus kuota bulanan dan menaikkan batas ukuran PDF.
        </p>
        {isPro && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <Crown size={14} /> Pro aktif sampai {new Date(expiresAt!).toLocaleDateString("id-ID")}
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-bold">Free</h2>
          <p className="mt-2 text-3xl font-bold">Rp 0<span className="text-sm font-normal text-gray-400">/selamanya</span></p>
          <ul className="mt-6 space-y-2.5">
            {FREE_FEATURES.map((feature) => (
              <li key={feature.text} className="flex items-start gap-2 text-sm">
                {feature.ok ? <Check size={16} className="mt-0.5 shrink-0 text-green-500" /> : <X size={16} className="mt-0.5 shrink-0 text-gray-300" />}
                <span className={feature.ok ? "" : "text-gray-400"}>{feature.text}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled
            className="mt-6 w-full rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-600 dark:bg-gray-800"
          >
            {isPro ? "Pro aktif" : "Paket Free"}
          </button>
        </div>

        <div className="relative rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-white p-6 shadow-md dark:border-amber-600 dark:from-amber-950/40 dark:to-gray-900">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">Bulanan</span>
          <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100">Pro</h2>
          <p className="mt-2 text-3xl font-bold">Rp25.000<span className="text-sm font-normal text-gray-400">/bulan</span></p>
          <ul className="mt-6 space-y-2.5">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <label className="mt-6 block text-sm font-medium" htmlFor="billing-email">Email untuk kuitansi dan informasi pembayaran</label>
          <input id="billing-email" type="email" autoComplete="email" required maxLength={128} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950" />
          <button
            type="button"
            disabled={busy || isPro}
            onClick={() => void startCheckout()}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPro ? "Pro sudah aktif" : busy ? "Membuka pembayaran…" : "Bayar Rp25.000 via DOKU"}
          </button>
        </div>
      </div>

      {isPro && (
        <section className="mx-auto w-full max-w-2xl rounded-2xl border border-amber-200 bg-white p-5 shadow-sm dark:border-amber-900 dark:bg-gray-900 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"><MessageSquareText size={20} /></div>
            <div>
              <h2 className="font-semibold">Ulasan dan dukungan Pro</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Kirim masukan atau pertanyaan langsung ke admin KuliahBit.</p>
            </div>
          </div>
          <form onSubmit={submitFeedback} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Jenis pesan
                <select value={feedbackType} onChange={(event) => setFeedbackType(event.target.value as "review" | "support")} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-950">
                  <option value="review">Ulasan</option>
                  <option value="support">Dukungan / bantuan</option>
                </select>
              </label>
              {feedbackType === "review" && (
                <label className="text-sm font-medium">Rating
                  <select value={rating} onChange={(event) => setRating(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-950">
                    <option value="5">5 — Sangat puas</option>
                    <option value="4">4 — Puas</option>
                    <option value="3">3 — Cukup</option>
                    <option value="2">2 — Kurang puas</option>
                    <option value="1">1 — Tidak puas</option>
                  </select>
                </label>
              )}
            </div>
            <label className="block text-sm font-medium" htmlFor="pro-feedback-message">{feedbackType === "review" ? "Ceritakan pengalamanmu" : "Apa yang bisa kami bantu?"}
              <textarea id="pro-feedback-message" required minLength={10} maxLength={2000} rows={4} value={feedbackMessage} onChange={(event) => setFeedbackMessage(event.target.value)} placeholder="Tulis pesanmu (10–2.000 karakter)" className="mt-2 w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950" />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p role="status" className="text-sm text-amber-700 dark:text-amber-400">{feedbackNotice}</p>
              <button type="submit" disabled={feedbackBusy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60">
                <Send size={15} /> {feedbackBusy ? "Mengirim…" : "Kirim ke admin"}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="space-y-1 text-center text-xs text-gray-400">
        <p>Setiap pembayaran mengaktifkan Pro selama satu bulan. Perpanjangan dilakukan dengan pembayaran berikutnya.</p>
        {message && <p role="status" className="mx-auto max-w-xl pt-2 text-sm text-amber-700 dark:text-amber-400">{message}</p>}
      </div>
    </div>
  );
}
