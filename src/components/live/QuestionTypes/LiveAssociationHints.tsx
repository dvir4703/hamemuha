import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

import { getOrderedHints } from '../../../utils/liveQuestion';
import { AnswerSelection } from './AnswerSelection';
import type { LiveQuestionTypeProps } from './types';

export function LiveAssociationHints(props: LiveQuestionTypeProps) {
  const hints = getOrderedHints(props.question);
  const visibleHints = hints.slice(
    0,
    Math.min(hints.length, props.revealedHints + 1),
  );

  return (
    <section aria-labelledby="live-association-heading">
      <div className="mb-7">
        <div className="flex items-center gap-3 text-amber-dark">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber/20">
            <Lightbulb size={27} />
          </span>
          <div>
            <p className="text-sm font-black">אסוציאציה ורמזים</p>
            <h3
              id="live-association-heading"
              className="font-display text-2xl font-black sm:text-3xl"
            >
              {props.question.question_text}
            </h3>
          </div>
        </div>

        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleHints.map((hint, index) => (
            <motion.li
              key={hint.id}
              initial={index === 0 ? false : { opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className={`relative min-h-28 rounded-[22px] border p-5 ${index === 0 ? 'border-amber/45 bg-amber/20' : 'border-violet/20 bg-violet/[0.07]'}`}
            >
              <span className="absolute left-4 top-4 font-mono text-xs font-bold text-ink/30">
                רמז {index + 1}
              </span>
              <p className="flex min-h-16 items-center pl-16 font-display text-2xl font-black leading-snug">
                {hint.hint_text || 'רמז ללא טקסט'}
              </p>
            </motion.li>
          ))}
        </ol>
        {hints.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-amber/10 p-4 font-bold text-amber-dark">
            לא הוגדרו רמזים לשאלה הזו.
          </p>
        ) : null}
      </div>

      <AnswerSelection {...props} compact />
    </section>
  );
}
