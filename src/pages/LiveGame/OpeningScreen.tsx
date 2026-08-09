import { useEffect } from 'react';
import { Play } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import companyLogo from '../../assets/images/company-logo.png';
import type { Quiz } from '../../types';

interface OpeningScreenProps {
  quiz: Quiz | null;
  canStart: boolean;
  enabled: boolean;
  onBeginIntro: () => void;
}

export function OpeningScreen({
  quiz,
  canStart,
  enabled,
  onBeginIntro,
}: OpeningScreenProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled || !canStart) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat) return;
      event.preventDefault();
      onBeginIntro();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canStart, enabled, onBeginIntro]);

  return (
    <div className="live-opening relative min-h-screen overflow-hidden px-5 py-8 text-white sm:px-8">
      <div className="live-opening__atmosphere" aria-hidden="true">
        <div className="live-opening__particles" />
        <div className="live-opening__orbit" />
        <div className="live-opening__light-sweep" />
        <div className="live-opening__light-pulse" />
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
            <div className="live-opening__logo mx-auto mb-7 flex items-center justify-center sm:mb-9">
              <img
                src={companyLogo}
                alt="המומחה"
                className="live-opening__logo-image"
              />
            </div>
          </motion.div>

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
              className="live-opening__title mx-auto max-w-6xl font-display text-[clamp(3.75rem,9vw,8.5rem)] font-extrabold leading-[0.95]"
            >
              {quiz?.name ?? 'החידון והחוויה'}
            </h1>
            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.78,
                duration: 0.54,
              }}
              className="live-opening__tagline"
            >
              הידע עולה לבמה
            </motion.p>
            <span
              className="live-opening__title-accent mt-5 sm:mt-6"
              aria-hidden="true"
            />
          </motion.div>

          <motion.button
            type="button"
            onClick={onBeginIntro}
            disabled={!canStart}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.98, duration: 0.44 }}
            whileHover={canStart ? { scale: 1.025, y: -2 } : undefined}
            whileTap={canStart ? { scale: 0.985 } : undefined}
            className="live-opening__start mx-auto mt-12 inline-flex min-w-[min(24rem,88vw)] items-center justify-center gap-4 rounded-[1.4rem] px-8 py-5 font-display text-xl font-extrabold outline-none focus-visible:ring-4 focus-visible:ring-[#ffe08a]/30 disabled:cursor-not-allowed disabled:opacity-45 sm:text-2xl"
          >
            <Play className="relative" size={25} fill="currentColor" />
            <span className="relative">
              {canStart ? 'לחצו Enter להתחלה' : 'אין מתמודדים בחידון'}
            </span>
          </motion.button>
        </section>
      </main>
    </div>
  );
}
