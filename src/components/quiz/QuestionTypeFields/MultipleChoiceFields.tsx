import { Shuffle } from 'lucide-react';

import { AnswerOptionsEditor } from './AnswerOptionsEditor';
import type { AnswerDraft, FieldErrors } from './types';

interface MultipleChoiceFieldsProps {
  answers: AnswerDraft[];
  shuffleAnswers: boolean;
  errors: FieldErrors;
  onAnswersChange: (answers: AnswerDraft[]) => void;
  onShuffleChange: (shuffle: boolean) => void;
}

export function MultipleChoiceFields({
  answers,
  shuffleAnswers,
  errors,
  onAnswersChange,
  onShuffleChange,
}: MultipleChoiceFieldsProps) {
  return (
    <div className="space-y-5">
      <AnswerOptionsEditor
        answers={answers}
        onChange={onAnswersChange}
        error={errors.answers}
        title="תשובות לשאלה האמריקאית"
      />
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-teal/5 px-4 py-3.5 ring-1 ring-teal/10">
        <span className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-teal">
            <Shuffle size={18} />
          </span>
          <span>
            <strong className="block text-sm">ערבוב אקראי</strong>
            <span className="text-xs text-ink/45">
              סדר התשובות ישתנה בכל הצגה
            </span>
          </span>
        </span>
        <input
          type="checkbox"
          checked={shuffleAnswers}
          onChange={(event) => onShuffleChange(event.target.checked)}
          className="h-5 w-5 accent-teal"
        />
      </label>
    </div>
  );
}
