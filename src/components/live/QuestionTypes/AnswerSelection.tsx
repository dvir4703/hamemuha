import { useState } from 'react';
import { Check } from 'lucide-react';

import { useImageUrl } from '../../../hooks/useImageUrl';
import type { Answer, QuestionWithRelations } from '../../../types';
import { calculatePotentialPoints } from '../../../utils/liveQuestion';

interface AnswerSelectionProps {
  question: QuestionWithRelations;
  revealedHints: number;
  onSubmit: (isCorrect: boolean, pointsAwarded: number) => void;
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
  onToggle: (answerId: number) => void;
}

const answerTones = [
  'border-teal/25 bg-teal/[0.08] hover:bg-teal/[0.14]',
  'border-violet/25 bg-violet/[0.08] hover:bg-violet/[0.14]',
  'border-amber/35 bg-amber/[0.13] hover:bg-amber/[0.2]',
  'border-coral/25 bg-coral/[0.08] hover:bg-coral/[0.14]',
];

const badgeTones = ['bg-teal', 'bg-violet', 'bg-amber-dark', 'bg-coral'];

function AnswerTile({
  answer,
  index,
  selected,
  multiple,
  disabled,
  onToggle,
}: AnswerTileProps) {
  const imageUrl = useImageUrl(answer.image_path);

  return (
    <button
      type="button"
      onClick={() => onToggle(answer.id)}
      disabled={disabled}
      aria-pressed={selected}
      className={`group relative min-h-28 overflow-hidden rounded-[24px] border-2 p-5 text-right transition duration-200 ${answerTones[index % answerTones.length]} ${selected ? 'ring-4 ring-ink/15 ring-offset-2' : 'hover:-translate-y-0.5 hover:shadow-card'} disabled:translate-y-0 disabled:cursor-default disabled:opacity-80`}
    >
      <span
        className={`absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-xl font-display text-base font-black text-white ${badgeTones[index % badgeTones.length]}`}
        aria-hidden="true"
      >
        {index + 1}
      </span>
      <span className="flex min-h-16 items-center gap-4 pl-12">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-20 w-24 shrink-0 rounded-2xl object-cover shadow-sm"
          />
        ) : null}
        <span className="font-display text-2xl font-black leading-snug text-ink sm:text-3xl">
          {answer.answer_text}
        </span>
      </span>
      <span
        className={`absolute bottom-4 left-4 grid h-8 w-8 place-items-center border-2 transition ${multiple ? 'rounded-lg' : 'rounded-full'} ${selected ? 'border-ink bg-ink text-white' : 'border-ink/20 bg-white/75 text-transparent'}`}
        aria-hidden="true"
      >
        <Check size={18} strokeWidth={3} />
      </span>
    </button>
  );
}

export function AnswerSelection({
  question,
  revealedHints,
  onSubmit,
  disabled = false,
  forceSingle = false,
  compact = false,
}: AnswerSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const answers = [...question.answers].sort(
    (a, b) => a.display_order - b.display_order || a.id - b.id,
  );
  const correctIds = answers
    .filter((answer) => answer.is_correct)
    .map((answer) => answer.id);
  const multiple = !forceSingle && correctIds.length > 1;

  const toggleAnswer = (answerId: number) => {
    if (disabled) return;
    setSelectedIds((current) => {
      if (!multiple) return [answerId];
      return current.includes(answerId)
        ? current.filter((id) => id !== answerId)
        : [...current, answerId];
    });
  };

  const submitSelection = () => {
    const selected = new Set(selectedIds);
    const isCorrect =
      selected.size === correctIds.length &&
      correctIds.every((answerId) => selected.has(answerId));
    onSubmit(
      isCorrect,
      isCorrect ? calculatePotentialPoints(question, revealedHints) : 0,
    );
  };

  return (
    <div>
      <div
        className={`grid gap-4 ${compact ? 'sm:grid-cols-2' : answers.length > 2 ? 'md:grid-cols-2' : 'sm:grid-cols-2'}`}
        aria-label={multiple ? 'בחירת מספר תשובות' : 'בחירת תשובה אחת'}
      >
        {answers.map((answer, index) => (
          <AnswerTile
            key={answer.id}
            answer={answer}
            index={index}
            selected={selectedIds.includes(answer.id)}
            multiple={multiple}
            disabled={disabled}
            onToggle={toggleAnswer}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-base font-bold text-ink/50">
          {multiple
            ? `אפשר לבחור כמה תשובות · נבחרו ${selectedIds.length}`
            : 'יש לבחור תשובה אחת'}
        </p>
        {selectedIds.length > 0 ? (
          <button
            type="button"
            onClick={submitSelection}
            disabled={disabled}
            className="min-w-48 rounded-2xl bg-ink px-7 py-4 font-display text-xl font-black text-white shadow-button transition hover:bg-hero disabled:opacity-35"
          >
            הגשת תשובה
          </button>
        ) : null}
      </div>
    </div>
  );
}
