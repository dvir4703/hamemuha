import { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Crown, Home, LoaderCircle, Medal, Star, Trophy } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Howl } from 'howler';

import companyLogo from '../../assets/images/company-logo.png';
import scoreboardSoundUrl from '../../assets/sounds/scoreboard.mp3?url';
import type { ContestantLiveStats } from '../../store/liveStore';
import '../../styles/live-results.css';
import type { Contestant, Quiz } from '../../types';
import {
  buildScoreboardEntries,
  calculateAverageSuccessRate,
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
const scoreboardConfetti = confetti.create(undefined, {
  resize: true,
  useWorker: false,
  disableForReducedMotion: true,
});

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
  const shouldReduceMotion = useReducedMotion();
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
    const sound = new Howl({
      src: [scoreboardSoundUrl],
      volume: 0.66,
      preload: true,
      pool: 1,
    });
    const activationTimer = window.setTimeout(() => sound.play(), 0);

    return () => {
      window.clearTimeout(activationTimer);
      sound.stop();
      sound.unload();
    };
  }, []);

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

  return (
    <div className="live-scoreboard">
      <div className="live-scoreboard__atmosphere" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <main className="live-scoreboard__main">
        <section
          className="live-scoreboard__panel"
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
              alt="המומחה"
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
          {isSavingResults ? (
            <p className="live-scoreboard__saving">
              <LoaderCircle className="animate-spin" size={17} />
              שומרים את תוצאות המשחק…
            </p>
          ) : null}
          <button
            type="button"
            onClick={onReturnHome}
            disabled={isSavingResults}
            className="live-scoreboard__button live-scoreboard__button--primary"
          >
            <Home size={20} aria-hidden="true" />
            חזרה לתפריט הראשי
          </button>
        </div>
      </main>
    </div>
  );
}
