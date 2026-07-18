import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Lightbulb, TextCursorInput } from 'lucide-react';

import {
  calculatePotentialPoints,
  getOrderedHints,
} from '../../../utils/liveQuestion';
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
  const correctAnswer = question.correct_answer_text ?? '';
  const characters = Array.from(correctAnswer);
  const editablePositions = characters
    .map((character, index) => ({ character, index }))
    .filter(({ character }) => !/\s/u.test(character))
    .map(({ index }) => index);
  const activeHints = getOrderedHints(question).slice(0, revealedHints);
  const revealedLetterCount = activeHints.filter(
    (hint) => hint.hint_type === 'letter_reveal',
  ).length;
  const revealedPositions = new Set(
    editablePositions.slice(0, revealedLetterCount),
  );
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
    <section aria-labelledby="live-complete-sentence-heading">
      <div className="text-center">
        <TextCursorInput className="mx-auto text-teal" size={42} />
        <p className="mt-3 text-sm font-black text-teal">השלימו את המשפט</p>
        <h3
          id="live-complete-sentence-heading"
          className="mx-auto mt-2 max-w-5xl font-display text-4xl font-black leading-tight sm:text-5xl"
        >
          {question.question_text}
        </h3>
      </div>

      {correctAnswer ? (
        <form onSubmit={handleSubmit} className="mt-9">
          <div
            className="flex flex-wrap justify-center gap-y-4"
            dir="rtl"
            aria-label="הקלדת התשובה אות אחר אות"
          >
            {characters.map((character, position) => {
              if (/\s/u.test(character)) {
                return (
                  <span
                    key={`space-${position}`}
                    className="w-7 sm:w-10"
                    aria-hidden="true"
                  />
                );
              }
              const isRevealed = revealedPositions.has(position);
              return (
                <input
                  key={position}
                  ref={(element) => {
                    if (element) inputRefs.current.set(position, element);
                    else inputRefs.current.delete(position);
                  }}
                  data-answer-position={position}
                  value={displayedCharacterAt(position)}
                  onChange={(event) => updateCharacter(position, event)}
                  onKeyDown={(event) => handleCharacterKeyDown(position, event)}
                  readOnly={isRevealed}
                  disabled={disabled}
                  maxLength={1}
                  autoComplete="off"
                  aria-label={`אות ${editablePositions.indexOf(position) + 1}`}
                  className={`mx-1 h-16 w-12 rounded-2xl border-2 text-center font-display text-3xl font-black outline-none transition sm:h-20 sm:w-14 sm:text-4xl ${isRevealed ? 'border-amber bg-amber/20 text-amber-dark shadow-[inset_0_-4px_0_rgba(242,184,75,0.35)]' : 'border-ink/15 bg-white focus:border-teal focus:ring-4 focus:ring-teal/15'} disabled:opacity-75`}
                />
              );
            })}
          </div>

          {textHints.length > 0 ? (
            <div
              className="mx-auto mt-7 max-w-3xl space-y-2"
              aria-live="polite"
            >
              {textHints.map((hint) => (
                <div
                  key={hint.id}
                  className="flex items-center gap-3 rounded-2xl bg-violet/[0.08] px-5 py-3 font-bold text-violet"
                >
                  <Lightbulb size={20} />
                  <span>{hint.hint_text || 'רמז ללא טקסט'}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-8 text-center">
            {isComplete ? (
              <button
                type="submit"
                disabled={disabled}
                className="min-w-56 rounded-2xl bg-ink px-8 py-4 font-display text-xl font-black text-white shadow-button transition hover:bg-hero disabled:opacity-35"
              >
                הגשת תשובה
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <p className="mx-auto mt-8 max-w-2xl rounded-2xl bg-coral/10 p-5 text-center font-bold text-coral">
          לא הוגדרה תשובה נכונה לשאלה הזו.
        </p>
      )}
    </section>
  );
}
