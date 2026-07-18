import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Crown,
  Download,
  Home,
  LoaderCircle,
  Medal,
  Sparkles,
  Star,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { Toast } from '../../components/ui/Toast';
import { useImageDataUrl } from '../../hooks/useImageDataUrl';
import type { ContestantLiveStats } from '../../store/liveStore';
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

async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((image) => image.decode().catch(() => undefined)),
  );
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
  const logoUrl = useImageDataUrl(quiz?.logo_path ?? null);
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

  useEffect(() => {
    const rowDelay = Math.min(Math.max(entries.length - 1, 0) * 220, 2000);
    const timeout = window.setTimeout(
      () => setRevealComplete(true),
      shouldReduceMotion ? 0 : 900 + rowDelay,
    );
    return () => window.clearTimeout(timeout);
  }, [entries.length, shouldReduceMotion]);

  const handleSaveImage = async () => {
    const exportElement = exportRef.current;
    if (!exportElement || isExporting || isSavingResults) return;

    setIsExporting(true);
    setExportError(null);
    try {
      await document.fonts.ready;
      await waitForImages(exportElement);
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(exportElement, {
        backgroundColor: '#293153',
        scale: Math.min(2, Math.max(1.5, window.devicePixelRatio)),
        useCORS: true,
        logging: false,
        imageTimeout: 6000,
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
    <div className="relative min-h-screen overflow-hidden bg-ink px-4 py-6 text-white sm:px-7 lg:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-36 -top-44 h-[38rem] w-[38rem] rounded-full bg-teal/30 blur-3xl" />
        <div className="absolute -bottom-52 -left-40 h-[42rem] w-[42rem] rounded-full bg-violet/25 blur-3xl" />
        <div className="absolute left-1/2 top-12 h-44 w-44 -translate-x-1/2 rounded-full bg-amber/15 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-[1480px]">
        <section
          ref={exportRef}
          className={`scoreboard-export-surface relative overflow-hidden rounded-[34px] border border-white/10 bg-hero px-5 py-7 shadow-dialog sm:px-8 lg:px-12 lg:py-10 ${revealComplete ? 'scoreboard-reveal-complete' : ''}`}
          aria-labelledby="scoreboard-title"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-45"
            aria-hidden="true"
          >
            <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full border-[46px] border-mint/10" />
            <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full border-[58px] border-violet/10" />
          </div>

          <motion.header
            data-scoreboard-motion
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative flex flex-col items-center text-center"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`הלוגו של ${quiz?.name ?? 'החידון'}`}
                className="mb-5 max-h-28 max-w-64 rounded-[24px] object-contain shadow-hero"
              />
            ) : (
              <span className="mb-5 grid h-20 w-20 place-items-center rounded-[26px] border border-white/15 bg-white/10 text-mint shadow-hero">
                <Sparkles size={39} aria-hidden="true" />
              </span>
            )}
            <p className="font-display text-sm font-black tracking-wide text-mint">
              רגע הסיום שלנו
            </p>
            <h1
              id="scoreboard-title"
              className="mt-2 max-w-5xl font-display text-4xl font-black leading-tight sm:text-5xl lg:text-6xl"
            >
              {quiz?.name ?? 'החידון והחוויה'}
            </h1>
            <div className="mt-5 flex items-center gap-3 rounded-full border border-mint/20 bg-mint/10 px-5 py-3 text-lg font-bold text-mint sm:text-xl">
              <Star size={21} fill="currentColor" aria-hidden="true" />
              {celebrationMessage}
            </div>
          </motion.header>

          <div className="relative mt-8" aria-label="דירוג המתמודדים">
            {entries.length > 0 ? (
              <div className="space-y-3">
                {entries.map((entry, index) => {
                  const revealOrder = entries.length - index - 1;
                  const isWinner = entry.rank === 1;
                  return (
                    <motion.article
                      key={entry.contestant.id}
                      data-scoreboard-motion
                      data-scoreboard-rank={entry.rank}
                      initial={
                        shouldReduceMotion
                          ? false
                          : { opacity: 0, y: 28, scale: 0.985 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: shouldReduceMotion
                          ? 0
                          : 0.38 + Math.min(revealOrder * 0.22, 2),
                        duration: 0.44,
                        ease: [0.2, 0.8, 0.2, 1],
                      }}
                      className={`grid items-center gap-4 rounded-[24px] border px-4 py-4 sm:grid-cols-[4.5rem_minmax(12rem,1.4fr)_8rem_minmax(12rem,1fr)_7rem] sm:px-6 ${
                        isWinner
                          ? 'border-mint/45 bg-mint text-ink shadow-[0_18px_50px_rgba(159,225,212,0.18)]'
                          : 'border-white/10 bg-white/[0.075] text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:block sm:text-center">
                        <span
                          className={`grid h-14 w-14 place-items-center rounded-2xl font-display text-2xl font-black ${
                            isWinner
                              ? 'bg-ink text-amber shadow-button'
                              : entry.rank <= 3
                                ? 'bg-white/15 text-amber'
                                : 'bg-white/10 text-white'
                          }`}
                          aria-label={`מקום ${entry.rank}`}
                        >
                          {isWinner ? (
                            <Crown size={29} fill="currentColor" />
                          ) : entry.rank <= 3 ? (
                            <Medal size={27} />
                          ) : (
                            entry.rank
                          )}
                        </span>
                        <span
                          className={`mt-1 hidden text-xs font-black sm:block ${isWinner ? 'text-ink/55' : 'text-white/45'}`}
                        >
                          מקום {entry.rank}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate font-display text-2xl font-black sm:text-3xl">
                          {entry.contestant.name}
                        </h2>
                        <p
                          className={`mt-1 text-sm font-bold ${isWinner ? 'text-ink/55' : 'text-white/45'}`}
                        >
                          {isWinner
                            ? `${entry.contestant.name}, אתם אלופים!`
                            : `${entry.answered} תשובות נענו`}
                        </p>
                      </div>

                      <div>
                        <p
                          className={`text-xs font-black ${isWinner ? 'text-ink/50' : 'text-white/45'}`}
                        >
                          ניקוד סופי
                        </p>
                        <strong className="font-display text-4xl font-black">
                          {entry.score}
                        </strong>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div
                          className={`rounded-2xl px-3 py-2 ${isWinner ? 'bg-white/45' : 'bg-white/[0.07]'}`}
                        >
                          <strong className="block font-display text-2xl">
                            {entry.correct}
                          </strong>
                          <span
                            className={`text-xs font-bold ${isWinner ? 'text-ink/55' : 'text-white/45'}`}
                          >
                            נכונות
                          </span>
                        </div>
                        <div
                          className={`rounded-2xl px-3 py-2 ${isWinner ? 'bg-white/45' : 'bg-white/[0.07]'}`}
                        >
                          <strong className="block font-display text-2xl">
                            {entry.wrong}
                          </strong>
                          <span
                            className={`text-xs font-bold ${isWinner ? 'text-ink/55' : 'text-white/45'}`}
                          >
                            שגויות
                          </span>
                        </div>
                      </div>

                      <div
                        className={`grid h-20 w-20 place-items-center justify-self-start rounded-full border-4 sm:justify-self-center ${
                          isWinner
                            ? 'border-ink/15 bg-white/60'
                            : 'border-mint/25 bg-mint/10'
                        }`}
                        aria-label={`${entry.successRate} אחוזי הצלחה`}
                      >
                        <div className="text-center">
                          <strong className="block font-display text-2xl font-black leading-none">
                            {entry.successRate}%
                          </strong>
                          <span
                            className={`text-[0.65rem] font-black ${isWinner ? 'text-ink/50' : 'text-white/45'}`}
                          >
                            הצלחה
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.07] px-6 py-12 text-center">
                <p className="font-display text-2xl font-black">
                  אין מתמודדים להצגה
                </p>
              </div>
            )}
          </div>

          {winner ? (
            <motion.footer
              data-scoreboard-motion
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: shouldReduceMotion
                  ? 0
                  : 0.8 + Math.min((entries.length - 1) * 0.22, 2),
              }}
              className="relative mt-6 flex items-center justify-center gap-2 text-center text-sm font-bold text-white/45"
            >
              <Sparkles size={17} className="text-amber" aria-hidden="true" />
              תודה לכל מי ששיחק, חשב, ניסה ולמד יחד
            </motion.footer>
          ) : null}
        </section>

        <div className="mt-5 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onReturnHome}
            disabled={isSavingResults || isExporting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 font-bold text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/25 disabled:opacity-40"
          >
            <Home size={20} aria-hidden="true" /> חזרה לתפריט הראשי
          </button>

          <div className="text-center sm:text-left">
            {isSavingResults ? (
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-mint">
                <LoaderCircle className="animate-spin" size={17} /> שומרים את
                תוצאות המשחק…
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSaveImage()}
              disabled={
                isSavingResults || isExporting || !revealComplete || !winner
              }
              className="inline-flex min-w-56 items-center justify-center gap-2 rounded-2xl bg-mint px-7 py-3.5 font-display text-lg font-black text-ink shadow-[0_14px_34px_rgba(159,225,212,0.22)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/35 disabled:translate-y-0 disabled:opacity-45"
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
          <p
            className="mt-4 rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-center font-bold text-red-100"
            role="alert"
          >
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
