import { create } from 'zustand';

import type {
  Contestant,
  GameResultWithContestants,
  QuestionWithRelations,
  Quiz,
} from '../types';
import {
  calculatePotentialPoints,
  getRevealableHints,
  isSelectionQuestion,
  chooseFiftyFiftyHiddenIds,
} from '../utils/liveQuestion';
import { CONTESTANT_TIME_DEFAULT } from '../utils/timeLimit';

export interface ContestantTimeExpiry {
  questionId: number;
  answered: boolean;
}

interface ContestantClockState {
  remainingTimeMsByContestant: Map<number, number>;
  timeExpiryByContestant: Map<number, ContestantTimeExpiry>;
  runningContestantClock: { contestantId: number; startedAt: number } | null;
  contestantTimerBlocked: boolean;
}

export type GamePhase =
  | 'idle'
  | 'opening'
  | 'intro_video'
  | 'playing'
  | 'showing_answer'
  | 'paused'
  | 'finished';

export interface ContestantLiveStats {
  correct: number;
  wrong: number;
  hintsUsed: number;
}

export interface LastAnswerResult {
  submissionId: number;
  questionId: number;
  isCorrect: boolean;
  pointsAwarded: number;
  wasTimeout: boolean;
}

export interface AnsweredQuestionLogEntry {
  isCorrect: boolean;
  pointsAwarded: number;
}

type ResumableGamePhase = 'playing' | 'showing_answer';

export interface LiveStoreState extends ContestantClockState {
  quizId: number | null;
  quiz: Quiz | null;
  contestants: Contestant[];
  questionsByContestant: Map<number, QuestionWithRelations[]>;
  currentContestantId: number | null;
  currentQuestionIndexByContestant: Map<number, number>;
  gamePhase: GamePhase;
  scoresByContestant: Map<number, number>;
  statsByContestant: Map<number, ContestantLiveStats>;
  answeredQuestionsLog: Map<string, AnsweredQuestionLogEntry>;
  gameStartTime: number | null;
  questionEntrySequence: number;
  revealedHintsForCurrentQuestion: number;
  selectedAnswerIds: number[];
  fiftyFiftyHiddenIdsByQuestion: Map<number, number[]>;
  potentialPointsForCurrentQuestion: number;
  lastAnswerResult: LastAnswerResult | null;
  previousGamePhase: ResumableGamePhase | null;
  totalTime: number | null;
  isLoading: boolean;
  isEnding: boolean;
  error: string | null;
  loadQuiz: (quizId: number) => Promise<void>;
  beginIntroVideo: () => void;
  startGame: () => void;
  jumpToContestant: (displayOrder: number) => boolean;
  nextQuestion: () => void;
  previousQuestion: () => void;
  revealNextHint: () => number;
  toggleSelectedAnswer: (answerId: number) => void;
  submitSelectedAnswer: (wasTimeout?: boolean) => void;
  submitAnswer: (
    isCorrect: boolean,
    pointsAwarded: number,
    wasTimeout?: boolean,
  ) => void;
  togglePause: () => void;
  endGame: () => Promise<GameResultWithContestants | null>;
  resetGame: () => void;
  clearError: () => void;
  tickContestantTimer: () => void;
  setContestantTimerBlocked: (blocked: boolean) => void;
}

interface ResettableLiveState extends ContestantClockState {
  quizId: number | null;
  quiz: Quiz | null;
  contestants: Contestant[];
  questionsByContestant: Map<number, QuestionWithRelations[]>;
  currentContestantId: number | null;
  currentQuestionIndexByContestant: Map<number, number>;
  gamePhase: GamePhase;
  scoresByContestant: Map<number, number>;
  statsByContestant: Map<number, ContestantLiveStats>;
  answeredQuestionsLog: Map<string, AnsweredQuestionLogEntry>;
  gameStartTime: number | null;
  questionEntrySequence: number;
  revealedHintsForCurrentQuestion: number;
  selectedAnswerIds: number[];
  fiftyFiftyHiddenIdsByQuestion: Map<number, number[]>;
  potentialPointsForCurrentQuestion: number;
  lastAnswerResult: LastAnswerResult | null;
  previousGamePhase: ResumableGamePhase | null;
  totalTime: number | null;
  isLoading: boolean;
  isEnding: boolean;
  error: string | null;
}

