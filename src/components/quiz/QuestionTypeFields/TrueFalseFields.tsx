import { CheckCircle2, XCircle } from 'lucide-react';

interface TrueFalseFieldsProps {
  correctValue: 'true' | 'false';
  onChange: (value: 'true' | 'false') => void;
}

export function TrueFalseFields({
  correctValue,
  onChange,
}: TrueFalseFieldsProps) {
  return (
    <fieldset>
      <legend className="font-display text-base font-black">
        מהי התשובה הנכונה?
      </legend>
      <p className="mt-1 text-xs text-ink/45">
        האפשרויות „נכון” ו„לא נכון” קבועות ולא ניתנות לעריכה
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label
          className={`flex cursor-pointer items-center gap-4 rounded-[20px] border-2 p-4 transition ${correctValue === 'true' ? 'border-teal bg-teal/5 text-teal' : 'border-ink/10 bg-white text-ink/55 hover:border-teal/25'}`}
        >
          <input
            type="radio"
            name="true-false"
            value="true"
            checked={correctValue === 'true'}
            onChange={() => onChange('true')}
            className="sr-only"
          />
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-current/10">
            <CheckCircle2 size={25} />
          </span>
          <span className="font-display text-lg font-black">נכון</span>
        </label>
        <label
          className={`flex cursor-pointer items-center gap-4 rounded-[20px] border-2 p-4 transition ${correctValue === 'false' ? 'border-coral bg-coral/5 text-coral' : 'border-ink/10 bg-white text-ink/55 hover:border-coral/25'}`}
        >
          <input
            type="radio"
            name="true-false"
            value="false"
            checked={correctValue === 'false'}
            onChange={() => onChange('false')}
            className="sr-only"
          />
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-current/10">
            <XCircle size={25} />
          </span>
          <span className="font-display text-lg font-black">לא נכון</span>
        </label>
      </div>
    </fieldset>
  );
}
