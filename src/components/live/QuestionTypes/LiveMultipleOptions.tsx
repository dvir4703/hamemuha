import { LayoutGrid } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import { useImageUrl } from '../../../hooks/useImageUrl';
import { AnswerSelection } from './AnswerSelection';
import type { LiveQuestionTypeProps } from './types';

export function LiveMultipleOptions(props: LiveQuestionTypeProps) {
  const imageUrl = useImageUrl(props.question.image_path);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="live-question live-question--multiple-options"
      aria-labelledby="live-multiple-options-heading"
    >
      <motion.header
        initial={
          shouldReduceMotion ? false : { opacity: 0, y: 22, scale: 0.975 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.46, ease: [0.22, 0.82, 0.24, 1] }}
        className="live-question-poster"
        data-has-image={Boolean(imageUrl)}
      >
        <div className="live-question-poster__copy">
          <div className="live-question-header__eyebrow">
            <span className="live-question-header__icon" aria-hidden="true">
              <LayoutGrid size={25} />
            </span>
            <span>האלמנט המרכזי</span>
          </div>
          <motion.h3
            id="live-multiple-options-heading"
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, y: 18, filter: 'blur(7px)' }
            }
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.12, duration: 0.44 }}
            className="live-question-poster__title"
          >
            {props.question.question_text}
          </motion.h3>
        </div>

        {imageUrl ? (
          <motion.figure
            initial={
              shouldReduceMotion ? false : { opacity: 0, x: -26, scale: 0.94 }
            }
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.17, duration: 0.46 }}
            className="live-question-poster__media"
          >
            <img src={imageUrl} alt="" />
          </motion.figure>
        ) : (
          <div className="live-question-poster__mark" aria-hidden="true">
            <LayoutGrid size={88} strokeWidth={1.2} />
          </div>
        )}
      </motion.header>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.34 }}
        className="live-question__prompt-bar"
      >
        <h4>מה מתאים?</h4>
        <span>בחרו מהאפשרויות</span>
      </motion.div>
      <AnswerSelection {...props} />
    </section>
  );
}
