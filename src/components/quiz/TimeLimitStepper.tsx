import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';

import {
  normalizeTimeLimit,
  TIME_LIMIT_MAX,
  TIME_LIMIT_MIN,
  TIME_LIMIT_STEP,
} from '../../utils/timeLimit';

interface TimeLimitStepperProps {
  value: number;
  error?: string;
  onChange: (value: number) => void;
}

export function TimeLimitStepper({
  value,
  error,
  onChange,
}: TimeLimitStepperProps) {
  const labelId = useId();

  return (
    <div>
      <span id={labelId} className="mb-1.5 block text-xs font-bold text-ink/50">
        מספר שניות
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        aria-invalid={Boolean(error)}
        className={`flex w-full items-stretch overflow-hidden rounded-xl border bg-white shadow-sm ${error ? 'border-coral' : 'border-ink/10'}`}
        dir="ltr"
      >
        <button
          type="button"
          onClick={() => onChange(normalizeTimeLimit(value - TIME_LIMIT_STEP))}
          disabled={value <= TIME_LIMIT_MIN}
          aria-label="הפחתת 10 שניות"
          className="grid w-14 place-items-center border-r border-ink/10 text-violet transition hover:bg-violet/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-violet/15 disabled:cursor-not-allowed disabled:text-ink/20"
        >
          <Minus size={20} strokeWidth={2.5} />
        </button>
        <output
          className="flex min-h-12 flex-1 items-baseline justify-center gap-2 px-3 py-2 text-ink"
          aria-live="polite"
        >
          <strong className="font-display text-2xl font-black tabular-nums">
            {value}
          </strong>
          <span className="text-xs font-bold text-ink/40">שניות</span>
        </output>
        <button
          type="button"
          onClick={() => onChange(normalizeTimeLimit(value + TIME_LIMIT_STEP))}
          disabled={value >= TIME_LIMIT_MAX}
          aria-label="הוספת 10 שניות"
          className="grid w-14 place-items-center border-l border-ink/10 text-teal transition hover:bg-teal/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-teal/15 disabled:cursor-not-allowed disabled:text-ink/20"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>
      <span className="mt-1.5 block text-[11px] font-bold text-ink/35">
        קפיצות של 10 שניות, עד 5 דקות
      </span>
      {error ? (
        <p className="mt-1.5 text-xs font-bold text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
