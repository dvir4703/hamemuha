import { useEffect } from 'react';
import { ArrowLeft, Play, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

import { useImageUrl } from '../../hooks/useImageUrl';
import type { Quiz } from '../../types';

interface OpeningScreenProps {
  quiz: Quiz | null;
  canStart: boolean;
  enabled: boolean;
  onStart: () => void;
}

export function OpeningScreen({
  quiz,
  canStart,
  enabled,
  onStart,
}: OpeningScreenProps) {
  const logoUrl = useImageUrl(quiz?.logo_path ?? null);

  useEffect(() => {
    if (!enabled || !canStart) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat) return;
      event.preventDefault();
      onStart();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canStart, enabled, onStart]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-hero px-6 py-10 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden="true"
      >
        <div className="absolute -right-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-teal/30 blur-3xl" />
        <div className="absolute -bottom-44 -left-24 h-[38rem] w-[38rem] rounded-full bg-violet/30 blur-3xl" />
        <div className="absolute left-[18%] top-[12%] h-40 w-40 rounded-full bg-amber/15 blur-2xl" />
      </div>

      <main className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl place-items-center text-center">
        <motion.section
          initial={{ opacity: 0, scale: 0.9, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full"
          aria-labelledby="opening-quiz-name"
        >
          {logoUrl ? (
            <motion.img
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.16, duration: 0.46 }}
              src={logoUrl}
              alt={`הלוגו של ${quiz?.name ?? 'החידון'}`}
              className="mx-auto mb-8 max-h-52 max-w-[20rem] rounded-[32px] object-contain shadow-dialog"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, rotate: -8, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ delay: 0.12, type: 'spring', stiffness: 170 }}
              className="mx-auto mb-8 grid h-28 w-28 place-items-center rounded-[34px] border border-white/15 bg-white/10 text-mint shadow-hero backdrop-blur"
              aria-hidden="true"
            >
              <Sparkles size={54} />
            </motion.div>
          )}

          <p className="text-base font-black tracking-wide text-mint">
            החידון והחוויה מציגים
          </p>
          <h1
            id="opening-quiz-name"
            className="mx-auto mt-4 max-w-5xl font-display text-6xl font-black leading-[1.05] sm:text-7xl lg:text-8xl"
          >
            {quiz?.name ?? 'החידון והחוויה'}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-2xl font-semibold text-white/65">
            מוכנים? מתחילים יחד, חושבים יחד וחוגגים כל תשובה.
          </p>

          <motion.button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            whileHover={canStart ? { scale: 1.025 } : undefined}
            whileTap={canStart ? { scale: 0.98 } : undefined}
            className="mx-auto mt-10 inline-flex min-w-80 items-center justify-center gap-4 rounded-[22px] bg-mint px-8 py-5 font-display text-2xl font-black text-ink shadow-[0_18px_45px_rgba(159,225,212,0.24)] outline-none transition focus-visible:ring-4 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Play size={26} fill="currentColor" />
            {canStart ? 'לחצו כאן כדי להתחיל' : 'אין מתמודדים בחידון'}
          </motion.button>
          {canStart ? (
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white/45">
              או לחצו Enter במקלדת <ArrowLeft size={16} />
            </p>
          ) : null}
        </motion.section>
      </main>
    </div>
  );
}
