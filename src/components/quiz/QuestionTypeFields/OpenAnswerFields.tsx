import { Eye } from 'lucide-react';

import type { FieldErrors } from './types';

interface OpenAnswerFieldsProps {
  value: string;
  errors: FieldErrors;
  onChange: (value: string) => void;
}

export function OpenAnswerFields({
  value,
  errors,
  onChange,
}: OpenAnswerFieldsProps) {
  return (
    <div>
      <label
        htmlFor="correct-answer"
        className="mb-2 block text-sm font-bold text-ink/65"
      >
        התשובה הנכונה
      </label>
      <input
        id="correct-answer"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(errors.correctAnswerText)}
        className={`w-full rounded-2xl border bg-white px-4 py-3.5 font-semibold outline-none focus:ring-4 ${errors.correctAnswerText ? 'border-coral focus:ring-coral/10' : 'border-ink/10 focus:border-teal focus:ring-teal/10'}`}
        placeholder="התשובה שתופיע למנחה"
      />
      {errors.correctAnswerText ? (
        <p className="mt-2 text-sm font-bold text-red-700">
          {errors.correctAnswerText}
        </p>
      ) : null}
      <p className="mt-3 flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-sm text-sky-900">
        <Eye size={17} /> התשובה מוצגת לקונטרולר בלבד; המנחה שופט את התשובה
        בעל־פה.
      </p>
    </div>
  );
}
