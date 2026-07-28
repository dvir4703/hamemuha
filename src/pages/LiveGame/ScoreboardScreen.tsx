import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Crown,
  Download,
  Home,
  LoaderCircle,
  Medal,
  Star,
  Trophy,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import companyLogo from '../../assets/images/company-logo.jpeg';
import { Toast } from '../../components/ui/Toast';
import type { ContestantLiveStats } from '../../store/liveStore';
import '../../styles/live-results.css';
import type { Contestant, Quiz } from '../../types';
import {
  buildScoreboardEntries,
  calculateAverageSuccessRate,
  createScoreboardFileName,
  getCelebrationMessage,
} from '../../utils/scoreboard';

interface ScoreboardScreenProps {
  quiz: Quiz | null;
  contestants: Contestant[];
  scoresByContestant: Map<number, number>;
  statsByContestant: Map<number, ContestantLiveStats>;
  isSavingResults: boolean;
  onReturnHome: () => void;
}

const SCOREBOARD_ROW_STAGGER_MS = 380;
const SCOREBOARD_REVEAL_LEAD_MS = 520;
const SCOREBOARD_WINNER_SETTLE_MS = 760;
const scoreboardConfetti = confetti.create(undefined, {
  resize: true,
  useWorker: false,
  disableForReducedMotion: true,
});

async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((image) => image.decode().catch(() => undefined)),
  );
}

