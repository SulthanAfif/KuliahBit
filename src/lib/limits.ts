import { getFromStorage, saveToStorage } from "./storage";

/** Kuota bulanan paket Free. */
export const FREE_LIMITS = {
  aiPerMonth: 3,
  pdfUploadsPerMonth: 3,
  flashcardSets: 3,
  flashcardCardsTotal: 3,
  quizSets: 3,
  quizQuestions: 3,
  bankItems: 3,
  notes: 3,
  cvExports: 3,
  pdfExports: 3,
  pdfMaxMb: 10,
  pdfMaxChars: 30000,
} as const;

/** Pro menghapus kuota bulanan dan memberi batas PDF per file yang lebih besar. */
export const PRO_LIMITS = {
  pdfMaxMb: 20,
  pdfMaxChars: 100000,
} as const;

const AI_USAGE_KEY = "ai-usage-monthly";
const FEATURE_USAGE_KEY = "feature-usage-monthly";
export type LimitedFeature = "pdfUploadsPerMonth" | "flashcardSets" | "flashcardCardsTotal" | "quizSets" | "quizQuestions" | "bankItems" | "notes" | "cvExports" | "pdfExports";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getAiUsageThisMonth(): number {
  const month = currentMonth();
  const usage = getFromStorage<{ month: string; count: number }>(AI_USAGE_KEY, {
    month,
    count: 0,
  });
  return usage.month === month ? usage.count : 0;
}

export function incrementAiUsage(): void {
  const month = currentMonth();
  const current = getAiUsageThisMonth();
  saveToStorage(AI_USAGE_KEY, { month, count: current + 1 });
}

type FeatureUsage = { month: string; counts: Partial<Record<LimitedFeature, number>> };

export function getFeatureUsageThisMonth(feature: LimitedFeature): number {
  const usage = getFromStorage<FeatureUsage>(FEATURE_USAGE_KEY, { month: currentMonth(), counts: {} });
  return usage.month === currentMonth() ? usage.counts[feature] || 0 : 0;
}

export function incrementFeatureUsage(feature: LimitedFeature): void {
  const month = currentMonth();
  const usage = getFromStorage<FeatureUsage>(FEATURE_USAGE_KEY, { month, counts: {} });
  const counts = usage.month === month ? usage.counts : {};
  saveToStorage(FEATURE_USAGE_KEY, { month, counts: { ...counts, [feature]: (counts[feature] || 0) + 1 } });
}

export function canUseFeature(isPro: boolean, feature: LimitedFeature): boolean {
  if (isPro) return true;
  return getFeatureUsageThisMonth(feature) < FREE_LIMITS[feature];
}

/** true jika masih boleh pakai AI (Pro atau sisa kuota free) */
export function canUseAi(isPro: boolean): boolean {
  if (isPro) return true;
  return getAiUsageThisMonth() < FREE_LIMITS.aiPerMonth;
}

export function aiRemaining(isPro: boolean): number | "unlimited" {
  if (isPro) return "unlimited";
  return Math.max(0, FREE_LIMITS.aiPerMonth - getAiUsageThisMonth());
}

export function canAddBankItem(isPro: boolean, currentCount: number): boolean {
  void currentCount;
  return canUseFeature(isPro, "bankItems");
}

export function canAddFlashcardSet(isPro: boolean, setCount: number): boolean {
  void setCount;
  return canUseFeature(isPro, "flashcardSets");
}

export function canAddNote(isPro: boolean, count: number): boolean {
  void count;
  return canUseFeature(isPro, "notes");
}

export function canAddQuizSet(isPro: boolean, count: number): boolean {
  void count;
  return canUseFeature(isPro, "quizSets");
}

/** Cek ukuran file PDF untuk free */
export function canUploadPdf(isPro: boolean, fileSizeBytes: number): boolean {
  const maxMb = isPro ? PRO_LIMITS.pdfMaxMb : FREE_LIMITS.pdfMaxMb;
  return fileSizeBytes <= maxMb * 1024 * 1024;
}

export function clipPdfText(isPro: boolean, text: string): { text: string; clipped: boolean } {
  const maxChars = isPro ? PRO_LIMITS.pdfMaxChars : FREE_LIMITS.pdfMaxChars;
  if (text.length <= maxChars) {
    return { text, clipped: false };
  }
  return { text: text.slice(0, maxChars), clipped: true };
}
