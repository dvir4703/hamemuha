import { create } from 'zustand';

import type { Quiz, QuizMutationInput, QuizSummary } from '../types';

interface QuizStore {
  quizzes: QuizSummary[];
  isLoading: boolean;
  searchTerm: string;
  error: string | null;
  setSearchTerm: (searchTerm: string) => void;
  clearError: () => void;
  refresh: (query?: string) => Promise<void>;
  createQuiz: (data: QuizMutationInput) => Promise<Quiz>;
  updateQuiz: (id: number, data: QuizMutationInput) => Promise<Quiz | null>;
  deleteQuiz: (id: number) => Promise<boolean>;
  duplicateQuiz: (id: number) => Promise<Quiz>;
}

let latestRequest = 0;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const remoteMessage = error.message.match(/Error: (.+)$/)?.[1];
    return remoteMessage ?? error.message;
  }

  return 'הפעולה לא הושלמה. נסו שוב.';
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  quizzes: [],
  isLoading: false,
  searchTerm: '',
  error: null,

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  clearError: () => set({ error: null }),

  refresh: async (query = get().searchTerm) => {
    const requestId = ++latestRequest;
    set({ isLoading: true, error: null });

    try {
      const trimmedQuery = query.trim();
      const quizzes = trimmedQuery
        ? await window.api.quiz.search(trimmedQuery)
        : await window.api.quiz.getAll();

      if (requestId === latestRequest) {
        set({ quizzes, isLoading: false });
      }
    } catch (error) {
      if (requestId === latestRequest) {
        set({ error: getErrorMessage(error), isLoading: false });
      }
    }
  },

  createQuiz: async (data) => {
    try {
      const quiz = await window.api.quiz.create(data);
      await get().refresh();
      return quiz;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      throw new Error(message);
    }
  },

  updateQuiz: async (id, data) => {
    try {
      const updatedQuiz = await window.api.quiz.update(id, data);

      if (updatedQuiz) {
        set((state) => ({
          quizzes: state.quizzes.map((quiz) =>
            quiz.id === id ? { ...quiz, ...updatedQuiz } : quiz,
          ),
        }));
      }

      return updatedQuiz;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      throw new Error(message);
    }
  },

  deleteQuiz: async (id) => {
    try {
      const deleted = await window.api.quiz.delete(id);

      if (deleted) {
        set((state) => ({
          quizzes: state.quizzes.filter((quiz) => quiz.id !== id),
        }));
      }

      return deleted;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      throw new Error(message);
    }
  },

  duplicateQuiz: async (id) => {
    try {
      const duplicatedQuiz = await window.api.quiz.duplicate(id);
      await get().refresh();
      return duplicatedQuiz;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message });
      throw new Error(message);
    }
  },
}));
