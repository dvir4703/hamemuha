import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Flag, LoaderCircle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

import { AnswerFeedbackScreen } from '../../components/live/AnswerFeedback/AnswerFeedbackScreen';
import { KeyboardCheatSheet } from '../../components/live/KeyboardCheatSheet';
import { LiveConfirmationDialog } from '../../components/live/LiveConfirmationDialog';
import { LiveQuestionRenderer } from '../../components/live/LiveQuestionRenderer';
import { PauseOverlay } from '../../components/live/PauseOverlay';
import { QuestionTimer } from '../../components/live/QuestionTimer';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useQuestionAudio } from '../../hooks/useQuestionAudio';
import { useQuestionTimer } from '../../hooks/useQuestionTimer';
import { useContestantTimer } from '../../hooks/useContestantTimer';
import { selectCurrentQuestion, useLiveStore } from '../../store/liveStore';
import '../../styles/live-theme.css';
import { IntroVideoScreen } from './IntroVideoScreen';
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
  const questionEntrySequence = useLiveStore(
    (state) => state.questionEntrySequence,
  );
  const currentQuestion = useLiveStore(selectCurrentQuestion);
  const revealedHints = useLiveStore(
    (state) => state.revealedHintsForCurrentQuestion,
  );
  const lastAnswerResult = useLiveStore((state) => state.lastAnswerResult);
  const previousGamePhase = useLiveStore((state) => state.previousGamePhase);
  const isLoading = useLiveStore((state) => state.isLoading);
  const isEnding = useLiveStore((state) => state.isEnding);
  const error = useLiveStore((state) => state.error);
  const loadQuiz = useLiveStore((state) => state.loadQuiz);
  const beginIntroVideo = useLiveStore((state) => state.beginIntroVideo);
  const startGame = useLiveStore((state) => state.startGame);
  const resetGame = useLiveStore((state) => state.resetGame);
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
  const isContestantTiming = quiz?.timing_mode === 'per_contestant';
  const contestantTimer = useContestantTimer(
    exitConfirmationOpen || cheatSheetOpen,
  );
  const isShowingFeedback = Boolean(
    currentQuestion &&
    lastAnswerResult?.questionId === currentQuestion.id &&
    (gamePhase === 'showing_answer' ||
      (gamePhase === 'paused' && previousGamePhase === 'showing_answer')),
  );
  const questionTimer = useQuestionTimer(
    currentQuestion?.id ?? null,
    isContestantTiming ? null : (currentQuestion?.time_limit ?? null),
    !isContestantTiming &&
      gamePhase === 'playing' &&
      !isShowingFeedback &&
      !exitConfirmationOpen &&
      !cheatSheetOpen,
    questionEntrySequence,
  );
  const questionTimerPaused =
    gamePhase === 'paused' || exitConfirmationOpen || cheatSheetOpen;
  const activeTimer = isContestantTiming ? contestantTimer : questionTimer;
  const showQuestionTimer = Boolean(
    currentQuestion &&
    activeTimer.remainingSeconds !== null &&
    !isShowingFeedback &&
    (gamePhase === 'playing' ||
      (gamePhase === 'paused' && previousGamePhase === 'playing')),
  );

  useQuestionAudio(
    currentQuestion?.id ?? null,
    isContestantTiming ? 10 : (currentQuestion?.time_limit ?? null),
    gamePhase === 'playing' &&
      !isShowingFeedback &&
      !activeTimer.hasExpired &&
      !exitConfirmationOpen &&
      !cheatSheetOpen,
    questionEntrySequence,
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

  const handleExitRequest = useCallback(() => {
    setCheatSheetOpen(false);
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
    enabled: !exitConfirmationOpen,
    gameActionsEnabled:
      !isLoading &&
      !cheatSheetOpen &&
      gamePhase !== 'opening' &&
      gamePhase !== 'intro_video' &&
      gamePhase !== 'finished',
    onExitRequest: handleExitRequest,
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
  const exitConfirmationDialog = (
    <LiveConfirmationDialog
      open={exitConfirmationOpen}
      title="לצאת מהמשחק?"
      description="האם אתם בטוחים שברצונכם לצאת? התקדמות החידון תאבד."
      confirmLabel="יציאה מהמשחק"
      onConfirm={handleConfirmExit}
      onCancel={handleCancelExit}
    />
  );

  if (isLoading) {
    return (
      <>
        <div className="live-stage relative grid min-h-screen place-items-center overflow-hidden px-6">
          <div className="live-stage__atmosphere" aria-hidden="true" />
          <div className="live-stage__beam" aria-hidden="true" />
          <div className="text-center">
            <LoaderCircle
              className="mx-auto animate-spin text-[#f4b942]"
              size={44}
            />
            <p className="mt-4 text-lg font-bold text-white/55">
              טוענים את החידון…
            </p>
          </div>
        </div>
        {exitConfirmationDialog}
      </>
    );
  }

  if (gamePhase === 'opening') {
    return (
      <>
        <OpeningScreen
          quiz={quiz}
          canStart={contestants.length > 0}
          enabled={!cheatSheetOpen && !exitConfirmationOpen}
          onBeginIntro={beginIntroVideo}
        />
        <KeyboardCheatSheet
          open={cheatSheetOpen}
          onOpenChange={setCheatSheetOpen}
        />
        {exitConfirmationDialog}
      </>
    );
  }

  if (gamePhase === 'intro_video') {
    return (
      <>
        <IntroVideoScreen
          enabled={!exitConfirmationOpen}
          onComplete={startGame}
        />
        {exitConfirmationDialog}
      </>
    );
  }

  if (gamePhase === 'finished') {
    return (
      <>
        <ScoreboardScreen
          quiz={quiz}
          contestants={contestants}
          scoresByContestant={scores}
          statsByContestant={stats}
          isSavingResults={isEnding}
          onReturnHome={handleReturnHome}
        />
        {exitConfirmationDialog}
      </>
    );
  }

  return (
    <div
      className="live-stage relative min-h-screen overflow-hidden"
      data-timing-mode={quiz?.timing_mode}
    >
      <div className="live-stage__atmosphere" aria-hidden="true" />
      <div className="live-stage__beam" aria-hidden="true" />

      <main className="live-stage__main relative">
        {error ? (
          <div
            className="mb-4 flex items-center justify-center gap-3 rounded-2xl border border-red-300/25 bg-red-950/55 px-5 py-3 text-center font-bold text-red-100 shadow-2xl backdrop-blur"
            role="alert"
          >
            <AlertCircle size={20} /> {error}
          </div>
        ) : null}

        {currentContestant ? (
          <motion.div
            initial={
              shouldReduceMotion ? false : { opacity: 0, y: -20, scale: 0.94 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.42, ease: [0.22, 0.85, 0.25, 1] }}
            className="live-stage__score-hud"
            aria-live="polite"
            aria-label={`${currentScore} נקודות`}
          >
            <span>ניקוד</span>
            <motion.strong
              key={`${currentContestant.id}-${currentScore}`}
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.82 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
              {currentScore}
            </motion.strong>
          </motion.div>
        ) : null}

        {currentContestant ? (
          <aside
            className="live-stage__pagination-hud"
            aria-label={`שאלה ${displayedQuestionNumber} מתוך ${currentQuestions.length}`}
          >
            <strong>{displayedQuestionNumber}</strong>
            <span className="live-stage__pagination-meta" aria-hidden="true">
              <span>שאלה</span>
              <small>מתוך {currentQuestions.length}</small>
            </span>
          </aside>
        ) : null}

        <section
          className="live-stage__question-frame"
          aria-label={
            currentContestant
              ? `השאלה של ${currentContestant.name}`
              : 'במת השאלה'
          }
        >
          {currentContestant ? (
            contestantFinished ? (
              <div className="live-stage__completion">
                <motion.div
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0, y: 24, scale: 0.94 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                >
                  <span className="live-stage__completion-icon mx-auto grid h-20 w-20 place-items-center rounded-full">
                    <Flag size={38} />
                  </span>
                  <h2 className="live-stage__completion-title">
                    יישר כוח, {currentContestant.name}!
                  </h2>
                  <p className="live-stage__completion-copy">
                    {isContestantTiming && contestantTimer.hasExpired
                      ? 'הזמן הכולל הסתיים — כל הכבוד על ההשתתפות!'
                      : 'עבודה נהדרת!'}
                  </p>
                </motion.div>
              </div>
            ) : currentQuestion ? (
              <div
                key={
                  isShowingFeedback
                    ? `feedback-${lastAnswerResult?.submissionId}`
                    : `question-${currentContestant.id}-${currentQuestion.id}-${questionEntrySequence}`
                }
                className="live-stage__question-transition"
              >
                {isShowingFeedback && lastAnswerResult ? (
                  <AnswerFeedbackScreen
                    question={currentQuestion}
                    result={lastAnswerResult}
                  />
                ) : (
                  <LiveQuestionRenderer
                    key={`${currentContestant.id}-${currentQuestion.id}-${questionEntrySequence}`}
                    question={currentQuestion}
                    revealedHints={revealedHints}
                    timeoutExpired={
                      !isContestantTiming && questionTimer.hasExpired
                    }
                    contestantTimeExpired={
                      isContestantTiming && contestantTimer.hasExpired
                    }
                    blocked={exitConfirmationOpen || cheatSheetOpen}
                  />
                )}
              </div>
            ) : null
          ) : (
            <div className="live-stage__waiting">
              <p>ממתינים לשאלה הבאה</p>
            </div>
          )}
        </section>

        {currentContestant ? (
          <footer className="live-stage__corner-hud">
            <div className="live-stage__contestant-hud">
              <span aria-hidden="true">{currentContestant.display_order}</span>
              <strong id="current-contestant-name">
                {currentContestant.name}
              </strong>
            </div>
          </footer>
        ) : null}
      </main>

      <AnimatePresence>
        {showQuestionTimer && activeTimer.remainingSeconds !== null ? (
          <QuestionTimer
            key={
              isContestantTiming
                ? `contestant-${currentContestantId}`
                : `${currentQuestion?.id}-${questionEntrySequence}`
            }
            scope={isContestantTiming ? 'contestant' : 'question'}
            remainingSeconds={activeTimer.remainingSeconds}
            progress={activeTimer.progress}
            paused={questionTimerPaused}
            expired={activeTimer.hasExpired}
          />
        ) : null}
      </AnimatePresence>

      <KeyboardCheatSheet
        open={cheatSheetOpen}
        questionType={currentQuestion?.question_type}
        onOpenChange={setCheatSheetOpen}
      />
      <AnimatePresence>
        {gamePhase === 'paused' ? <PauseOverlay visible /> : null}
      </AnimatePresence>
      {exitConfirmationDialog}
    </div>
  );
}
