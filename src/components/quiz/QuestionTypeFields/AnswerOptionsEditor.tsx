import { Check, Plus, Trash2 } from 'lucide-react';

import type { AnswerDraft } from './types';
import { createAnswerDraft } from './types';

interface AnswerOptionsEditorProps {
  answers: AnswerDraft[];
  onChange: (answers: AnswerDraft[]) => void;
  error?: string;
  title?: string;
  addLabel?: string;
  accent?: 'teal' | 'coral' | 'amber';
}

const selectedClasses = {
  teal: 'border-teal bg-teal/5 text-teal',
  coral: 'border-coral bg-coral/5 text-coral',
  amber: 'border-amber bg-amber/10 text-amber-dark',
};

export function AnswerOptionsEditor({
  answers,
  onChange,
  error,
  title = 'אפשרויות תשובה',
  addLabel = 'הוספת תשובה',
  accent = 'teal',
}: AnswerOptionsEditorProps) {
  const update = (key: string, changes: Partial<AnswerDraft>) => {
    onChange(
      answers.map((answer) =>
        answer.key === key ? { ...answer, ...changes } : answer,
      ),
    );
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-black">{title}</h3>
          <p className="mt-0.5 text-xs text-ink/45">
            סמנו את כל התשובות שייחשבו נכונות
          </p>
        </div>
        <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-bold text-ink/45">
          {answers.length} אפשרויות
        </span>
      </div>

      <div className="space-y-2.5">
        {answers.map((answer, index) => (
          <div
            key={answer.key}
            className={`grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-2xl border p-2 transition ${answer.isCorrect ? selectedClasses[accent] : 'border-ink/10 bg-white'}`}
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-canvas text-xs font-black text-ink/35">
              {index + 1}
            </span>
            <label className="sr-only" htmlFor={`answer-${answer.key}`}>
              תשובה {index + 1}
            </label>
            <input
              id={`answer-${answer.key}`}
              value={answer.answerText}
              onChange={(event) =>
                update(answer.key, { answerText: event.target.value })
              }
              placeholder={`אפשרות ${index + 1}`}
              className="min-w-0 bg-transparent px-2 py-2.5 font-semibold text-ink outline-none placeholder:text-ink/30"
            />
            <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={answer.isCorrect}
                onChange={(event) =>
                  update(answer.key, { isCorrect: event.target.checked })
                }
                className="peer sr-only"
              />
              <span
                className={`grid h-6 w-6 place-items-center rounded-lg border transition ${answer.isCorrect ? 'border-current bg-current' : 'border-ink/20 bg-white'}`}
              >
                {answer.isCorrect ? (
                  <Check className="text-white" size={15} strokeWidth={3} />
                ) : null}
              </span>
              נכון
            </label>
            <button
              type="button"
              onClick={() =>
                onChange(answers.filter((item) => item.key !== answer.key))
              }
              disabled={answers.length <= 2}
              className="rounded-xl p-2 text-ink/30 hover:bg-coral/10 hover:text-coral disabled:opacity-20"
              aria-label={`הסרת אפשרות ${index + 1}`}
              title={answers.length <= 2 ? 'נדרשות לפחות שתי אפשרויות' : 'הסרה'}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {error ? (
        <p className="mt-2 text-sm font-bold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => onChange([...answers, createAnswerDraft()])}
        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-ink/15 px-4 py-2.5 text-sm font-bold text-teal hover:border-teal/30 hover:bg-teal/5"
      >
        <Plus size={17} /> {addLabel}
      </button>
    </div>
  );
}
