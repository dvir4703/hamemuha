import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Flag,
  Lightbulb,
  LoaderCircle,
  Pause,
  Play,
  X,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { useKeyboard } from '../../hooks/useKeyboard';
import { selectCurrentQuestion, useLiveStore } from '../../store/liveStore';

const phaseLabels = {
  idle: 'idle · לא נטען',
  opening: 'opening · ממתין להתחלה',
  playing: 'playing · שאלה פעילה',
  showing_answer: 'showing_answer · מציג תשובה',
  paused: 'paused · המשחק מושהה',
  finished: 'finished · המשחק הסתיים',
} as const;

export default function LiveGame() {
  const navigate = useNavigate();
  const { id: quizIdParam } = useParams();
  const quizId = Number(quizIdParam);
  const contestants = useLiveStore((state) => state.contestants);
  const questionsByContestant = useLiveStore(
    (state) => state.questionsByContestant,
  );
  const currentContestantId = useLiveStore(
    (state) => state.currentContestantId,
  );
  const currentIndexes = useLiveStore(
    (state) => state.currentQuestionIndexByContestant,
  );
  const scores = useLiveStore((state) => state.scoresByContestant);
  const stats = useLiveStore((state) => state.statsByContestant);
  const gamePhase = useLiveStore((state) => state.gamePhase);
  const currentQuestion = useLiveStore(selectCurrentQuestion);
  const revealedHints = useLiveStore(
    (state) => state.revealedHintsForCurrentQuestion,
  );
  const potentialPoints = useLiveStore(
    (state) => state.potentialPointsForCurrentQuestion,
  );
  const totalTime = useLiveStore((state) => state.totalTime);
  const isLoading = useLiveStore((state) => state.isLoading);
  const isEnding = useLiveStore((state) => state.isEnding);
  const error = useLiveStore((state) => state.error);
  const loadQuiz = useLiveStore((state) => state.loadQuiz);
  const startGame = useLiveStore((state) => state.startGame);
  const jumpToContestant = useLiveStore((state) => state.jumpToContestant);
  const nextQuestion = useLiveStore((state) => state.nextQuestion);
  const previousQuestion = useLiveStore((state) => state.previousQuestion);
  const revealNextHint = useLiveStore((state) => state.revealNextHint);
  const submitAnswer = useLiveStore((state) => state.submitAnswer);
  const togglePause = useLiveStore((state) => state.togglePause);
  const endGame = useLiveStore((state) => state.endGame);
  const resetGame = useLiveStore((state) => state.resetGame);
  const clearError = useLiveStore((state) => state.clearError);
  const [exitRequested, setExitRequested] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadQuiz(quizId).catch(() => undefined);
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      resetGame();
    };
  }, [loadQuiz, quizId, resetGame]);

  const handleMarkCorrect = useCallback(() => {
    submitAnswer(true, 10);
  }, [submitAnswer]);
  const handleMarkWrong = useCallback(() => {
    submitAnswer(false, 0);
  }, [submitAnswer]);
  const handleExitRequest = useCallback(() => {
    setExitRequested(true);
  }, []);

  useKeyboard({
    enabled: !isLoading && !exitRequested,
    onExitRequest: handleExitRequest,
    onMarkCorrect: handleMarkCorrect,
    onMarkWrong: handleMarkWrong,
  });

  const currentContestant = contestants.find(
    (contestant) => contestant.id === currentContestantId,
  );
  const currentQuestions = currentContestantId
    ? (questionsByContestant.get(currentContestantId) ?? [])
    : [];
  const currentIndex = currentContestantId
    ? (currentIndexes.get(currentContestantId) ?? 0)
    : 0;
  const currentScore = currentContestantId
    ? (scores.get(currentContestantId) ?? 0)
    : 0;
  const currentStats = currentContestantId
    ? stats.get(currentContestantId)
    : null;
  const contestantFinished =
    currentQuestions.length === 0 || currentIndex >= currentQuestions.length;

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas text-ink">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-teal" size={36} />
          <p className="mt-3 font-bold text-ink/55">טוענים את מנוע הלייב…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-canvas px-6 py-6 text-ink lg:px-10">
      <main className="mx-auto max-w-[1480px]">
        <header className="flex flex-col gap-4 rounded-[26px] bg-ink px-6 py-5 text-white shadow-hero sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-wide text-mint">
              מצב לייב · שלד בדיקה
            </p>
            <h1 className="mt-1 font-display text-2xl font-black">
              מנוע הניווט
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-white/10 px-3 py-2 font-mono text-xs text-white/70">
              {phaseLabels[gamePhase]}
            </span>
            <button
              type="button"
              onClick={() => setExitRequested(true)}
              className="rounded-xl px-3 py-2 text-sm font-bold text-white/65 hover:bg-white/10 hover:text-white"
            >
              יציאה
            </button>
          </div>
        </header>

        {error ? (
          <div
            className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-coral/25 bg-red-50 px-4 py-3 text-red-900"
            role="alert"
          >
            <span className="inline-flex items-center gap-2 font-semibold">
              <AlertCircle size={19} /> {error}
            </span>
            <button
              type="button"
              onClick={clearError}
              className="rounded-lg p-1.5 hover:bg-red-100"
              aria-label="סגירת השגיאה"
            >
              <X size={18} />
            </button>
          </div>
        ) : null}

        {exitRequested ? (
          <section
            className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber/30 bg-amber/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            aria-live="polite"
          >
            <div>
              <strong className="block">התקבלה בקשת יציאה</strong>
              <span className="text-sm text-ink/55">
                זהו placeholder עד לדיאלוג האישור של שלב 3ב. קיצורי המקלדת
                כבויים כרגע.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExitRequested(false)}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-sm"
              >
                המשך בדיקה
              </button>
              <button
                type="button"
                onClick={() => navigate(`/quizzes/${quizId}/edit`)}
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white"
              >
                יציאה עכשיו
              </button>
            </div>
          </section>
        ) : null}

        <section
          className="mt-6 rounded-[26px] border border-ink/[0.06] bg-white p-5 shadow-card"
          aria-labelledby="memory-heading"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2
                id="memory-heading"
                className="font-display text-lg font-black"
              >
                זיכרון המתמודדים
              </h2>
              <p className="mt-1 text-sm text-ink/45">
                המספר הוא מקש הקפיצה; המונה נשמר בנפרד לכל מתמודד
              </p>
            </div>
            <span className="text-xs font-bold text-ink/35">1–9 לקפיצה</span>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {contestants.map((contestant) => {
              const contestantQuestions =
                questionsByContestant.get(contestant.id) ?? [];
              const savedIndex = currentIndexes.get(contestant.id) ?? 0;
              const isCurrent = contestant.id === currentContestantId;
              const isFinished = savedIndex >= contestantQuestions.length;
              return (
                <button
                  key={contestant.id}
                  type="button"
                  onClick={() => jumpToContestant(contestant.display_order)}
                  className={`min-w-40 shrink-0 rounded-[20px] border p-3 text-right transition ${isCurrent ? 'border-teal bg-teal text-white shadow-button' : 'border-ink/10 bg-canvas/60 hover:border-teal/25 hover:bg-teal/5'}`}
                  aria-pressed={isCurrent}
                >
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-xl font-display text-sm font-black ${isCurrent ? 'bg-white text-teal' : 'bg-ink text-white'}`}
                  >
                    {contestant.display_order}
                  </span>
                  <strong className="mt-3 block truncate font-display">
                    {contestant.name}
                  </strong>
                  <span
                    className={`mt-1 block text-xs font-bold ${isCurrent ? 'text-white/65' : 'text-ink/45'}`}
                  >
                    {isFinished
                      ? 'הסתיימו השאלות'
                      : `שאלה ${savedIndex + 1} מתוך ${contestantQuestions.length}`}{' '}
                    · {scores.get(contestant.id) ?? 0} נק׳
                  </span>
                </button>
              );
            })}
            {contestants.length === 0 ? (
              <p className="py-5 text-sm font-semibold text-ink/45">
                בחידון הזה עדיין אין מתמודדים.
              </p>
            ) : null}
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section
            className="min-h-[360px] rounded-[28px] border border-ink/[0.06] bg-white p-6 shadow-card sm:p-8"
            aria-labelledby="current-question-heading"
          >
            {currentContestant ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/[0.07] pb-5">
                  <div>
                    <p className="text-sm font-black text-teal">
                      מתמודד {currentContestant.display_order}
                    </p>
                    <h2
                      id="current-question-heading"
                      className="mt-1 font-display text-3xl font-black"
                    >
                      {currentContestant.name}
                    </h2>
                  </div>
                  <div className="text-left">
                    <span className="block font-mono text-xs text-ink/40">
                      QUESTION INDEX
                    </span>
                    <strong className="font-display text-xl">
                      {contestantFinished
                        ? `${currentQuestions.length}/${currentQuestions.length}`
                        : `${currentIndex + 1}/${currentQuestions.length}`}
                    </strong>
                  </div>
                </div>
                {contestantFinished ? (
                  <div className="grid min-h-56 place-items-center text-center">
                    <div>
                      <Flag className="mx-auto text-teal" size={36} />
                      <h3 className="mt-3 font-display text-2xl font-black">
                        אין עוד שאלות למתמודד
                      </h3>
                      <p className="mt-2 text-ink/50">
                        אפשר לקפוץ למתמודד אחר או לחזור לשאלה הקודמת.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <p className="text-xs font-bold text-ink/35">
                      טקסט שאלה גולמי
                    </p>
                    <p className="mt-3 text-2xl font-bold leading-relaxed">
                      {currentQuestion?.question_text}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-xl bg-canvas px-3 py-2 font-bold">
                        {currentQuestion?.question_type}
                      </span>
                      <span className="rounded-xl bg-amber/15 px-3 py-2 font-bold text-amber-dark">
                        {potentialPoints} נק׳ פוטנציאליות
                      </span>
                      <span className="rounded-xl bg-violet/10 px-3 py-2 font-bold text-violet">
                        {revealedHints}/{currentQuestion?.hints.length ?? 0}{' '}
                        רמזים
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="grid min-h-72 place-items-center text-center">
                <p className="font-display text-xl font-black text-ink/45">
                  אין מתמודד נוכחי
                </p>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-[24px] bg-hero p-5 text-white shadow-hero">
              <p className="text-xs font-bold text-white/50">ניקוד נוכחי</p>
              <p className="mt-1 font-display text-5xl font-black text-mint">
                {currentScore}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center text-xs">
                <span>
                  <strong className="block text-lg text-white">
                    {currentStats?.correct ?? 0}
                  </strong>
                  <span className="text-white/45">נכון</span>
                </span>
                <span>
                  <strong className="block text-lg text-white">
                    {currentStats?.wrong ?? 0}
                  </strong>
                  <span className="text-white/45">שגוי</span>
                </span>
                <span>
                  <strong className="block text-lg text-white">
                    {currentStats?.hintsUsed ?? 0}
                  </strong>
                  <span className="text-white/45">רמזים</span>
                </span>
              </div>
            </section>

            <section className="rounded-[24px] border border-ink/[0.06] bg-white p-4 shadow-card">
              <h2 className="font-display font-black">בקרי בדיקה</h2>
              {gamePhase === 'opening' ? (
                <button
                  type="button"
                  onClick={startGame}
                  disabled={!currentContestant}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 font-bold text-white disabled:opacity-40"
                >
                  <Play size={18} /> התחלת המשחק
                </button>
              ) : null}
              {gamePhase !== 'opening' && gamePhase !== 'idle' ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={previousQuestion}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-canvas px-3 py-2.5 text-sm font-bold"
                  >
                    <ArrowRight size={17} /> הקודמת
                  </button>
                  <button
                    type="button"
                    onClick={nextQuestion}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-canvas px-3 py-2.5 text-sm font-bold"
                  >
                    הבאה <ArrowLeft size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => revealNextHint()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber/15 px-3 py-2.5 text-sm font-bold text-amber-dark"
                  >
                    <Lightbulb size={17} /> רמז
                  </button>
                  <button
                    type="button"
                    onClick={togglePause}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet/10 px-3 py-2.5 text-sm font-bold text-violet"
                  >
                    {gamePhase === 'paused' ? (
                      <Play size={17} />
                    ) : (
                      <Pause size={17} />
                    )}
                    {gamePhase === 'paused' ? 'המשך' : 'השהיה'}
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkCorrect}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal/10 px-3 py-2.5 text-sm font-bold text-teal"
                  >
                    <Check size={17} /> נכון
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkWrong}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-coral/10 px-3 py-2.5 text-sm font-bold text-coral"
                  >
                    <X size={17} /> שגוי
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => void endGame().catch(() => undefined)}
                disabled={
                  gamePhase === 'opening' ||
                  gamePhase === 'idle' ||
                  gamePhase === 'finished' ||
                  isEnding
                }
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-bold text-ink/55 hover:bg-canvas disabled:opacity-35"
              >
                {isEnding ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : (
                  <Flag size={17} />
                )}{' '}
                סיום ושמירת תוצאות
              </button>
              {gamePhase === 'finished' ? (
                <div className="mt-3 rounded-xl bg-teal/10 p-3 text-sm font-bold text-teal">
                  <Clock3 className="ml-2 inline" size={16} />
                  נשמרו {totalTime ?? 0} שניות משחק
                </div>
              ) : null}
            </section>
          </aside>
        </div>

        <section
          className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-dashed border-ink/15 bg-white/55 px-4 py-3 text-xs font-semibold text-ink/50"
          aria-label="מקשי קיצור"
        >
          <span>
            <kbd>1–9</kbd> קפיצה
          </span>
          <span>
            <kbd>← →</kbd> ניווט
          </span>
          <span>
            <kbd>Space</kbd> השהיה
          </span>
          <span>
            <kbd>H / י</kbd> רמז
          </span>
          <span>
            <kbd>כ / F / V</kbd> נכון
          </span>
          <span>
            <kbd>ל / K / L</kbd> שגוי
          </span>
          <span>
            <kbd>Esc</kbd> יציאה
          </span>
        </section>
      </main>
    </div>
  );
}
