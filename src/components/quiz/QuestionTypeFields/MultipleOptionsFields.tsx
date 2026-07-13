import { Focus } from 'lucide-react';

import { QuestionImagePicker } from '../QuestionImagePicker';
import { AnswerOptionsEditor } from './AnswerOptionsEditor';
import type { AnswerDraft, FieldErrors } from './types';

interface MultipleOptionsFieldsProps {
  centralText: string;
  imageUrl: string | null;
  isSelectingImage: boolean;
  answers: AnswerDraft[];
  errors: FieldErrors;
  onCentralTextChange: (value: string) => void;
  onSelectImage: () => void;
  onRemoveImage: () => void;
  onAnswersChange: (answers: AnswerDraft[]) => void;
}

export function MultipleOptionsFields({
  centralText,
  imageUrl,
  isSelectingImage,
  answers,
  errors,
  onCentralTextChange,
  onSelectImage,
  onRemoveImage,
  onAnswersChange,
}: MultipleOptionsFieldsProps) {
  return (
    <div className="space-y-7">
      <section className="rounded-[22px] border border-coral/15 bg-coral/[0.035] p-5">
        <div className="mb-4 flex items-center gap-3 text-coral">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm">
            <Focus size={20} />
          </span>
          <div>
            <h3 className="font-display font-black">האלמנט המרכזי</h3>
            <p className="text-xs text-ink/45">
              פתגם, מקום, אדם או כל מוקד אחר שסביבו מוצגות האפשרויות
            </p>
          </div>
        </div>
        <label
          htmlFor="central-element"
          className="mb-2 block text-sm font-bold text-ink/65"
        >
          טקסט האלמנט
        </label>
        <textarea
          id="central-element"
          value={centralText}
          onChange={(event) => onCentralTextChange(event.target.value)}
          rows={3}
          aria-invalid={Boolean(errors.questionText)}
          className={`w-full resize-y rounded-2xl border bg-white px-4 py-3.5 font-semibold outline-none focus:ring-4 ${errors.questionText ? 'border-coral focus:ring-coral/10' : 'border-ink/10 focus:border-coral focus:ring-coral/10'}`}
          placeholder="למשל: מי מהבאים נולד בירושלים?"
        />
        {errors.questionText ? (
          <p className="mt-2 text-sm font-bold text-red-700">
            {errors.questionText}
          </p>
        ) : null}
        <div className="mt-5">
          <QuestionImagePicker
            imageUrl={imageUrl}
            isSelecting={isSelectingImage}
            onSelect={onSelectImage}
            onRemove={onRemoveImage}
            label="תמונת האלמנט המרכזי (אופציונלי)"
          />
        </div>
      </section>

      <div className="rounded-[22px] border border-ink/[0.07] bg-white p-5">
        <AnswerOptionsEditor
          answers={answers}
          onChange={onAnswersChange}
          error={errors.answers}
          title="האופציות שמתחת לאלמנט"
          addLabel="הוספת אופציה"
          accent="coral"
        />
      </div>
    </div>
  );
}
