import { create } from 'zustand';

import type {
  Contestant,
  GameResultWithContestants,
  QuestionWithRelations,
} from '../types';

export type GamePhase =
  'idle' | 'opening' | 'playing' | 'showing_answer' | 'paused' | 'finished';

export interface ContestantLiveStats {
  correct: number;
  wrong: number;
  hintsUsed: number;
}

type ResumableGamePhase = 'playing' | 'showing_answer';

export interface LiveStoreState {
  quizId: number | null;
  contestants: Contestant[];
  questionsByContestant: Map<number, QuestionWithRelations[]>;
  currentContestantId: number | null;
  currentQuestionIndexByContestant: Map<number, number>;
  gamePhase: GamePhase;
  scoresByContestant: Map<number, number>;
  statsByContestant: Map<number, ContestantLiveStats>;
  gameStartTime: number | null;
  revealedHintsForCurrentQuestion: number;
  potentialPointsForCurrentQuestion: number;
  previousGamePhase: ResumableGamePhase | null;
  totalTime: number | null;
  isLoading: boolean;
  isEnding: boolean;
  error: string | null;
  loadQuiz: (quizId: number) => Promise<void>;
  startGame: () => void;
  jumpToContestant: (displayOrder: number) => boolean;
  nextQuestion: () => void;
  previousQuestion: () => void;
  revealNextHint: () => number;
  submitAnswer: (isCorrect: boolean, pointsAwarded: number) => void;
  togglePause: () => void;
  endGame: () => Promise<GameResultWithContestants | null>;
  resetGame: () => void;
  clearError: () => void;
}

interface ResettableLiveState {
  quizId: number | null;
  contestants: Contestant[];
  questionsByContestant: Map<number, QuestionWithRelations[]>;
  currentContestantId: number | null;
  currentQuestionIndexByContestant: Map<number, number>;
  gamePhase: GamePhase;
  scoresByContestant: Map<number, number>;
  statsByContestant: Map<number, ContestantLiveStats>;
  gameStartTime: number | null;
  revealedHintsForCurrentQuestion: number;
  potentialPointsForCurrentQuestion: number;
  previousGamePhase: ResumableGamePhase | null;
  totalTime: number | null;
  isLoading: boolean;
  isEnding: boolean;
  error: string | null;
}

function createIdleState(): ResettableLiveState {
  return {
    quizId: null,
    contestants: [],
    questionsByContestant: new Map(),
    currentContestantId: null,
    currentQuestionIndexByContestant: new Map(),
    gamePhase: 'idle',
    scoresByContestant: new Map(),
    statsByContestant: new Map(),
    gameStartTime: null,
    revealedHintsForCurrentQuestion: 0,
    potentialPointsForCurrentQuestion: 0,
    previousGamePhase: null,
    totalTime: null,
    isLoading: false,
    isEnding: false,
    error: null,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.match(/Error: (.+)$/)?.[1] ?? error.message;
  }
  return 'פעולת הלייב לא הושלמה.';
}

function getCurrentQuestion(state: {
  currentContestantId: number | null;
  currentQuestionIndexByContestant: Map<number, number>;
  questionsByContestant: Map<number, QuestionWithRelations[]>;
}): QuestionWithRelations | null {
  if (state.currentContestantId === null) return null;
  const questions =
    state.questionsByContestant.get(state.currentContestantId) ?? [];
  const index =
    state.currentQuestionIndexByContestant.get(state.currentContestantId) ?? 0;
  return questions[index] ?? null;
}

function basePointsForContestant(
  questionsByContestant: Map<number, QuestionWithRelations[]>,
  indexes: Map<number, number>,
  contestantId: number,
): number {
  const index = indexes.get(contestantId) ?? 0;
  return questionsByContestant.get(contestantId)?.[index]?.points ?? 0;
}

let latestLoadRequest = 0;

