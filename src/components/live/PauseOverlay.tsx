import { Pause } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

interface PauseOverlayProps {
  visible: boolean;
}

export function PauseOverlay({ visible }: PauseOverlayProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      className="live-pause fixed inset-0 z-[60] grid place-items-center p-6 text-center text-white backdrop-blur-xl"
      role="status"
      aria-live="polite"
      aria-label="המשחק מושהה"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', stiffness: 170, damping: 20 }}
        className="live-pause__halo grid aspect-square w-[min(34rem,82vw)] place-items-center rounded-full p-8"
      >
        <div>
          <motion.span
            animate={
              shouldReduceMotion
                ? undefined
                : { scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }
            }
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-[#ffe08a]/40 bg-[#f4b942]/15 text-[#ffe08a] shadow-[0_0_42px_rgba(244,185,66,0.18)]"
            aria-hidden="true"
          >
            <Pause size={46} fill="currentColor" strokeWidth={1.6} />
          </motion.span>
          <h2 className="mt-8 font-display text-5xl font-black tracking-tight sm:text-7xl">
            המשחק מושהה
          </h2>
          <p className="mt-5 text-lg font-bold text-white/55 sm:text-xl">
            לחצו{' '}
            <kbd className="live-opening__key mx-1 rounded-lg px-3 py-1 font-mono text-base">
              Space
            </kbd>{' '}
            כדי להמשיך
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
