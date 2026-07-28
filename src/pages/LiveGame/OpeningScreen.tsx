import { useEffect } from 'react';
import { Play } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import companyLogo from '../../assets/images/company-logo.jpeg';
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
  const shouldReduceMotion = useReducedMotion();

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
    <div className="live-opening relative min-h-screen overflow-hidden px-5 py-8 text-white sm:px-8">
      <div className="live-opening__atmosphere" aria-hidden="true">
        <div className="live-opening__particles" />
        <div className="live-opening__orbit" />
      </div>
      <div className="live-stage__beam" aria-hidden="true" />

      <main className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl place-items-center text-center">
        <section className="w-full" aria-labelledby="opening-quiz-name">
          <motion.div
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, scale: 0.72, rotate: -6 }
            }
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              delay: 0.08,
              type: 'spring',
              stiffness: 150,
              damping: 18,
            }}
          >
            <div className="live-opening__logo mx-auto mb-7 inline-flex max-w-[20rem] items-center justify-center rounded-[2rem] p-3 sm:mb-9">
              <img
                src={companyLogo}
                alt="החידון והחוויה — בניהולו של יואב שלומברג"
                className="max-h-40 max-w-full rounded-[1.35rem] object-contain sm:max-h-48"
              />
            </div>
          </motion.div>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="live-opening__eyebrow"
          >
            האורות עולים · החידון מתחיל
          </motion.p>

          <motion.div
            initial={
              shouldReduceMotion
                ? false
                : {
                    opacity: 0,
                    scale: 1.08,
                    filter: 'blur(16px)',
                    clipPath: 'inset(42% 0 42% 0)',
                  }
            }
            animate={{
              opacity: 1,
              scale: 1,
              filter: 'blur(0px)',
              clipPath: 'inset(0% 0 0% 0)',
            }}
            transition={{
              delay: 0.34,
              duration: shouldReduceMotion ? 0.1 : 0.82,
              ease: [0.16, 0.84, 0.22, 1],
            }}
          >
            <h1
              id="opening-quiz-name"
              className="live-opening__title mx-auto max-w-6xl font-display text-[clamp(3.75rem,9vw,8.5rem)] font-black leading-[0.95]"
            >
              {quiz?.name ?? 'החידון והחוויה'}
            </h1>
            <span
              className="live-opening__title-accent mt-7 sm:mt-9"
              aria-hidden="true"
            />
          </motion.div>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.84, duration: 0.42 }}
            className="mx-auto mt-6 max-w-2xl text-xl font-semibold text-white/58 sm:text-2xl"
          >
            הבמה מוכנה. מי יכבוש אותה?
          </motion.p>

          <motion.button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.98, duration: 0.44 }}
            whileHover={canStart ? { scale: 1.025, y: -2 } : undefined}
            whileTap={canStart ? { scale: 0.985 } : undefined}
            className="live-opening__start mx-auto mt-9 inline-flex min-w-[min(24rem,88vw)] items-center justify-center gap-4 rounded-[1.4rem] px-8 py-5 font-display text-xl font-black outline-none focus-visible:ring-4 focus-visible:ring-[#ffe08a]/30 disabled:cursor-not-allowed disabled:opacity-45 sm:text-2xl"
          >
            <Play className="relative" size={25} fill="currentColor" />
            <span className="relative">
              {canStart ? 'לחצו Enter להתחלה' : 'אין מתמודדים בחידון'}
            </span>
          </motion.button>

          {canStart ? (
            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.14, duration: 0.4 }}
              className="mt-4 text-sm font-bold text-white/38"
            >
              אפשר גם ללחוץ על הכפתור
            </motion.p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
