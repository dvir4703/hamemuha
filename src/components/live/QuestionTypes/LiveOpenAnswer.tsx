import { MessageCircleMore } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import { LiveQuestionHeader } from './LiveQuestionHeader';
import type { LiveQuestionTypeProps } from './types';

export function LiveOpenAnswer({ question }: LiveQuestionTypeProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="live-question live-question--open-answer"
      aria-labelledby="live-open-answer-heading"
    >
      <LiveQuestionHeader
        eyebrow="תשובה פתוחה"
        headingId="live-open-answer-heading"
        icon={<MessageCircleMore size={26} />}
        imagePath={question.image_path}
        title={question.question_text}
        variant="cinematic"
      />
      <motion.p
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36, duration: 0.34 }}
        className="live-open-answer__prompt"
      >
        <span className="live-open-answer__signal" aria-hidden="true" />
        התשובה נמסרת בעל־פה למנחה
      </motion.p>
    </section>
  );
}
