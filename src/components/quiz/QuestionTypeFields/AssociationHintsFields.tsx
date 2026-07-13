import { Eye, Lightbulb, Plus, Trash2 } from 'lucide-react';

import { AnswerOptionsEditor } from './AnswerOptionsEditor';
import type { AnswerDraft, FieldErrors, HintDraft } from './types';
import { createHintDraft } from './types';

interface AssociationHintsFieldsProps {
  hints: HintDraft[];
  answers: AnswerDraft[];
  errors: FieldErrors;
  onHintsChange: (hints: HintDraft[]) => void;
  onAnswersChange: (answers: AnswerDraft[]) => void;
}

export function AssociationHintsFields({
  hints,
  answers,
  errors,
  onHintsChange,
  onAnswersChange,
}: AssociationHintsFieldsProps) {
  const updateHint = (key: string, changes: Partial<HintDraft>) => {
    onHintsChange(
      hints.map((hint) =>
        hint.key === key ? { ...hint, ...changes, hintType: 'text' } : hint,
      ),
    );
  };

  return (
    <div className="space-y-7">
      <section className="rounded-[22px] border border-amber/30 bg-amber/[0.07] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-dark shadow-sm">
              <Lightbulb size={21} />
            </span>
            <div>
              <h3 className="font-display font-black">רמזים ואסוציאציות</h3>
              <p className="text-xs text-ink/45">
                הרמז הראשון גלוי תמיד; השאר נחשפים לפי דרישה
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-amber-dark shadow-sm">
            {hints.length} רמזים
          </span>
        </div>

        <div className="space-y-3">
          {hints.map((hint, index) => (
            <div
              key={hint.key}
              className="grid gap-2 rounded-2xl border border-amber/25 bg-white p-3 md:grid-cols-[auto_minmax(0,1fr)_8rem_auto] md:items-end"
            >
              <span className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-amber/15 font-display text-sm font-black text-amber-dark md:mb-0">
                {index + 1}
              </span>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-ink/50">
                  טקסט הרמז{' '}
                  {index === 0 ? (
                    <span className="inline-flex items-center gap-1 text-teal">
                      <Eye size={13} /> גלוי ראשון
                    </span>
                  ) : null}
                </span>
                <input
                  value={hint.hintText}
                  onChange={(event) =>
                    updateHint(hint.key, { hintText: event.target.value })
                  }
                  className="w-full rounded-xl border border-ink/10 px-3 py-2.5 outline-none focus:border-amber"
                  placeholder="אסוציאציה קצרה"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-ink/50">
                  הפחתת נקודות
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={hint.pointsPenalty}
                  onChange={(event) =>
                    updateHint(hint.key, {
                      pointsPenalty: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-ink/10 px-3 py-2.5 outline-none focus:border-amber"
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  onHintsChange(hints.filter((item) => item.key !== hint.key))
                }
                disabled={hints.length <= 1}
                className="mb-0.5 rounded-xl p-2 text-ink/30 hover:bg-coral/10 hover:text-coral disabled:opacity-20"
                aria-label={`הסרת רמז ${index + 1}`}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        {errors.hints ? (
          <p className="mt-2 text-sm font-bold text-red-700">{errors.hints}</p>
        ) : null}
        <button
          type="button"
          onClick={() => onHintsChange([...hints, createHintDraft('text')])}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-amber/50 px-4 py-2.5 text-sm font-bold text-amber-dark hover:bg-amber/10"
        >
          <Plus size={17} /> הוספת רמז
        </button>
      </section>

      <section className="rounded-[22px] border border-ink/[0.07] bg-white p-5">
        <AnswerOptionsEditor
          answers={answers}
          onChange={onAnswersChange}
          error={errors.answers}
          title="אפשרויות התשובה"
          addLabel="הוספת אפשרות"
          accent="amber"
        />
      </section>
    </div>
  );
}