export const useLiveStore = create<LiveStoreState>((set, get) => ({
  ...createIdleState(),

  loadQuiz: async (quizId) => {
    const requestId = ++latestLoadRequest;
    if (!Number.isInteger(quizId) || quizId <= 0) {
      const message = 'מזהה החידון אינו תקין.';
      set({ ...createIdleState(), error: message });
      throw new Error(message);
    }

    set({ ...createIdleState(), isLoading: true, quizId });

    try {
      const [loadedContestants, loadedQuestions] = await Promise.all([
        window.api.contestant.getByQuizId(quizId),
        window.api.question.getByQuizId(quizId),
      ]);
      if (requestId !== latestLoadRequest) return;
      const contestants = [...loadedContestants].sort(
        (a, b) => a.display_order - b.display_order || a.id - b.id,
      );
      const questionsByContestant = new Map<number, QuestionWithRelations[]>();
      const indexes = new Map<number, number>();
      const scores = new Map<number, number>();
      const stats = new Map<number, ContestantLiveStats>();

      for (const contestant of contestants) {
        questionsByContestant.set(contestant.id, []);
        indexes.set(contestant.id, 0);
        scores.set(contestant.id, 0);
        stats.set(contestant.id, { correct: 0, wrong: 0, hintsUsed: 0 });
      }

      for (const question of loadedQuestions) {
        const contestantQuestions =
          questionsByContestant.get(question.contestant_id) ?? [];
        contestantQuestions.push(question);
        questionsByContestant.set(question.contestant_id, contestantQuestions);
      }

      for (const [contestantId, questions] of questionsByContestant) {
        questionsByContestant.set(
          contestantId,
          [...questions].sort(
            (a, b) => a.display_order - b.display_order || a.id - b.id,
          ),
        );
      }

      const currentContestantId = contestants[0]?.id ?? null;
      set({
        quizId,
        contestants,
        questionsByContestant,
        currentContestantId,
        currentQuestionIndexByContestant: indexes,
        gamePhase: 'opening',
        scoresByContestant: scores,
        statsByContestant: stats,
        gameStartTime: null,
        revealedHintsForCurrentQuestion: 0,
        potentialPointsForCurrentQuestion:
          currentContestantId === null
            ? 0
            : basePointsForContestant(
                questionsByContestant,
                indexes,
                currentContestantId,
              ),
        previousGamePhase: null,
        totalTime: null,
        isLoading: false,
        isEnding: false,
        error: null,
      });
    } catch (error) {
      if (requestId !== latestLoadRequest) return;
      const message = getErrorMessage(error);
      set({ ...createIdleState(), error: message });
      throw new Error(message);
    }
  },

  startGame: () => {
    const state = get();
    if (state.gamePhase !== 'opening') return;
    set({
      gamePhase: 'playing',
      gameStartTime: state.gameStartTime ?? Date.now(),
      previousGamePhase: null,
    });
  },

  jumpToContestant: (displayOrder) => {
    const state = get();
    if (state.gamePhase === 'idle' || state.gamePhase === 'finished') {
      return false;
    }
    const contestant = state.contestants.find(
      (item) => item.display_order === displayOrder,
    );
    if (!contestant) return false;

    const isChangingContestant = contestant.id !== state.currentContestantId;
    const nextPhase =
      state.gamePhase === 'playing' || state.gamePhase === 'showing_answer'
        ? 'playing'
        : state.gamePhase;
    set({
      currentContestantId: contestant.id,
      gamePhase: nextPhase,
      revealedHintsForCurrentQuestion: isChangingContestant
        ? 0
        : state.revealedHintsForCurrentQuestion,
      potentialPointsForCurrentQuestion: isChangingContestant
        ? basePointsForContestant(
            state.questionsByContestant,
            state.currentQuestionIndexByContestant,
            contestant.id,
          )
        : state.potentialPointsForCurrentQuestion,
      previousGamePhase:
        nextPhase === 'playing' ? null : state.previousGamePhase,
    });
    return true;
  },

  nextQuestion: () => {
    const state = get();
    if (
      state.currentContestantId === null ||
      (state.gamePhase !== 'playing' && state.gamePhase !== 'showing_answer')
    ) {
      return;
    }
    const contestantId = state.currentContestantId;
    const questions = state.questionsByContestant.get(contestantId) ?? [];
    const currentIndex =
      state.currentQuestionIndexByContestant.get(contestantId) ?? 0;
    const nextIndex = Math.min(currentIndex + 1, questions.length);
    const indexes = new Map(state.currentQuestionIndexByContestant);
    indexes.set(contestantId, nextIndex);
    set({
      currentQuestionIndexByContestant: indexes,
      revealedHintsForCurrentQuestion: 0,
      potentialPointsForCurrentQuestion: questions[nextIndex]?.points ?? 0,
      gamePhase: 'playing',
      previousGamePhase: null,
    });
  },

  previousQuestion: () => {
    const state = get();
    if (
      state.currentContestantId === null ||
      (state.gamePhase !== 'playing' && state.gamePhase !== 'showing_answer')
    ) {
      return;
    }
    const contestantId = state.currentContestantId;
    const questions = state.questionsByContestant.get(contestantId) ?? [];
    const currentIndex =
      state.currentQuestionIndexByContestant.get(contestantId) ?? 0;
    const previousIndex = Math.max(currentIndex - 1, 0);
    const indexes = new Map(state.currentQuestionIndexByContestant);
    indexes.set(contestantId, previousIndex);
    set({
      currentQuestionIndexByContestant: indexes,
      revealedHintsForCurrentQuestion: 0,
      potentialPointsForCurrentQuestion: questions[previousIndex]?.points ?? 0,
      gamePhase: 'playing',
      previousGamePhase: null,
    });
  },

  revealNextHint: () => {
    const state = get();
    const question = getCurrentQuestion(state);
    if (
      state.gamePhase !== 'playing' ||
      state.currentContestantId === null ||
      !question
    ) {
      return state.potentialPointsForCurrentQuestion;
    }
    const nextHintCount = Math.min(
      state.revealedHintsForCurrentQuestion + 1,
      question.hints.length,
    );
    if (nextHintCount === state.revealedHintsForCurrentQuestion) {
      return state.potentialPointsForCurrentQuestion;
    }

    const penalty = question.hints
      .slice(0, nextHintCount)
      .reduce((total, hint) => total + hint.points_penalty, 0);
    const potentialPoints = Math.max(0, question.points - penalty);
    const stats = new Map(state.statsByContestant);
    const currentStats = stats.get(state.currentContestantId) ?? {
      correct: 0,
      wrong: 0,
      hintsUsed: 0,
    };
    stats.set(state.currentContestantId, {
      ...currentStats,
      hintsUsed: currentStats.hintsUsed + 1,
    });
    set({
      revealedHintsForCurrentQuestion: nextHintCount,
      potentialPointsForCurrentQuestion: potentialPoints,
      statsByContestant: stats,
    });
    return potentialPoints;
  },

  submitAnswer: (isCorrect, pointsAwarded) => {
    const state = get();
    if (
      state.gamePhase !== 'playing' ||
      state.currentContestantId === null ||
      !getCurrentQuestion(state)
    ) {
      return;
    }
    const contestantId = state.currentContestantId;
    const normalizedPoints = Number.isFinite(pointsAwarded)
      ? Math.max(0, Math.trunc(pointsAwarded))
      : 0;
    const scores = new Map(state.scoresByContestant);
    scores.set(
      contestantId,
      (scores.get(contestantId) ?? 0) + normalizedPoints,
    );
    const stats = new Map(state.statsByContestant);
    const currentStats = stats.get(contestantId) ?? {
      correct: 0,
      wrong: 0,
      hintsUsed: 0,
    };
    stats.set(contestantId, {
      ...currentStats,
      correct: currentStats.correct + (isCorrect ? 1 : 0),
      wrong: currentStats.wrong + (isCorrect ? 0 : 1),
    });
    set({
      scoresByContestant: scores,
      statsByContestant: stats,
      gamePhase: 'showing_answer',
      previousGamePhase: null,
    });
  },

  togglePause: () => {
    const state = get();
    if (state.gamePhase === 'paused') {
      set({
        gamePhase: state.previousGamePhase ?? 'playing',
        previousGamePhase: null,
      });
      return;
    }
    if (state.gamePhase === 'playing' || state.gamePhase === 'showing_answer') {
      set({
        gamePhase: 'paused',
        previousGamePhase: state.gamePhase,
      });
    }
  },

  endGame: async () => {
    const state = get();
    if (
      state.quizId === null ||
      state.gamePhase === 'idle' ||
      state.gamePhase === 'opening' ||
      state.gamePhase === 'finished' ||
      state.isEnding
    ) {
      return null;
    }

    const phaseBeforeEnd =
      state.gamePhase === 'paused'
        ? (state.previousGamePhase ?? 'playing')
        : state.gamePhase;
    const totalTime = state.gameStartTime
      ? Math.max(0, Math.floor((Date.now() - state.gameStartTime) / 1000))
      : 0;
    set({ isEnding: true, gamePhase: 'finished', totalTime, error: null });

    try {
      const result = await window.api.result.saveGameResult({
        quizId: state.quizId,
        totalTime,
        contestantResults: state.contestants.map((contestant) => {
          const stats = state.statsByContestant.get(contestant.id) ?? {
            correct: 0,
            wrong: 0,
            hintsUsed: 0,
          };
          return {
            contestantId: contestant.id,
            totalScore: state.scoresByContestant.get(contestant.id) ?? 0,
            correctCount: stats.correct,
            wrongCount: stats.wrong,
            hintsUsed: stats.hintsUsed,
          };
        }),
      });
      if (get().quizId === state.quizId) {
        set({ isEnding: false, gamePhase: 'finished', totalTime });
      }
      return result;
    } catch (error) {
      const message = getErrorMessage(error);
      if (get().quizId === state.quizId) {
        set({
          isEnding: false,
          gamePhase: phaseBeforeEnd,
          previousGamePhase: null,
          totalTime: null,
          error: message,
        });
      }
      throw new Error(message);
    }
  },

  resetGame: () => {
    latestLoadRequest += 1;
    set(createIdleState());
  },
  clearError: () => set({ error: null }),
}));

export function selectCurrentQuestion(
  state: LiveStoreState,
): QuestionWithRelations | null {
  return getCurrentQuestion(state);
}
