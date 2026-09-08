interface LetterPositionPickerProps {
  answer: string;
  selected: number[];
  unavailable?: number[];
  label: string;
  onChange: (positions: number[]) => void;
}

export function LetterPositionPicker({
  answer,
  selected,
  unavailable = [],
  label,
  onChange,
}: LetterPositionPickerProps) {
  return (
    <div
      className="flex flex-wrap items-end gap-1.5"
      dir="rtl"
      role="group"
      aria-label={label}
    >
      {Array.from(answer.trim()).map((character, position) => {
        if (/\s/u.test(character))
          return <span key={position} className="w-3" aria-hidden="true" />;
        const isSelected = selected.includes(position);
        const disabled = unavailable.includes(position) && !isSelected;
        return (
          <button
            key={position}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            aria-label={`${character}, מיקום ${position + 1}`}
            onClick={() =>
              onChange(
                isSelected
                  ? selected.filter((index) => index !== position)
                  : [...selected, position].sort((a, b) => a - b),
              )
            }
            className={`grid min-h-12 min-w-11 place-items-center rounded-xl border px-2 py-1 font-display transition ${isSelected ? 'border-violet bg-violet text-white shadow-sm' : disabled ? 'cursor-not-allowed border-ink/10 bg-canvas text-ink/25' : 'border-violet/20 bg-white text-violet hover:border-violet/55 hover:bg-violet/5'}`}
          >
            <span className="text-lg font-black leading-none">{character}</span>
            <span className="text-[10px] font-bold leading-none opacity-60">
              {position + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}
