import { Eye, Lightbulb, Plus, Trash2 } from 'lucide-react';

import {
  getRevealablePositions,
  parseRevealPositions,
  serializeRevealPositions,
} from '../../../utils/letterReveal';
import { LetterPositionPicker } from './LetterPositionPicker';
import type { FieldErrors, HintDraft } from './types';
import { createHintDraft } from './types';

interface CompleteSentenceFieldsProps {
  correctAnswerText: string;
  hints: HintDraft[];
  prerevealedPositions: number[];
  onPrerevealedPositionsChange: (positions: number[]) => void;
  errors: FieldErrors;
  onCorrectAnswerChange: (value: string) => void;
  onHintsChange: (hints: HintDraft[]) => void;
}

export function CompleteSentenceFields({
  correctAnswerText,
  prerevealedPositions,
  onPrerevealedPositionsChange,
  hints,
  errors,
  onCorrectAnswerChange,
  onHintsChange,
}: CompleteSentenceFieldsProps) {
  const revealPositions = getRevealablePositions(correctAnswerText);

  const updateHint = (key: string, changes: Partial<HintDraft>) => {
    onHintsChange(
      hints.map((hint) => (hint.key === key ? { ...hint, ...changes } : hint)),
    );
  };

  const handleCorrectAnswerChange = (value: string) => {
    const availablePositions = new Set(getRevealablePositions(value));
    onCorrectAnswerChange(value);
    onPrerevealedPositionsChange(
      prerevealedPositions.filter((position) =>
        availablePositions.has(position),
      ),
    );
    onHintsChange(
      hints.map((hint) =>
        hint.hintType === 'letter_reveal'
          ? {
              ...hint,
              hintText: serializeRevealPositions(
                parseRevealPositions(hint.hintText).filter((position) =>
                  availablePositions.has(position),
                ),
              ),
            }
          : hint,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="sentence-answer"
          className="mb-2 block text-sm font-bold text-ink/65"
        >
          המילה או הביטוי החסרים
        </label>
        <input
          id="sentence-answer"
          value={correctAnswerText}
          onChange={(event) => handleCorrectAnswerChange(event.target.value)}
          aria-invalid={Boolean(errors.correctAnswerText)}
          className={`w-full rounded-2xl border bg-white px-4 py-3.5 font-semibold outline-none focus:ring-4 ${errors.correctAnswerText ? 'border-coral focus:ring-coral/10' : 'border-ink/10 focus:border-violet focus:ring-violet/10'}`}
          placeholder="למשל: ירושלים"
        />
        {errors.correctAnswerText ? (
          <p className="mt-2 text-sm font-bold text-red-700">
            {errors.correctAnswerText}
          </p>
        ) : null}
      </div>

      <section className="rounded-[20px] border border-violet/15 bg-violet/[0.035] p-4">
        <h3 className="font-display text-base font-black">
          אותיות גלויות מראש
        </h3>
        <p className="mb-3 mt-1 text-xs text-ink/45">
          בחרו אותיות שיופיעו מתחילת השאלה, ללא הפחתת ניקוד ובנפרד מהרמזים.
        </p>
        <LetterPositionPicker
          answer={correctAnswerText}
          selected={prerevealedPositions}
          label="בחירת אותיות גלויות מראש"
          onChange={onPrerevealedPositionsChange}
        />
      </section>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-black">רמזים</h3>
            <p className="mt-0.5 text-xs text-ink/45">
              הסדר קובע את סדר החשיפה בלייב
            </p>
          </div>
          <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-bold text-ink/45">
            {hints.length} רמזים
          </span>
        </div>

        <div className="space-y-3">
          {hints.map((hint, index) => (
            <div
              key={hint.key}
              className="rounded-[20px] border border-violet/15 bg-violet/[0.035] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-black text-violet">
                  <Lightbulb size={17} /> רמז {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onHintsChange(hints.filter((item) => item.key !== hint.key))
                  }
                  className="rounded-lg p-1.5 text-ink/30 hover:bg-coral/10 hover:text-coral"
                  aria-label={`הסרת רמז ${index + 1}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem]">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink/50">
                    סוג הרמז
                  </label>
                  <select
                    value={hint.hintType}
                    onChange={(event) =>
                      updateHint(hint.key, {
                        hintType: event.target.value as HintDraft['hintType'],
                        hintText: '',
                      })
                    }
                    className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 font-semibold outline-none focus:border-violet"
                  >
                    <option value="letter_reveal">חשיפת אותיות</option>
                    <option value="text">רמז טקסטואלי</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink/50">
                    הפחתת נקודות
                  </label>
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
                    className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 outline-none focus:border-violet"
                  />
                </div>
              </div>
              {hint.hintType === 'text' ? (
                <div className="mt-3">
                  <label className="mb-1.5 block text-xs font-bold text-ink/50">
                    טקסט הרמז
                  </label>
                  <input
                    value={hint.hintText}
                    onChange={(event) =>
                      updateHint(hint.key, { hintText: event.target.value })
                    }
                    className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 outline-none focus:border-violet"
                    placeholder="כתבו רמז קצר וברור"
                  />
                </div>
              ) : (
                <div className="mt-3">
                  <span className="mb-2 block text-xs font-bold text-ink/50">
                    אילו מיקומים ייחשפו יחד?
                  </span>
                  {revealPositions.length > 0 ? (
                    <LetterPositionPicker
                      answer={correctAnswerText}
                      selected={parseRevealPositions(hint.hintText)}
                      unavailable={hints
                        .filter(
                          (other) =>
                            other.key !== hint.key &&
                            other.hintType === 'letter_reveal',
                        )
                        .flatMap((other) =>
                          parseRevealPositions(other.hintText),
                        )}
                      label={`בחירת מיקומי אותיות לרמז ${index + 1}`}
                      onChange={(positions) =>
                        updateHint(hint.key, {
                          hintText: serializeRevealPositions(positions),
                        })
                      }
                    />
                  ) : (
                    <p className="rounded-xl bg-canvas px-3 py-2.5 text-xs font-semibold text-ink/50">
                      הזינו תחילה את התשובה הנכונה כדי לבחור אות.
                    </p>
                  )}
                  <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-violet">
                    <Eye size={15} /> כל רמז חושף את כל התיבות שסומנו יחד. לחיצה
                    נוספת על אות מבטלת את הסימון.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
        {errors.hints ? (
          <p className="mt-2 text-sm font-bold text-red-700">{errors.hints}</p>
        ) : null}
        <button
          type="button"
          onClick={() =>
            onHintsChange([...hints, createHintDraft('letter_reveal')])
          }
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-violet/25 px-4 py-2.5 text-sm font-bold text-violet hover:bg-violet/5"
        >
          <Plus size={17} /> הוספת רמז
        </button>
      </div>
    </div>
  );
}
