import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Lightbulb } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import {
  calculatePotentialPoints,
  getOrderedHints,
} from '../../../utils/liveQuestion';
import {
  isSingleRevealCharacter,
  normalizeRevealCharacter,
  parseRevealPosition,
} from '../../../utils/letterReveal';
import { LiveQuestionHeader } from './LiveQuestionHeader';
import type { LiveQuestionTypeProps } from './types';

function normalizeAnswer(value: string): string {
  return value.trim().toLocaleLowerCase('he-IL');
}

export function LiveCompleteSentence({
  question,
  revealedHints,
  onSubmit,
  disabled = false,
}: LiveQuestionTypeProps) {
  const shouldReduceMotion = useReducedMotion();
  const correctAnswer = question.correct_answer_text ?? '';
  const characters = Array.from(correctAnswer);
  const editablePositions = characters
    .map((character, index) => ({ character, index }))
    .filter(({ character }) => !/\s/u.test(character))
    .map(({ index }) => index);
  const activeHints = getOrderedHints(question).slice(0, revealedHints);
  const activeLetterHints = activeHints.filter(
    (hint) => hint.hint_type === 'letter_reveal',
  );
  const revealedPositions = new Set<number>();

  for (const hint of activeLetterHints) {
    const selectedPosition = parseRevealPosition(hint.hint_text);
    if (
      selectedPosition !== null &&
      editablePositions.includes(selectedPosition)
    ) {
      revealedPositions.add(selectedPosition);
      continue;
    }

    const legacyCharacter = hint.hint_text?.trim() ?? '';
    if (isSingleRevealCharacter(legacyCharacter)) {
      const legacyPosition = editablePositions.find(
        (position) =>
          !revealedPositions.has(position) &&
          normalizeRevealCharacter(characters[position]) ===
            normalizeRevealCharacter(legacyCharacter),
      );
      if (legacyPosition !== undefined) revealedPositions.add(legacyPosition);
    }
  }
  const textHints = activeHints.filter((hint) => hint.hint_type === 'text');
  const [values, setValues] = useState<string[]>(() =>
    characters.map(() => ''),
  );
  const inputRefs = useRef(new Map<number, HTMLInputElement>());

  const focusPosition = (position: number | undefined) => {
    if (position === undefined) return;
    inputRefs.current.get(position)?.focus();
  };

  const findNextEditablePosition = (currentPosition: number) =>
    editablePositions.find(
      (position) =>
        position > currentPosition && !revealedPositions.has(position),
    );

  const findPreviousEditablePosition = (currentPosition: number) =>
    [...editablePositions]
      .reverse()
      .find(
        (position) =>
          position < currentPosition && !revealedPositions.has(position),
      );

  useEffect(() => {
    const activeElement = document.activeElement;
    if (
      !(activeElement instanceof HTMLInputElement) ||
      !activeElement.readOnly
    ) {
      return;
    }
    const activePosition = Number(activeElement.dataset.answerPosition);
    const availableInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        'input[data-answer-position]:not([readonly]):not([disabled])',
      ),
    );
    const nextInput =
      availableInputs.find(
        (input) => Number(input.dataset.answerPosition) > activePosition,
      ) ?? availableInputs[0];
    nextInput?.focus();
  }, [revealedHints]);

  const updateCharacter = (
    position: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue = Array.from(event.currentTarget.value).at(-1) ?? '';
    setValues((current) => {
      const next = [...current];
      next[position] = nextValue;
      return next;
    });
    if (nextValue) focusPosition(findNextEditablePosition(position));
  };

  const handleCharacterKeyDown = (
    position: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key !== 'Backspace' || values[position]) return;
    const previousPosition = findPreviousEditablePosition(position);
    if (previousPosition === undefined) return;
    event.preventDefault();
    setValues((current) => {
      const next = [...current];
      next[previousPosition] = '';
      return next;
    });
    focusPosition(previousPosition);
  };

  const displayedCharacterAt = (position: number) =>
    revealedPositions.has(position) ? characters[position] : values[position];
  const isComplete =
    editablePositions.length > 0 &&
    editablePositions.every((position) => displayedCharacterAt(position));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isComplete || disabled) return;
    const submittedAnswer = characters
      .map((character, index) =>
        /\s/u.test(character) ? character : displayedCharacterAt(index),
      )
      .join('');
    const isCorrect =
      normalizeAnswer(submittedAnswer) === normalizeAnswer(correctAnswer);
    onSubmit(
      isCorrect,
      isCorrect ? calculatePotentialPoints(question, revealedHints) : 0,
    );
  };

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
        <form onSubmit={handleSubmit} className="live-complete-sentence__form">
          <div
            className="live-letter-board"
            dir="rtl"
            aria-label="הקלדת התשובה אות אחר אות"
          >
            {characters.map((character, position) => {
              if (/\s/u.test(character)) {
                return (
                  <span
                    key={`space-${position}`}
                    className="live-letter-board__space"
                    aria-hidden="true"
                  />
                );
              }
              const isRevealed = revealedPositions.has(position);
              const displayedCharacter = displayedCharacterAt(position);
              return (
                <motion.input
                  key={position}
                  ref={(element) => {
                    if (element) inputRefs.current.set(position, element);
                    else inputRefs.current.delete(position);
                  }}
                  data-answer-position={position}
                  data-filled={Boolean(displayedCharacter)}
                  data-revealed={isRevealed}
                  value={displayedCharacter}
                  onChange={(event) => updateCharacter(position, event)}
                  onKeyDown={(event) => handleCharacterKeyDown(position, event)}
                  readOnly={isRevealed}
                  disabled={disabled}
                  maxLength={1}
                  autoComplete="off"
                  aria-label={`אות ${editablePositions.indexOf(position) + 1}`}
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0, y: 18, scale: 0.9 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: shouldReduceMotion ? 0 : 0.2 + position * 0.035,
                    duration: 0.32,
                    ease: [0.22, 0.82, 0.24, 1],
                  }}
                  className="live-letter-board__tile"
                />
              );
            })}
          </div>

          <AnimatePresence initial={false}>
            {textHints.length > 0 ? (
              <motion.div layout className="live-text-hints" aria-live="polite">
                {textHints.map((hint, index) => (
                  <motion.article
                    layout
                    key={hint.id}
                    initial={
                      shouldReduceMotion
                        ? false
                        : { opacity: 0, y: 20, scale: 0.97 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{
                      delay: shouldReduceMotion ? 0 : index * 0.06,
                      duration: 0.32,
                    }}
                    className="live-text-hint"
                  >
                    <span className="live-text-hint__icon" aria-hidden="true">
                      <Lightbulb size={21} />
                    </span>
                    <span>{hint.hint_text || 'רמז ללא טקסט'}</span>
                  </motion.article>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="live-complete-sentence__footer">
            <AnimatePresence initial={false}>
              {isComplete ? (
                <motion.button
                  type="submit"
                  disabled={disabled}
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0, y: 14, scale: 0.96 }
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
        </form>
      ) : (
        <p className="live-question__empty-message">
          לא הוגדרה תשובה נכונה לשאלה הזו.
        </p>
      )}
    </section>
  );
}
