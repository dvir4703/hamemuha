import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { useImageUrl } from '../../../hooks/useImageUrl';
import type { Answer, QuestionWithRelations } from '../../../types';
import { calculatePotentialPoints } from '../../../utils/liveQuestion';

interface AnswerSelectionProps {
  question: QuestionWithRelations;
  revealedHints: number;
  revealedOptions: number;
  timeoutExpired: boolean;
  onSubmit: (
    isCorrect: boolean,
    pointsAwarded: number,
    wasTimeout?: boolean,
  ) => void;
  disabled?: boolean;
  forceSingle?: boolean;
  compact?: boolean;
  progressiveReveal?: boolean;
}

interface AnswerTileProps {
  answer: Answer;
  index: number;
  selected: boolean;
  multiple: boolean;
  disabled: boolean;
  showLetterBadge: boolean;
  trueFalse: boolean;
  reduceMotion: boolean;
  goofyEntrance: boolean;
  onToggle: (answerId: number) => void;
}

const hebrewAnswerLabels = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];

function answerLabel(index: number): string {
  return hebrewAnswerLabels[index] ?? String(index + 1);
}

function AnswerTile({
  answer,
  index,
  selected,
  multiple,
  disabled,
  showLetterBadge,
  trueFalse,
  reduceMotion,
  goofyEntrance,
  onToggle,
}: AnswerTileProps) {
  const imageUrl = useImageUrl(answer.image_path);

  return (
    <motion.button
      layout={goofyEntrance ? 'position' : undefined}
      type="button"
      onClick={() => onToggle(answer.id)}
      disabled={disabled}
      aria-pressed={selected}
      initial={
        reduceMotion
          ? false
          : goofyEntrance
            ? {
                opacity: 0,
                x: index % 2 === 0 ? 34 : -34,
                y: -30,
                scale: 1.26,
                rotate: index % 2 === 0 ? -15 : 15,
              }
            : { opacity: 0, y: 26, scale: 0.955, rotate: 0 }
      }
      animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
      transition={
        goofyEntrance
          ? {
              type: 'spring',
              stiffness: 255,
              damping: 12,
              mass: 0.72,
            }
          : {
              delay: reduceMotion ? 0 : 0.18 + index * 0.075,
              duration: 0.38,
              ease: [0.22, 0.82, 0.24, 1],
            }
      }
      whileHover={disabled ? undefined : { y: -4, scale: 1.018 }}
      whileTap={disabled ? undefined : { scale: 0.992 }}
      className="live-answer-tile group"
      data-selected={selected}
      data-true-false={trueFalse}
    >
      {showLetterBadge ? (
        <span className="live-answer-tile__badge" aria-hidden="true">
          {answerLabel(index)}
        </span>
      ) : null}

      <span className="live-answer-tile__content">
        {imageUrl ? (
          <span className="live-answer-tile__media" aria-hidden="true">
            <img src={imageUrl} alt="" />
          </span>
        ) : null}
        <span className="live-answer-tile__text">{answer.answer_text}</span>
      </span>

      <span
        className="live-answer-tile__selection"
        data-multiple={multiple}
        aria-hidden="true"
      >
        <Check size={19} strokeWidth={3} />
      </span>
    </motion.button>
  );
}

export function AnswerSelection({
  question,
  revealedHints,
  revealedOptions,
  timeoutExpired,
  onSubmit,
  disabled = false,
  forceSingle = false,
  compact = false,
  progressiveReveal = false,
}: AnswerSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const timeoutHandledRef = useRef(false);
  const reduceMotion = Boolean(useReducedMotion());
  const answers = useMemo(
    () =>
      [...question.answers].sort(
        (a, b) => a.display_order - b.display_order || a.id - b.id,
      ),
    [question.answers],
  );
  const correctIds = useMemo(
    () =>
      answers.filter((answer) => answer.is_correct).map((answer) => answer.id),
    [answers],
  );
  const multiple = !forceSingle && correctIds.length > 1;
  const trueFalse = question.question_type === 'true_false';
  const visibleAnswers = progressiveReveal
    ? answers.slice(0, Math.max(0, revealedOptions))
    : answers;
  const allOptionsRevealed =
    !progressiveReveal || visibleAnswers.length === answers.length;

  const toggleAnswer = (answerId: number) => {
    if (disabled) return;
    setSelectedIds((current) => {
      if (!multiple) return [answerId];
      return current.includes(answerId)
        ? current.filter((id) => id !== answerId)
        : [...current, answerId];
    });
  };

  const submitSelection = useCallback(
    (wasTimeout = false) => {
      if (disabled) return;
      const selected = new Set(selectedIds);
      const isCorrect =
        selected.size === correctIds.length &&
        correctIds.every((answerId) => selected.has(answerId));
      onSubmit(
        isCorrect,
        isCorrect ? calculatePotentialPoints(question, revealedHints) : 0,
        wasTimeout,
      );
    },
    [correctIds, disabled, onSubmit, question, revealedHints, selectedIds],
  );

  useEffect(() => {
    if (!timeoutExpired || timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;
    if (selectedIds.length === 0) {
      onSubmit(false, 0, true);
      return;
    }
    submitSelection(true);
  }, [onSubmit, selectedIds.length, submitSelection, timeoutExpired]);

  return (
    <div
      className="live-answer-bank"
      data-compact={compact}
      data-true-false={trueFalse}
      data-progressive-reveal={progressiveReveal}
      data-all-options-revealed={allOptionsRevealed}
    >
      <div
        className="live-answer-bank__grid"
        aria-label={multiple ? 'בחירת מספר תשובות' : 'בחירת תשובה אחת'}
      >
        {visibleAnswers.map((answer, index) => (
          <AnswerTile
            key={answer.id}
            answer={answer}
            index={index}
            selected={selectedIds.includes(answer.id)}
            multiple={multiple}
            disabled={disabled}
            showLetterBadge={!trueFalse}
            trueFalse={trueFalse}
            reduceMotion={reduceMotion}
            goofyEntrance={progressiveReveal}
            onToggle={toggleAnswer}
          />
        ))}
      </div>

      <div className="live-answer-bank__footer">
        {multiple && visibleAnswers.length > 0 ? (
          <p className="live-answer-bank__instruction">
            נבחרו {selectedIds.length} תשובות
          </p>
        ) : null}
        <AnimatePresence initial={false}>
          {selectedIds.length > 0 && allOptionsRevealed ? (
            <motion.button
              type="button"
              onClick={() => submitSelection()}
              disabled={disabled}
              initial={
                reduceMotion ? false : { opacity: 0, y: 14, scale: 0.96 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              whileHover={disabled ? undefined : { y: -2, scale: 1.015 }}
              whileTap={disabled ? undefined : { scale: 0.985 }}
              className="live-answer-bank__submit"
            >
              הגשת תשובה
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
