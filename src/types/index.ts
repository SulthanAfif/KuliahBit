export interface Course {
  id: string;
  name: string;
  code?: string;
  sks: number;
  schedule?: string;
  color: string;
}

export interface Task {
  id: string;
  courseId?: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  completedAt?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  ease?: number;
  interval?: number;
  repetitions?: number;
  nextReview?: string;
}

export interface FlashcardSet {
  id: string;
  title: string;
  cards: Flashcard[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizSet {
  id: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface SkripsiProgress {
  bab: string;
  status: 'not_started' | 'in_progress' | 'done';
  notes?: string;
}

export interface UserPlan {
  plan: 'free' | 'pro';
  expiresAt?: string;
}
