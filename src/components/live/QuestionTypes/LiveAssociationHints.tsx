import { Lightbulb } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { getOrderedHints } from '../../../utils/liveQuestion';
import { AnswerSelection } from './AnswerSelection';
import { LiveQuestionHeader } from './LiveQuestionHeader';
import type { LiveQuestionTypeProps } from './types';

export function LiveAssociationHints(props: LiveQuestionTypeProps) {
  const shouldReduceMotion = useReducedMotion();
  const hints = getOrderedHints(props.question);
  const visibleHints = hints.slice(
    0,
    Math.min(hints.length, props.revealedHints + 1),
  );

  return (
    <section
      className="live-question live-question--association"
      aria-labelledby="live-association-heading"
    >
      <LiveQuestionHeader
        eyebrow="אסוציאציה ורמזים"
        headingId="live-association-heading"
        icon={<Lightbulb size={25} />}
        imagePath={props.question.image_path}
        title={props.question.question_text}
      />

      <div className="live-hints-stage">
        <AnimatePresence initial={false}>
          <motion.ol layout className="live-hints-grid" aria-live="polite">
            {visibleHints.map((hint, index) => (
              <motion.li
                layout
                key={hint.id}
                initial={
                  index === 0 || shouldReduceMotion
                    ? false
                    : { opacity: 0, y: 24, scale: 0.95 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{
                  duration: 0.36,
                  ease: [0.22, 0.82, 0.24, 1],
                }}
                className="live-hint-card"
                data-primary={index === 0}
              >
                <span className="live-hint-card__number">
                  {index === 0 ? <Lightbulb size={22} /> : index + 1}
                </span>
                <div>
                  <span className="live-hint-card__label">
                    {index === 0 ? 'הרמז הראשון' : `רמז ${index + 1}`}
                  </span>
                  <p>{hint.hint_text || 'רמז ללא טקסט'}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </AnimatePresence>

        {hints.length === 0 ? (
          <p className="live-question__empty-message">
            לא הוגדרו רמזים לשאלה הזו.
          </p>
        ) : null}
      </div>

      <AnswerSelection {...props} compact />
    </section>
  );
}
