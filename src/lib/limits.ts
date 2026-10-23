import { getFromStorage, saveToStorage } from "./storage";

/** Batas paket Free — Pro = unlimited */
export const FREE_LIMITS = {
  aiPerMonth: 5,
  flashcardSets: 3,
  flashcardCardsTotal: 3,
  quizSets: 3,
  bankItems: 3,
  notes: 3,
  pdfMaxMb: 5,
  pdfMaxChars: 15000,
} as const;

const AI_USAGE_KEY = "ai-usage-monthly";

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
  if (isPro) return true;
  return currentCount < FREE_LIMITS.bankItems;
}

export function canAddFlashcardSet(isPro: boolean, setCount: number): boolean {
  if (isPro) return true;
  return setCount < FREE_LIMITS.flashcardSets;
}

export function canAddNote(isPro: boolean, count: number): boolean {
  if (isPro) return true;
  return count < FREE_LIMITS.notes;
}

export function canAddQuizSet(isPro: boolean, count: number): boolean {
  if (isPro) return true;
  return count < FREE_LIMITS.quizSets;
}

/** Cek ukuran file PDF untuk free */
export function canUploadPdf(isPro: boolean, fileSizeBytes: number): boolean {
  if (isPro) return true;
  return fileSizeBytes <= FREE_LIMITS.pdfMaxMb * 1024 * 1024;
}

export function clipPdfText(isPro: boolean, text: string): { text: string; clipped: boolean } {
  if (isPro || text.length <= FREE_LIMITS.pdfMaxChars) {
    return { text, clipped: false };
  }
  return { text: text.slice(0, FREE_LIMITS.pdfMaxChars), clipped: true };
}
