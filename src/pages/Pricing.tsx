import { Check, Crown, X } from "lucide-react";
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
  { text: "CV dengan template Klasik", ok: true },
  { text: "Kuota AI, impor PDF, flashcard, kuis, bank materi, dan catatan tanpa batas", ok: false },
  { text: "Template CV premium", ok: false },
];

const PRO_FEATURES = [
  "Semua fitur Free, dengan AI tanpa kuota bulanan",
  "Flashcard, kuis, bank soal/materi, dan catatan tanpa kuota bulanan",
  `Impor PDF tanpa kuota bulanan, maks. ${PRO_LIMITS.pdfMaxMb} MB dan ${PRO_LIMITS.pdfMaxChars.toLocaleString("id-ID")} karakter teks per file`,
  "Semua template CV, termasuk template premium",
  "Status Pro demo berlaku 30 hari dan tersimpan di browser ini",
];

export default function Pricing() {
  const { isPro, activatePro, deactivatePro } = usePlan();

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
            <Crown size={14} /> Pro aktif di perangkat ini
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
            onClick={() => isPro && deactivatePro()}
            className={`mt-6 w-full rounded-xl py-2.5 text-sm font-medium ${!isPro ? "bg-gray-100 text-gray-600 dark:bg-gray-800" : "border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"}`}
          >
            {!isPro ? "Paket saat ini" : "Kembali ke Free"}
          </button>
        </div>

        <div className="relative rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-white p-6 shadow-md dark:border-amber-600 dark:from-amber-950/40 dark:to-gray-900">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">Demo</span>
          <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100">Pro</h2>
          <p className="mt-2 text-3xl font-bold">30 hari<span className="text-sm font-normal text-gray-400">/demo gratis</span></p>
          <ul className="mt-6 space-y-2.5">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={isPro}
            onClick={() => activatePro(30)}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-70"
          >
            {isPro ? "Pro sudah aktif ✓" : "Aktifkan demo Pro 30 hari"}
          </button>
        </div>
      </div>

      <div className="space-y-1 text-center text-xs text-gray-400">
        <p>Pro saat ini hanya simulasi lokal dan belum ada pembayaran atau penagihan.</p>
        <p>Status paket tersimpan di browser ini dan tidak tersinkron ke perangkat lain.</p>
      </div>
    </div>
  );
}
