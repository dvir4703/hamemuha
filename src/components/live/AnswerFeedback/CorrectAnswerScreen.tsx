import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

import type { QuestionWithRelations } from '../../../types';

interface CorrectAnswerScreenProps {
  question: QuestionWithRelations;
  pointsAwarded: number;
  autoAdvanceMs: number;
  paused: boolean;
}

export function CorrectAnswerScreen({
  question,
  pointsAwarded,
  autoAdvanceMs,
  paused,
}: CorrectAnswerScreenProps) {
  return (
    <section
      className="mx-auto grid min-h-[30rem] max-w-5xl place-items-center py-6 text-center"
      data-answer-feedback="correct"
      aria-live="assertive"
    >
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.78, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 230, damping: 18 }}
          className="relative mx-auto grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(from_20deg,#9fe1d4,#f2b84b,#9fe1d4,#7771c7,#9fe1d4)] p-3 shadow-[0_24px_70px_rgba(40,125,120,0.24)]"
          aria-label={`${pointsAwarded} נקודות`}
        >
          <div className="grid h-full w-full place-items-center rounded-full border-4 border-white/80 bg-white text-ink">
            <div>
              <span className="block text-sm font-black text-teal">קיבלתם</span>
              <strong className="mt-1 block font-display text-6xl font-black leading-none">
                +{pointsAwarded}
              </strong>
              <span className="mt-1 block text-sm font-black text-ink/45">
                נקודות
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.36 }}
        >
          <div className="mt-7 flex items-center justify-center gap-3 text-teal">
            <Sparkles size={28} />
            <h3 className="font-display text-5xl font-black sm:text-6xl">
              בול! תשובה נכונה 🎉
            </h3>
          </div>
          <p className="mt-3 text-xl font-bold text-ink/55">
            יופי של תשובה — ממשיכים עם האנרגיה הזאת.
          </p>
        </motion.div>

        {question.explanation ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.32 }}
            className="mx-auto mt-7 max-w-3xl rounded-[24px] border border-teal/15 bg-teal/[0.07] px-6 py-5 text-right"
          >
            <p className="text-sm font-black text-teal">למה זה נכון?</p>
            <p className="mt-2 text-xl font-semibold leading-relaxed text-ink/75">
              {question.explanation}
            </p>
          </motion.div>
        ) : null}

        <div className="mx-auto mt-7 max-w-md">
          <p className="flex items-center justify-center gap-2 text-sm font-bold text-ink/45">
            <ArrowRight size={17} />
            {paused
              ? 'ההתקדמות האוטומטית מושהית'
              : 'אפשר להמשיך עכשיו עם חץ ימינה'}
          </p>
          {!paused ? (
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10"
              aria-hidden="true"
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: autoAdvanceMs / 1000, ease: 'linear' }}
                className="h-full rounded-full bg-teal"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
