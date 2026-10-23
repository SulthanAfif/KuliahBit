import type { Flashcard } from "../types";

const DEFAULT_EASE = 2.5;

function addDays(iso: string | undefined, days: number): string {
  const d = iso ? new Date(iso) : new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function isDue(card: Flashcard, now = new Date()): boolean {
  if (!card.nextReview) return true;
  return new Date(card.nextReview) <= now;
}

export function dueCards(cards: Flashcard[]): Flashcard[] {
  const now = new Date();
  return cards.filter((c) => isDue(c, now));
}

/**
 * Simplified SM-2:
 * quality 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
 */
export function reviewCard(
  card: Flashcard,
  quality: 0 | 1 | 2 | 3
): Flashcard {
  let ease = card.ease ?? DEFAULT_EASE;
  let interval = card.interval ?? 0;
  let repetitions = card.repetitions ?? 0;

  if (quality === 0) {
    repetitions = 0;
    interval = 0;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = quality === 1 ? 2 : 3;
    } else {
      const mult = quality === 1 ? 1.2 : quality === 2 ? ease : ease * 1.3;
      interval = Math.max(1, Math.round(interval * mult));
    }
    repetitions += 1;
    ease = Math.max(1.3, ease + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)));
  }

  return {
    ...card,
    ease,
    interval,
    repetitions,
    nextReview: addDays(undefined, interval === 0 ? 0 : interval),
  };
}

export function ensureCardDefaults(card: Flashcard): Flashcard {
  return {
    ...card,
    ease: card.ease ?? DEFAULT_EASE,
    interval: card.interval ?? 0,
    repetitions: card.repetitions ?? 0,
    nextReview: card.nextReview ?? new Date(0).toISOString(),
  };
}
