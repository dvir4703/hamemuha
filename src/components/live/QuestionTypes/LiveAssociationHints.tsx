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
        headingId="live-association-heading"
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
                    : {
                        opacity: 0,
                        x: index % 2 === 0 ? 52 : -52,
                        y: -16,
                        scale: 1.16,
                        rotate: index % 2 === 0 ? -9 : 9,
                      }
                }
                animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{
                  type: 'spring',
                  stiffness: 190,
                  damping: 12,
                  mass: 0.86,
                }}
                className="live-hint-card"
              >
                <span className="live-hint-card__icon" aria-hidden="true">
                  <Lightbulb size={18} />
                </span>
                <div className="live-hint-card__copy">
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
