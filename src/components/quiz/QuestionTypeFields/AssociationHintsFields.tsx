import { AnswerOptionsEditor } from './AnswerOptionsEditor';
import type { AnswerDraft, FieldErrors } from './types';

interface AssociationHintsFieldsProps {
  answers: AnswerDraft[];
  errors: FieldErrors;
  onAnswersChange: (answers: AnswerDraft[]) => void;
}

export function AssociationHintsFields({
  answers,
  errors,
  onAnswersChange,
}: AssociationHintsFieldsProps) {
  return (
    <div className="space-y-7">
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