async function waitForVisualFrame(): Promise<void> {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

function rankTone(rank: number): 'second' | 'third' | 'standard' {
  if (rank === 2) return 'second';
  if (rank === 3) return 'third';
  return 'standard';
}

export function ScoreboardScreen({
  quiz,
  contestants,
  scoresByContestant,
  statsByContestant,
  isSavingResults,
  onReturnHome,
}: ScoreboardScreenProps) {
  const exportRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isExporting, setIsExporting] = useState(false);
  const [revealComplete, setRevealComplete] = useState(
    Boolean(shouldReduceMotion),
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const entries = useMemo(
    () =>
      buildScoreboardEntries(
        contestants,
        scoresByContestant,
        statsByContestant,
      ),
    [contestants, scoresByContestant, statsByContestant],
  );
  const averageSuccessRate = calculateAverageSuccessRate(entries);
  const celebrationMessage = getCelebrationMessage(averageSuccessRate);
  const winner = entries[0];
  const rankedContestants = entries.slice(1);
  const winnerRevealDelayMs =
    SCOREBOARD_REVEAL_LEAD_MS +
    Math.max(entries.length - 1, 0) * SCOREBOARD_ROW_STAGGER_MS;

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setRevealComplete(true),
      shouldReduceMotion
        ? 0
        : winnerRevealDelayMs + SCOREBOARD_WINNER_SETTLE_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [shouldReduceMotion, winnerRevealDelayMs]);

  useEffect(() => {
    if (
      !winner ||
      shouldReduceMotion ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const colors = ['#f4b942', '#ffe08a', '#f6f7ff', '#1b1c4d'];
    const timers: number[] = [];
    const winnerTimer = window.setTimeout(() => {
      scoreboardConfetti({
        particleCount: 110,
        spread: 102,
        startVelocity: 42,
        gravity: 0.82,
        origin: { x: 0.5, y: 0.24 },
        colors,
        disableForReducedMotion: true,
      });

      timers.push(
        window.setTimeout(() => {
          scoreboardConfetti({
            particleCount: 66,
            angle: 58,
            spread: 62,
            startVelocity: 54,
            origin: { x: 0.04, y: 0.7 },
            colors,
            disableForReducedMotion: true,
          });
          scoreboardConfetti({
            particleCount: 66,
            angle: 122,
            spread: 62,
            startVelocity: 54,
            origin: { x: 0.96, y: 0.7 },
            colors,
            disableForReducedMotion: true,
          });
        }, 220),
      );
    }, winnerRevealDelayMs);

    return () => {
      window.clearTimeout(winnerTimer);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [shouldReduceMotion, winner, winnerRevealDelayMs]);

  const handleSaveImage = async () => {
    const exportElement = exportRef.current;
    if (!exportElement || isExporting || isSavingResults) return;

    setIsExporting(true);
    setExportError(null);
    try {
      await document.fonts.ready;
      await waitForImages(exportElement);
      await waitForVisualFrame();
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(exportElement, {
        backgroundColor: '#050713',
        scale: Math.min(2, Math.max(1.5, window.devicePixelRatio)),
        useCORS: true,
        logging: false,
        imageTimeout: 6000,
        onclone: (clonedDocument) => {
          clonedDocument
            .querySelector('[data-scoreboard-export]')
            ?.setAttribute('data-exporting-image', 'true');
        },
      });
      const result = await window.api.export.saveScoreboardImage({
        dataUrl: canvas.toDataURL('image/png'),
        defaultFileName: createScoreboardFileName(
          quiz?.name ?? 'החידון-והחוויה',
        ),
      });

      if (result.saved) {
        setToastMessage('תמונת התוצאות נשמרה בהצלחה');
      }
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : 'שמירת תמונת התוצאות לא הושלמה.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="live-scoreboard">
      <div className="live-scoreboard__atmosphere" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <main className="live-scoreboard__main">
        <section
          ref={exportRef}
          className={`live-scoreboard__export ${
            revealComplete ? 'scoreboard-reveal-complete' : ''
          }`}
          data-scoreboard-export
          aria-labelledby="scoreboard-title"
        >
          <div className="live-scoreboard__stage-rings" aria-hidden="true" />

          <motion.header
            data-scoreboard-motion
            initial={
              shouldReduceMotion ? false : { opacity: 0, y: -30, scale: 0.94 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.62,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="live-scoreboard__header"
          >
            <img
              src={companyLogo}
              alt="החידון והחוויה — בניהולו של יואב שלומברג"
              className="live-scoreboard__logo"
            />
            <div className="live-scoreboard__title-block">
              <h1 id="scoreboard-title">{quiz?.name ?? 'החידון והחוויה'}</h1>
            </div>
            <div className="live-scoreboard__message">
              <Star size={20} fill="currentColor" aria-hidden="true" />
              {celebrationMessage}
              <Star size={20} fill="currentColor" aria-hidden="true" />
            </div>
          </motion.header>

          {winner ? (
            <motion.article
              data-scoreboard-motion
              data-scoreboard-rank="1"
              initial={
                shouldReduceMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 64,
                      scale: 0.72,
                      rotateX: 14,
                    }
              }
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              transition={{
                delay: shouldReduceMotion ? 0 : winnerRevealDelayMs / 1000,
                type: 'spring',
                stiffness: 180,
                damping: 16,
                mass: 0.9,
              }}
              className="live-scoreboard__champion"
            >
              <div className="live-scoreboard__crown-stage" aria-hidden="true">
                <span className="live-scoreboard__crown-rays" />
                <Crown size={62} fill="currentColor" />
              </div>

              <div className="live-scoreboard__champion-copy">
                <span>המקום הראשון</span>
                <h2>{winner.contestant.name}</h2>
              </div>

              <div className="live-scoreboard__champion-score">
                <span>ניקוד סופי</span>
                <strong>{winner.score}</strong>
                <small>נקודות</small>
              </div>

              <div className="live-scoreboard__champion-stats">
                <div>
                  <strong>{winner.correct}</strong>
                  <span>נכונות</span>
                </div>
                <div>
                  <strong>{winner.successRate}%</strong>
                  <span>הצלחה</span>
                </div>
              </div>
            </motion.article>
          ) : null}

          <div
            className="live-scoreboard__rankings"
            aria-label="דירוג המתמודדים"
          >
            {rankedContestants.length > 0 ? (
              rankedContestants.map((entry, index) => {
                const revealOrder = rankedContestants.length - index - 1;
                return (
                  <motion.article
                    key={entry.contestant.id}
                    data-scoreboard-motion
                    data-scoreboard-rank={entry.rank}
                    data-rank-tone={rankTone(entry.rank)}
                    initial={
                      shouldReduceMotion
                        ? false
                        : {
                            opacity: 0,
                            x: index % 2 === 0 ? 76 : -76,
                            y: 24,
                            scale: 0.88,
                          }
                    }
                    animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    transition={{
                      delay: shouldReduceMotion
                        ? 0
                        : SCOREBOARD_REVEAL_LEAD_MS / 1000 +
                          revealOrder * (SCOREBOARD_ROW_STAGGER_MS / 1000),
                      type: 'spring',
                      stiffness: 205,
                      damping: 20,
                    }}
                    className="live-scoreboard__entry"
                  >
                    <span
                      className="live-scoreboard__rank"
                      aria-label={`מקום ${entry.rank}`}
                    >
                      {entry.rank <= 3 ? (
                        <Medal size={28} aria-hidden="true" />
                      ) : (
                        entry.rank
                      )}
                      <small>מקום {entry.rank}</small>
                    </span>

                    <div className="live-scoreboard__contestant">
                      <h2>{entry.contestant.name}</h2>
                      <p>{entry.answered} תשובות נענו</p>
                    </div>

                    <div className="live-scoreboard__score">
                      <span>ניקוד</span>
                      <strong>{entry.score}</strong>
                    </div>

                    <div className="live-scoreboard__mini-stats">
                      <span>
                        <strong>{entry.correct}</strong> נכונות
                      </span>
                      <span>
                        <strong>{entry.wrong}</strong> שגויות
                      </span>
                    </div>

                    <div
                      className="live-scoreboard__success"
                      aria-label={`${entry.successRate} אחוזי הצלחה`}
                    >
                      <strong>{entry.successRate}%</strong>
                      <span>הצלחה</span>
                    </div>
                  </motion.article>
                );
              })
            ) : winner ? null : (
              <div className="live-scoreboard__empty">
                <Trophy size={38} aria-hidden="true" />
                <p>אין מתמודדים להצגה</p>
              </div>
            )}
          </div>
        </section>

        <div className="live-scoreboard__actions">
          <button
            type="button"
            onClick={onReturnHome}
            disabled={isSavingResults || isExporting}
            className="live-scoreboard__button live-scoreboard__button--secondary"
          >
            <Home size={20} aria-hidden="true" />
            חזרה לתפריט הראשי
          </button>

          <div>
            {isSavingResults ? (
              <p className="live-scoreboard__saving">
                <LoaderCircle className="animate-spin" size={17} />
                שומרים את תוצאות המשחק…
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSaveImage()}
              disabled={
                isSavingResults || isExporting || !revealComplete || !winner
              }
              className="live-scoreboard__button live-scoreboard__button--primary"
            >
              {isExporting ? (
                <LoaderCircle className="animate-spin" size={20} />
              ) : (
                <Download size={20} aria-hidden="true" />
              )}
              {isExporting
                ? 'מכינים את התמונה…'
                : revealComplete
                  ? 'שמור כתמונה'
                  : 'חושפים את הדירוג…'}
            </button>
          </div>
        </div>

        {exportError ? (
          <p className="live-scoreboard__error" role="alert">
            {exportError}
          </p>
        ) : null}
      </main>

      <AnimatePresence>
        {toastMessage ? (
          <Toast
            key={toastMessage}
            message={toastMessage}
            onClose={() => setToastMessage(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
