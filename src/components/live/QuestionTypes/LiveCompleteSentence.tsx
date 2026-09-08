import { useEffect, useMemo, useRef } from 'react';
import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

import { getOrderedHints } from '../../../utils/liveQuestion';
import {
  parseRevealPositions,
  resolveLetterHintPositions,
} from '../../../utils/letterReveal';
import { LetterAnswerBoard } from './LetterAnswerBoard';
import { LiveQuestionHeader } from './LiveQuestionHeader';
import type { LiveQuestionTypeProps } from './types';

export function LiveCompleteSentence({
  question,
  revealedHints,
  timeoutExpired,
  onSubmit,
  disabled = false,
}: LiveQuestionTypeProps) {
  const correctAnswer = question.correct_answer_text ?? '';
  const activeHints = useMemo(
    () => getOrderedHints(question).slice(0, revealedHints),
    [question, revealedHints],
  );
  const revealedPositions = useMemo(
    () =>
      new Set([
        ...parseRevealPositions(question.prerevealed_positions),
        ...resolveLetterHintPositions(
          correctAnswer,
          activeHints
            .filter((hint) => hint.hint_type === 'letter_reveal')
            .map((hint) => hint.hint_text),
        ).flat(),
      ]),
    [activeHints, correctAnswer, question.prerevealed_positions],
  );
  const timeoutHandledRef = useRef(false);
  useEffect(() => {
    if (disabled || !timeoutExpired || timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;
    onSubmit(false, 0, true);
  }, [disabled, onSubmit, timeoutExpired]);

  return (
    <section
      className="live-question live-question--complete-sentence"
      aria-labelledby="live-complete-sentence-heading"
    >
      <LiveQuestionHeader
        headingId="live-complete-sentence-heading"
        imagePath={question.image_path}
        title={question.question_text}
      />
      {correctAnswer ? (
        <div className="live-complete-sentence__form">
          <LetterAnswerBoard
            answer={correctAnswer}
            revealedPositions={revealedPositions}
          />
          <div className="live-text-hints" aria-live="polite">
            {activeHints
              .filter((hint) => hint.hint_type === 'text')
              .map((hint) => (
                <motion.article layout key={hint.id} className="live-text-hint">
                  <span className="live-text-hint__icon" aria-hidden="true">
                    <Lightbulb size={21} />
                  </span>
                  <span>{hint.hint_text}</span>
                </motion.article>
              ))}
          </div>
        </div>
      ) : (
        <p className="live-question__empty-message">
          לא הוגדרה תשובה נכונה לשאלה הזו.
        </p>
      )}
    </section>
  );
}
