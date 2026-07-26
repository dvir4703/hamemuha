import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Flag, LoaderCircle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

import { AnswerFeedbackScreen } from '../../components/live/AnswerFeedback/AnswerFeedbackScreen';
import { KeyboardCheatSheet } from '../../components/live/KeyboardCheatSheet';
import { LiveConfirmationDialog } from '../../components/live/LiveConfirmationDialog';
import { LiveQuestionRenderer } from '../../components/live/LiveQuestionRenderer';
import { PauseOverlay } from '../../components/live/PauseOverlay';
import { useKeyboard } from '../../hooks/useKeyboard';
import { selectCurrentQuestion, useLiveStore } from '../../store/liveStore';
import '../../styles/live-theme.css';
import { OpeningScreen } from './OpeningScreen';
import { ScoreboardScreen } from './ScoreboardScreen';

export default function LiveGame() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { id: quizIdParam } = useParams();
  const quizId = Number(quizIdParam);
  const quiz = useLiveStore((state) => state.quiz);
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
  const lastAnswerResult = useLiveStore((state) => state.lastAnswerResult);
  const previousGamePhase = useLiveStore((state) => state.previousGamePhase);
  const isLoading = useLiveStore((state) => state.isLoading);
  const isEnding = useLiveStore((state) => state.isEnding);
  const error = useLiveStore((state) => state.error);
  const loadQuiz = useLiveStore((state) => state.loadQuiz);
  const startGame = useLiveStore((state) => state.startGame);
  const submitAnswer = useLiveStore((state) => state.submitAnswer);
  const resetGame = useLiveStore((state) => state.resetGame);
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
  const isHintQuestion =
    currentQuestion?.question_type === 'complete_sentence' ||
    currentQuestion?.question_type === 'association_hints';
  const isOpenAnswerQuestion = currentQuestion?.question_type === 'open_answer';
  const isShowingFeedback = Boolean(
    currentQuestion &&
    lastAnswerResult?.questionId === currentQuestion.id &&
    (gamePhase === 'showing_answer' ||
      (gamePhase === 'paused' && previousGamePhase === 'showing_answer')),
  );

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
    if (gamePhase !== 'playing' || !isOpenAnswerQuestion) return;
    submitAnswer(true, potentialPoints);
  }, [gamePhase, isOpenAnswerQuestion, potentialPoints, submitAnswer]);
  const handleMarkWrong = useCallback(() => {
    if (gamePhase !== 'playing' || !isOpenAnswerQuestion) return;
    submitAnswer(false, 0);
  }, [gamePhase, isOpenAnswerQuestion, submitAnswer]);
  const handleExitRequest = useCallback(() => {
    setExitConfirmationOpen(true);
  }, []);
  const handleCancelExit = useCallback(() => {
    setExitConfirmationOpen(false);
  }, []);
  const handleConfirmExit = useCallback(() => {
    setExitConfirmationOpen(false);
    resetGame();
    navigate('/');
  }, [navigate, resetGame]);
  const handleReturnHome = useCallback(() => {
    resetGame();
    navigate('/');
  }, [navigate, resetGame]);

  useKeyboard({
    enabled:
      !isLoading &&
      !exitConfirmationOpen &&
      !cheatSheetOpen &&
      gamePhase !== 'opening' &&
      gamePhase !== 'finished',
    hintEnabled: gamePhase === 'playing' && isHintQuestion,
    judgementEnabled: gamePhase === 'playing' && isOpenAnswerQuestion,
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
  const contestantFinished =
    currentQuestions.length === 0 || currentIndex >= currentQuestions.length;
  const displayedQuestionNumber =
    currentQuestions.length === 0
      ? 0
      : contestantFinished
        ? currentQuestions.length
        : Math.min(currentIndex + 1, currentQuestions.length);

  if (isLoading) {
    return (
      <div className="live-stage relative grid min-h-screen place-items-center overflow-hidden px-6">
        <div className="live-stage__atmosphere" aria-hidden="true" />
        <div className="live-stage__beam" aria-hidden="true" />
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-[#f4b942]"
            size={44}
          />
          <p className="mt-4 text-lg font-bold text-white/55">
            מכינים את הבמה…
          </p>
        </div>
      </div>
    );
  }

  if (gamePhase === 'opening') {
    return (
      <>
        <OpeningScreen
          quiz={quiz}
          canStart={contestants.length > 0}
          enabled={!cheatSheetOpen}
          onStart={startGame}
        />
        <KeyboardCheatSheet
          open={cheatSheetOpen}
          onOpenChange={setCheatSheetOpen}
        />
      </>
    );
  }

  if (gamePhase === 'finished') {
    return (
      <ScoreboardScreen
        quiz={quiz}
        contestants={contestants}
        scoresByContestant={scores}
        statsByContestant={stats}
        isSavingResults={isEnding}
        onReturnHome={handleReturnHome}
      />
    );
  }

  return (
    <div className="live-stage relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="live-stage__atmosphere" aria-hidden="true" />
      <div className="live-stage__beam" aria-hidden="true" />

      <main className="relative mx-auto max-w-[1540px]">
        {error ? (
          <div
            className="mb-4 flex items-center justify-center gap-3 rounded-2xl border border-red-300/25 bg-red-950/55 px-5 py-3 text-center font-bold text-red-100 shadow-2xl backdrop-blur"
            role="alert"
          >
            <AlertCircle size={20} /> {error}
          </div>
        ) : null}

        <motion.header
          initial={
            shouldReduceMotion ? false : { opacity: 0, y: -24, scale: 0.985 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.46, ease: [0.22, 0.85, 0.25, 1] }}
          className="live-stage__broadcast-bar flex min-h-24 items-stretch justify-between gap-3 rounded-[1.75rem] px-4 py-3 sm:gap-6 sm:px-6"
          aria-label="מצב המתמודד הנוכחי"
        >
          {currentContestant ? (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#ffe08a]/25 bg-[#f4b942]/10 font-display text-xl font-black text-[#ffe08a] sm:h-14 sm:w-14 sm:text-2xl"
                  aria-hidden="true"
                >
                  {currentContestant.display_order}
                </span>
                <div className="min-w-0">
                  <p className="live-stage__eyebrow">עכשיו על הבמה</p>
                  <h1
                    id="current-contestant-name"
                    className="truncate font-display text-2xl font-black leading-tight text-white sm:text-4xl"
                  >
                    {currentContestant.name}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                <div className="live-stage__question-count hidden rounded-2xl px-4 py-3 text-center sm:block">
                  <span className="block text-xs font-bold">השאלה הנוכחית</span>
                  <strong className="mt-0.5 block font-display text-lg font-black text-white">
                    {displayedQuestionNumber} מתוך {currentQuestions.length}
                  </strong>
                </div>

                <div
                  className="live-stage__score min-w-[7.2rem] rounded-2xl px-4 py-2 text-center sm:min-w-[9rem] sm:px-6"
                  aria-live="polite"
                  aria-label={`${currentScore} נקודות`}
                >
                  <span className="relative block text-[0.68rem] font-black tracking-wide text-white/70">
                    ניקוד
                  </span>
                  <motion.strong
                    key={`${currentContestant.id}-${currentScore}`}
                    initial={
                      shouldReduceMotion
                        ? false
                        : { opacity: 0, y: 14, scale: 0.82 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 320,
                      damping: 22,
                    }}
                    className="live-stage__score-value relative block font-display text-4xl font-black leading-none text-white sm:text-5xl"
                  >
                    {currentScore}
                  </motion.strong>
                  <span className="relative mt-1 block text-[0.65rem] font-bold text-white/65">
                    נקודות
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="grid w-full place-items-center text-lg font-bold text-white/55">
              ממתינים למתמודד
            </div>
          )}
        </motion.header>

        <div className="mt-3 text-center text-xs font-bold text-white/45 sm:hidden">
          שאלה {displayedQuestionNumber} מתוך {currentQuestions.length}
        </div>

        <section
          className="live-stage__question-frame mt-4 min-h-[calc(100vh-9.5rem)] overflow-hidden rounded-[2rem] p-4 sm:mt-5 sm:min-h-[calc(100vh-12rem)] sm:p-6 lg:p-8"
          aria-label={
            currentContestant
              ? `השאלה של ${currentContestant.name}`
              : 'במת השאלה'
          }
        >
          {currentContestant ? (
            contestantFinished ? (
              <div className="live-stage__empty grid min-h-[calc(100vh-14rem)] place-items-center rounded-[1.5rem] text-center">
                <motion.div
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0, y: 24, scale: 0.94 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                >
                  <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-[#d58d18]/30 bg-[#f4b942]/10 text-[#b87812]">
                    <Flag size={38} />
                  </span>
                  <h2 className="mt-6 font-display text-4xl font-black text-[#11152c] sm:text-6xl">
                    כל השאלות הושלמו
                  </h2>
                  <p className="mt-3 text-xl font-bold text-[#11152c]/50">
                    כל הכבוד, {currentContestant.name}
                  </p>
                </motion.div>
              </div>
            ) : (
              <div className="py-2 sm:py-4">
                {currentQuestion ? (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={
                        isShowingFeedback
                          ? `feedback-${lastAnswerResult?.submissionId}`
                          : `question-${currentQuestion.id}`
                      }
                      initial={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : {
                              opacity: 0,
                              x: 72,
                              scale: 0.965,
                              filter: 'blur(9px)',
                            }
                      }
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        filter: 'blur(0px)',
                      }}
                      exit={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : {
                              opacity: 0,
                              x: -54,
                              scale: 0.98,
                              filter: 'blur(6px)',
                            }
                      }
                      transition={{
                        duration: shouldReduceMotion ? 0.12 : 0.46,
                        ease: [0.22, 0.82, 0.24, 1],
                      }}
                    >
                      {isShowingFeedback && lastAnswerResult ? (
                        <AnswerFeedbackScreen
                          question={currentQuestion}
                          result={lastAnswerResult}
                          paused={
                            gamePhase === 'paused' ||
                            exitConfirmationOpen ||
                            cheatSheetOpen
                          }
                        />
                      ) : (
                        <LiveQuestionRenderer
                          question={currentQuestion}
                          revealedHints={revealedHints}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                ) : null}
              </div>
            )
          ) : (
            <div className="live-stage__empty grid min-h-[calc(100vh-14rem)] place-items-center rounded-[1.5rem] text-center">
              <p className="font-display text-3xl font-black text-[#11152c]/40">
                ממתינים לשאלה הבאה
              </p>
            </div>
          )}
        </section>
      </main>

      <KeyboardCheatSheet
        open={cheatSheetOpen}
        questionType={currentQuestion?.question_type}
        onOpenChange={setCheatSheetOpen}
      />
      <AnimatePresence>
        {gamePhase === 'paused' ? <PauseOverlay visible /> : null}
      </AnimatePresence>
      <LiveConfirmationDialog
        open={exitConfirmationOpen}
        title="לצאת מהמשחק?"
        description="האם אתם בטוחים שברצונכם לצאת? התקדמות החידון תאבד."
        confirmLabel="יציאה מהמשחק"
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />
    </div>
  );
}
