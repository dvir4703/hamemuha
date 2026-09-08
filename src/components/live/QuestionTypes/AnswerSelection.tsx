import { useEffect, useMemo, useRef } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

import { useImageUrl } from '../../../hooks/useImageUrl';
import type { Answer, QuestionWithRelations } from '../../../types';
import { useLiveStore } from '../../../store/liveStore';

interface AnswerSelectionProps {
  question: QuestionWithRelations;
  timeoutExpired: boolean;
  onSubmit: (
    isCorrect: boolean,
    pointsAwarded: number,
    wasTimeout?: boolean,
  ) => void;
  disabled?: boolean;
  forceSingle?: boolean;
  compact?: boolean;
}

interface AnswerTileProps {
  answer: Answer;
  index: number;
  selected: boolean;
  multiple: boolean;
  disabled: boolean;
  showLetterBadge: boolean;
  trueFalse: boolean;
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
  onToggle,
}: AnswerTileProps) {
  const imageUrl = useImageUrl(answer.image_path);

  return (
    <motion.button
      type="button"
      onClick={() => onToggle(answer.id)}
      disabled={disabled}
      aria-pressed={selected}
      initial={false}
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
  timeoutExpired,
  disabled = false,
  forceSingle = false,
  compact = false,
}: AnswerSelectionProps) {
  const selectedIds = useLiveStore((state) => state.selectedAnswerIds);
  const hiddenIds = useLiveStore((state) =>
    state.fiftyFiftyHiddenIdsByQuestion.get(question.id),
  );
  const toggleSelectedAnswer = useLiveStore(
    (state) => state.toggleSelectedAnswer,
  );
  const submitSelectedAnswer = useLiveStore(
    (state) => state.submitSelectedAnswer,
  );
  const timeoutHandledRef = useRef(false);
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
  const visibleAnswers = answers.filter(
    (answer) => !hiddenIds?.includes(answer.id),
  );
  const toggleAnswer = (answerId: number) => {
    if (!disabled) toggleSelectedAnswer(answerId);
  };

  useEffect(() => {
    if (disabled || !timeoutExpired || timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;
    submitSelectedAnswer(true);
  }, [disabled, submitSelectedAnswer, timeoutExpired]);

  return (
    <div
      className="live-answer-bank"
      data-compact={compact}
      data-true-false={trueFalse}
    >
      <div
        className="live-answer-bank__grid"
        aria-label={multiple ? 'בחירת מספר תשובות' : 'בחירת תשובה אחת'}
      >
        {visibleAnswers.map((answer) => (
          <AnswerTile
            key={answer.id}
            answer={answer}
            index={answers.indexOf(answer)}
            selected={selectedIds.includes(answer.id)}
            multiple={multiple}
            disabled={disabled}
            showLetterBadge={!trueFalse}
            trueFalse={trueFalse}
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
      </div>
    </div>
  );
}