function createIdleState(): ResettableLiveState {
  return {
    quizId: null,
    quiz: null,
    contestants: [],
    questionsByContestant: new Map(),
    currentContestantId: null,
    currentQuestionIndexByContestant: new Map(),
    gamePhase: 'idle',
    scoresByContestant: new Map(),
    statsByContestant: new Map(),
    answeredQuestionsLog: new Map(),
    gameStartTime: null,
    questionEntrySequence: 0,
    revealedHintsForCurrentQuestion: 0,
    selectedAnswerIds: [],
    fiftyFiftyHiddenIdsByQuestion: new Map(),
    potentialPointsForCurrentQuestion: 0,
    lastAnswerResult: null,
    previousGamePhase: null,
    totalTime: null,
    isLoading: false,
    isEnding: false,
    error: null,
    remainingTimeMsByContestant: new Map(),
    timeExpiryByContestant: new Map(),
    runningContestantClock: null,
    contestantTimerBlocked: false,
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
  fiftyFifty: Map<number, number[]> = new Map(),
): number {
  const index = indexes.get(contestantId) ?? 0;
  const question = questionsByContestant.get(contestantId)?.[index];
  return question
    ? calculatePotentialPoints(question, 0, fiftyFifty.has(question.id))
    : 0;
}

function haveAllContestantsFinished(
  contestants: Contestant[],
  questionsByContestant: Map<number, QuestionWithRelations[]>,
  indexes: Map<number, number>,
): boolean {
  return (
    contestants.length > 0 &&
    contestants.every((contestant) => {
      const questions = questionsByContestant.get(contestant.id) ?? [];
      const currentIndex = indexes.get(contestant.id) ?? 0;
      return currentIndex >= questions.length;
    })
  );
}

let latestLoadRequest = 0;
let nextSubmissionId = 0;

function getAnsweredQuestionLogKey(
  contestantId: number,
  questionId: number,
): string {
  return `${contestantId}:${questionId}`;
}

export const useLiveStore = create<LiveStoreState>((rawSet, get) => {
  // Settle the elapsed interval at action boundaries as well as display ticks.
  // A late tick must never award points or navigate past the question at expiry.
  const readTimedState = (): LiveStoreState => {
    const state = get();
    const clock = state.runningContestantClock;
    if (!clock) return state;
    const now = performance.now();
    const remaining = Math.max(
      0,
      (state.remainingTimeMsByContestant.get(clock.contestantId) ?? 0) -
        Math.max(0, now - clock.startedAt),
    );
    const budgets = new Map(state.remainingTimeMsByContestant);
    budgets.set(clock.contestantId, remaining);
    const expiries = new Map(state.timeExpiryByContestant);
    const question = getCurrentQuestion(state);
    if (remaining === 0 && question && !expiries.has(clock.contestantId)) {
      expiries.set(clock.contestantId, {
        questionId: question.id,
        answered: false,
      });
    }
    rawSet({
      remainingTimeMsByContestant: budgets,
      timeExpiryByContestant: expiries,
      runningContestantClock:
        remaining > 0 ? { ...clock, startedAt: now } : null,
      potentialPointsForCurrentQuestion:
        remaining === 0 ? 0 : state.potentialPointsForCurrentQuestion,
    });
    return get();
  };

  const set = (patch: Partial<LiveStoreState>) => {
    rawSet((state) => {
      const next = { ...state, ...patch };
      const contestantId = next.currentContestantId;
      const canRun =
        next.quiz?.timing_mode === 'per_contestant' &&
        next.gamePhase === 'playing' &&
        !next.contestantTimerBlocked &&
        contestantId !== null &&
        getCurrentQuestion(next) !== null &&
        (next.remainingTimeMsByContestant.get(contestantId) ?? 0) > 0;
      return {
        ...patch,
        runningContestantClock: canRun
          ? next.runningContestantClock?.contestantId === contestantId
            ? next.runningContestantClock
            : { contestantId, startedAt: performance.now() }
          : null,
        potentialPointsForCurrentQuestion:
          contestantId !== null && next.timeExpiryByContestant.has(contestantId)
            ? 0
            : next.potentialPointsForCurrentQuestion,
      };
    });
  };

  return {
    ...createIdleState(),

    tickContestantTimer: () => {
      readTimedState();
    },
    setContestantTimerBlocked: (blocked) => {
      readTimedState();
      set({ contestantTimerBlocked: blocked });
    },

    loadQuiz: async (quizId) => {
      const requestId = ++latestLoadRequest;
      if (!Number.isInteger(quizId) || quizId <= 0) {
        const message = 'מזהה החידון אינו תקין.';
        set({ ...createIdleState(), error: message });
        throw new Error(message);
      }

      set({ ...createIdleState(), isLoading: true, quizId });

      try {
        const [loadedQuiz, loadedContestants, loadedQuestions] =
          await Promise.all([
            window.api.quiz.getById(quizId),
            window.api.contestant.getByQuizId(quizId),
            window.api.question.getByQuizId(quizId),
          ]);
        if (requestId !== latestLoadRequest) return;
        const contestants = [...loadedContestants].sort(
          (a, b) => a.display_order - b.display_order || a.id - b.id,
        );
        const questionsByContestant = new Map<
          number,
          QuestionWithRelations[]
        >();
        const indexes = new Map<number, number>();
        const scores = new Map<number, number>();
        const stats = new Map<number, ContestantLiveStats>();
        const budgets = new Map<number, number>();

        for (const contestant of contestants) {
          questionsByContestant.set(contestant.id, []);
          indexes.set(contestant.id, 0);
          scores.set(contestant.id, 0);
          stats.set(contestant.id, { correct: 0, wrong: 0, hintsUsed: 0 });
          if (loadedQuiz?.timing_mode === 'per_contestant') {
            budgets.set(
              contestant.id,
              (contestant.total_time_limit ?? CONTESTANT_TIME_DEFAULT) * 1000,
            );
          }
        }

        for (const question of loadedQuestions) {
          const contestantQuestions =
            questionsByContestant.get(question.contestant_id) ?? [];
          contestantQuestions.push(question);
          questionsByContestant.set(
            question.contestant_id,
            contestantQuestions,
          );
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
          quiz: loadedQuiz,
          contestants,
          questionsByContestant,
          currentContestantId,
          currentQuestionIndexByContestant: indexes,
          gamePhase: 'opening',
          scoresByContestant: scores,
          statsByContestant: stats,
          remainingTimeMsByContestant: budgets,
          answeredQuestionsLog: new Map(),
          gameStartTime: null,
          questionEntrySequence: 0,
          revealedHintsForCurrentQuestion: 0,
          selectedAnswerIds: [],
          fiftyFiftyHiddenIdsByQuestion: new Map(),
          potentialPointsForCurrentQuestion:
            currentContestantId === null
              ? 0
              : basePointsForContestant(
                  questionsByContestant,
                  indexes,
                  currentContestantId,
                ),
          lastAnswerResult: null,
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

    beginIntroVideo: () => {
      const state = get();
      if (state.gamePhase !== 'opening') return;
      set({
        gamePhase: 'intro_video',
        lastAnswerResult: null,
        previousGamePhase: null,
      });
    },

    startGame: () => {
      const state = readTimedState();
      if (state.gamePhase !== 'intro_video') return;
      const shouldEndImmediately = haveAllContestantsFinished(
        state.contestants,
        state.questionsByContestant,
        state.currentQuestionIndexByContestant,
      );
      const hasCurrentQuestion = getCurrentQuestion(state) !== null;
      set({
        gamePhase: 'playing',
        gameStartTime: state.gameStartTime ?? Date.now(),
        questionEntrySequence: hasCurrentQuestion
          ? state.questionEntrySequence + 1
          : state.questionEntrySequence,
        lastAnswerResult: null,
        previousGamePhase: null,
      });
      if (shouldEndImmediately) {
        void get()
          .endGame()
          .catch(() => undefined);
      }
    },

    jumpToContestant: (displayOrder) => {
      const state = readTimedState();
      if (state.gamePhase === 'idle' || state.gamePhase === 'finished') {
        return false;
      }
      const contestant = state.contestants.find(
        (item) => item.display_order === displayOrder,
      );
      if (!contestant) return false;

      const indexes = new Map(state.currentQuestionIndexByContestant);
      for (const [id, expiry] of state.timeExpiryByContestant) {
        if (expiry.answered)
          indexes.set(id, state.questionsByContestant.get(id)?.length ?? 0);
      }

      const isChangingContestant = contestant.id !== state.currentContestantId;
      const currentQuestion = getCurrentQuestion(state);
      const targetQuestionIndex = indexes.get(contestant.id) ?? 0;
      const targetQuestion =
        state.questionsByContestant.get(contestant.id)?.[targetQuestionIndex] ??
        null;
      const isChangingQuestion = currentQuestion?.id !== targetQuestion?.id;
      const isReenteringAnsweredQuestion = Boolean(
        !isChangingQuestion &&
        targetQuestion &&
        state.answeredQuestionsLog.has(
          getAnsweredQuestionLogKey(contestant.id, targetQuestion.id),
        ),
      );
      const shouldRestartQuestion = Boolean(
        targetQuestion && (isChangingQuestion || isReenteringAnsweredQuestion),
      );
      const shouldResetQuestionState =
        isChangingContestant || isReenteringAnsweredQuestion;
      const nextPhase =
        state.gamePhase === 'playing' || state.gamePhase === 'showing_answer'
          ? 'playing'
          : state.gamePhase;
      const nextPreviousPhase =
        state.gamePhase === 'paused' && shouldResetQuestionState
          ? 'playing'
          : state.previousGamePhase;
      set({
        currentContestantId: contestant.id,
        currentQuestionIndexByContestant: indexes,
        gamePhase: nextPhase,
        questionEntrySequence: shouldRestartQuestion
          ? state.questionEntrySequence + 1
          : state.questionEntrySequence,
        lastAnswerResult: null,
        revealedHintsForCurrentQuestion: shouldResetQuestionState
          ? 0
          : state.revealedHintsForCurrentQuestion,
        selectedAnswerIds: shouldResetQuestionState
          ? []
          : state.selectedAnswerIds,
        potentialPointsForCurrentQuestion: shouldResetQuestionState
          ? basePointsForContestant(
              state.questionsByContestant,
              indexes,
              contestant.id,
              state.fiftyFiftyHiddenIdsByQuestion,
            )
          : state.potentialPointsForCurrentQuestion,
        previousGamePhase: nextPhase === 'playing' ? null : nextPreviousPhase,
      });
      if (
        state.quiz?.timing_mode === 'per_contestant' &&
        haveAllContestantsFinished(
          state.contestants,
          state.questionsByContestant,
          indexes,
        ) &&
        nextPhase === 'playing'
      ) {
        void get()
          .endGame()
          .catch(() => undefined);
      }
      return true;
    },

    nextQuestion: () => {
      const state = readTimedState();
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
      const expiry = state.timeExpiryByContestant.get(contestantId);
      if (expiry && !expiry.answered) return;
      const nextIndex = expiry
        ? questions.length
        : Math.min(currentIndex + 1, questions.length);
      if (nextIndex === currentIndex) return;
      const indexes = new Map(state.currentQuestionIndexByContestant);
      indexes.set(contestantId, nextIndex);
      const shouldEndGame = haveAllContestantsFinished(
        state.contestants,
        state.questionsByContestant,
        indexes,
      );
      set({
        currentQuestionIndexByContestant: indexes,
        questionEntrySequence: questions[nextIndex]
          ? state.questionEntrySequence + 1
          : state.questionEntrySequence,
        revealedHintsForCurrentQuestion: 0,
        selectedAnswerIds: [],
        potentialPointsForCurrentQuestion: basePointsForContestant(
          state.questionsByContestant,
          indexes,
          contestantId,
          state.fiftyFiftyHiddenIdsByQuestion,
        ),
        gamePhase: 'playing',
        lastAnswerResult: null,
        previousGamePhase: null,
      });
      if (shouldEndGame) {
        void get()
          .endGame()
          .catch(() => undefined);
      }
    },

    previousQuestion: () => {
      const state = readTimedState();
      if (
        state.currentContestantId === null ||
        (state.gamePhase !== 'playing' && state.gamePhase !== 'showing_answer')
      ) {
        return;
      }
      const contestantId = state.currentContestantId;
      if (state.timeExpiryByContestant.has(contestantId)) return;
      const questions = state.questionsByContestant.get(contestantId) ?? [];
      const currentIndex =
        state.currentQuestionIndexByContestant.get(contestantId) ?? 0;
      const previousIndex = Math.max(currentIndex - 1, 0);
      if (previousIndex === currentIndex) return;
      const indexes = new Map(state.currentQuestionIndexByContestant);
      indexes.set(contestantId, previousIndex);
      set({
        currentQuestionIndexByContestant: indexes,
        questionEntrySequence: questions[previousIndex]
          ? state.questionEntrySequence + 1
          : state.questionEntrySequence,
        revealedHintsForCurrentQuestion: 0,
        selectedAnswerIds: [],
        potentialPointsForCurrentQuestion: basePointsForContestant(
          state.questionsByContestant,
          indexes,
          contestantId,
          state.fiftyFiftyHiddenIdsByQuestion,
        ),
        gamePhase: 'playing',
        lastAnswerResult: null,
        previousGamePhase: null,
      });
    },

    revealNextHint: () => {
      const state = readTimedState();
      const question = getCurrentQuestion(state);
      if (
        state.gamePhase !== 'playing' ||
        state.currentContestantId === null ||
        !question ||
        (question.question_type !== 'complete_sentence' &&
          question.question_type !== 'multiple_choice')
      ) {
        return state.potentialPointsForCurrentQuestion;
      }
      const isFiftyFifty = question.question_type === 'multiple_choice';
      if (
        isFiftyFifty &&
        state.fiftyFiftyHiddenIdsByQuestion.has(question.id)
      ) {
        return state.potentialPointsForCurrentQuestion;
      }
      const hiddenIds = isFiftyFifty ? chooseFiftyFiftyHiddenIds(question) : [];
      // Do not charge for a hint that cannot hide any incorrect option.
      if (isFiftyFifty && hiddenIds.length === 0)
        return state.potentialPointsForCurrentQuestion;
      const nextHintCount = isFiftyFifty
        ? 1
        : Math.min(
            state.revealedHintsForCurrentQuestion + 1,
            getRevealableHints(question).length,
          );
      if (nextHintCount === state.revealedHintsForCurrentQuestion) {
        return state.potentialPointsForCurrentQuestion;
      }
      const fiftyFifty = new Map(state.fiftyFiftyHiddenIdsByQuestion);
      if (isFiftyFifty) fiftyFifty.set(question.id, hiddenIds);
      const potentialPoints = state.timeExpiryByContestant.has(
        state.currentContestantId,
      )
        ? 0
        : calculatePotentialPoints(question, nextHintCount, isFiftyFifty);
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
        fiftyFiftyHiddenIdsByQuestion: fiftyFifty,
        selectedAnswerIds: state.selectedAnswerIds.filter(
          (id) => !hiddenIds.includes(id),
        ),
        potentialPointsForCurrentQuestion: potentialPoints,
        statsByContestant: stats,
      });
      return potentialPoints;
    },

    toggleSelectedAnswer: (answerId) => {
      const state = readTimedState();
      const question = getCurrentQuestion(state);
      if (
        state.gamePhase !== 'playing' ||
        !question ||
        !isSelectionQuestion(question.question_type)
      )
        return;
      if (
        !question.answers.some((answer) => answer.id === answerId) ||
        state.fiftyFiftyHiddenIdsByQuestion.get(question.id)?.includes(answerId)
      )
        return;
      const multiple =
        question.question_type !== 'true_false' &&
        question.answers.filter((answer) => answer.is_correct).length > 1;
      set({
        selectedAnswerIds: multiple
          ? state.selectedAnswerIds.includes(answerId)
            ? state.selectedAnswerIds.filter((id) => id !== answerId)
            : [...state.selectedAnswerIds, answerId]
          : [answerId],
      });
    },

    submitSelectedAnswer: (wasTimeout = false) => {
      const state = readTimedState();
      const question = getCurrentQuestion(state);
      if (
        state.gamePhase !== 'playing' ||
        !question ||
        !isSelectionQuestion(question.question_type)
      )
        return;
      if (!wasTimeout && state.selectedAnswerIds.length === 0) return;
      const correctIds = question.answers
        .filter((answer) => answer.is_correct)
        .map((answer) => answer.id);
      const isCorrect =
        correctIds.length > 0 &&
        state.selectedAnswerIds.length === correctIds.length &&
        correctIds.every((id) => state.selectedAnswerIds.includes(id));
      state.submitAnswer(
        isCorrect,
        isCorrect ? state.potentialPointsForCurrentQuestion : 0,
        wasTimeout,
      );
    },

    submitAnswer: (isCorrect, pointsAwarded, wasTimeout = false) => {
      const state = readTimedState();
      const question = getCurrentQuestion(state);
      if (
        state.gamePhase !== 'playing' ||
        state.currentContestantId === null ||
        !question
      ) {
        return;
      }
      const contestantId = state.currentContestantId;
      const expiry = state.timeExpiryByContestant.get(contestantId);
      if (expiry && (expiry.answered || expiry.questionId !== question.id))
        return;
      const normalizedPoints = Number.isFinite(pointsAwarded)
        ? Math.max(0, Math.trunc(pointsAwarded))
        : 0;
      const awardedPoints = isCorrect && !expiry ? normalizedPoints : 0;
      const answerLogKey = getAnsweredQuestionLogKey(contestantId, question.id);
      const previousAnswer = state.answeredQuestionsLog.get(answerLogKey);
      const scores = new Map(state.scoresByContestant);
      scores.set(
        contestantId,
        Math.max(
          0,
          (scores.get(contestantId) ?? 0) -
            (previousAnswer?.pointsAwarded ?? 0) +
            awardedPoints,
        ),
      );
      const stats = new Map(state.statsByContestant);
      const currentStats = stats.get(contestantId) ?? {
        correct: 0,
        wrong: 0,
        hintsUsed: 0,
      };
      stats.set(contestantId, {
        ...currentStats,
        correct: Math.max(
          0,
          currentStats.correct -
            (previousAnswer?.isCorrect ? 1 : 0) +
            (isCorrect ? 1 : 0),
        ),
        wrong: Math.max(
          0,
          currentStats.wrong -
            (previousAnswer && !previousAnswer.isCorrect ? 1 : 0) +
            (isCorrect ? 0 : 1),
        ),
      });
      const answeredQuestionsLog = new Map(state.answeredQuestionsLog);
      answeredQuestionsLog.set(answerLogKey, {
        isCorrect,
        pointsAwarded: awardedPoints,
      });
      const expiries = new Map(state.timeExpiryByContestant);
      if (expiry) expiries.set(contestantId, { ...expiry, answered: true });
      set({
        timeExpiryByContestant: expiries,
        scoresByContestant: scores,
        statsByContestant: stats,
        answeredQuestionsLog,
        gamePhase: 'showing_answer',
        lastAnswerResult: {
          submissionId: ++nextSubmissionId,
          questionId: question.id,
          isCorrect,
          pointsAwarded: awardedPoints,
          wasTimeout: wasTimeout || Boolean(expiry),
        },
        previousGamePhase: null,
      });
    },

    togglePause: () => {
      const state = readTimedState();
      if (state.gamePhase === 'paused') {
        set({
          gamePhase: state.previousGamePhase ?? 'playing',
          previousGamePhase: null,
        });
        return;
      }
      if (
        state.gamePhase === 'playing' ||
        state.gamePhase === 'showing_answer'
      ) {
        set({
          gamePhase: 'paused',
          previousGamePhase: state.gamePhase,
        });
      }
    },

    endGame: async () => {
      const state = readTimedState();
      if (
        state.quizId === null ||
        state.gamePhase === 'idle' ||
        state.gamePhase === 'opening' ||
        state.gamePhase === 'intro_video' ||
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
  };
});

export function selectCurrentQuestion(
  state: LiveStoreState,
): QuestionWithRelations | null {
  return getCurrentQuestion(state);
}
