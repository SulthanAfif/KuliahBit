import { Check, Crown, X } from "lucide-react";
import { usePlan } from "../context/PlanContext";
import { FREE_LIMITS } from "../lib/limits";

const FREE_FEATURES = [
  { text: "Tugas, jadwal, agenda, absensi, prioritas", ok: true },
  { text: "IPK & kalkulator nilai akhir", ok: true },
  { text: `Flashcard max ${FREE_LIMITS.flashcardSets} set / ${FREE_LIMITS.flashcardCardsTotal} kartu`, ok: true },
  { text: `Quiz max ${FREE_LIMITS.quizSets} set`, ok: true },
  { text: `AI (ringkas, cram, outline, dll) ${FREE_LIMITS.aiPerMonth}×/bulan`, ok: true },
  { text: `Bank soal/materi max ${FREE_LIMITS.bankItems} item`, ok: true },
  { text: `Catatan max ${FREE_LIMITS.notes}`, ok: true },
  { text: `PDF max ${FREE_LIMITS.pdfMaxMb} MB (teks terbatas)`, ok: true },
  { text: "Surat kilat, konverter dasar, hitung kata", ok: true },
  { text: "CV unduh teks", ok: true },
  { text: "AI unlimited", ok: false },
  { text: "PDF besar + presentasi .pptx unlimited", ok: false },
  { text: "Bank & catatan unlimited", ok: false },
];

const PRO_FEATURES = [
  "AI unlimited (ringkas, cram, parafrase, outline, slide)",
  "Flashcard, quiz, bank, catatan unlimited",
  `PDF lebih besar (tanpa potong ${FREE_LIMITS.pdfMaxChars} karakter)`,
  "Generate & unduh presentasi .pptx",
  "CV & portfolio siap kerja",
  "Prioritas support fitur baru",
  "Tanpa batas harian",
];

export default function Pricing() {
  const { isPro, activatePro, deactivatePro } = usePlan();

  return (
    <div className="w-full space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Crown className="text-amber-500" size={28} />
          Free vs Pro
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Free tetap lengkap untuk kuliah sehari-hari. Pro untuk AI & arsip tanpa batas.
        </p>
        {isPro && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-full">
            <Crown size={14} /> Pro aktif di perangkat ini
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold">Free</h2>
          <p className="text-3xl font-bold mt-2">
            Rp 0<span className="text-sm font-normal text-gray-400">/selamanya</span>
          </p>
          <ul className="mt-6 space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-2 text-sm">
                {f.ok ? (
                  <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <X size={16} className="text-gray-300 shrink-0 mt-0.5" />
                )}
                <span className={f.ok ? "" : "text-gray-400"}>{f.text}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => isPro && deactivatePro()}
            className={`mt-6 w-full py-2.5 rounded-xl text-sm font-medium ${
              !isPro
                ? "bg-gray-100 dark:bg-gray-800 text-gray-600"
                : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {!isPro ? "Paket saat ini" : "Kembali ke Free"}
          </button>
        </div>

        {/* Pro */}
        <div className="bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/40 dark:to-gray-900 border-2 border-amber-400 dark:border-amber-600 rounded-2xl p-6 shadow-md relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Direkomendasikan
          </span>
          <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100">Pro</h2>
          <p className="text-3xl font-bold mt-2">
            Rp 25rb
            <span className="text-sm font-normal text-gray-400">/bulan</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">atau ~Rp 99rb / semester (contoh)</p>
          <ul className="mt-6 space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={isPro}
            onClick={() => activatePro(30)}
            className="mt-6 w-full py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 disabled:opacity-70"
          >
            {isPro ? "Pro sudah aktif ✓" : "Coba Pro (Demo 30 hari)"}
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 space-y-1">
        <p>Demo Pro disimpan di browser ini (localStorage). Midtrans bisa ditambah nanti.</p>
        <p>Tidak perlu kartu kredit untuk coba demo.</p>
      </div>
    </div>
  );
}
