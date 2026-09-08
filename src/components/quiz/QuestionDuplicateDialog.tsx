import { useEffect, useRef } from 'react';
import { Copy, LoaderCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

import type { Contestant, QuestionSummary } from '../../types';

interface QuestionDuplicateDialogProps {
  question: QuestionSummary;
  contestants: Contestant[];
  targetContestantId: number;
  isWorking: boolean;
  onTargetChange: (contestantId: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function QuestionDuplicateDialog({
  question,
  contestants,
  targetContestantId,
  isWorking,
  onTargetChange,
  onCancel,
  onConfirm,
}: QuestionDuplicateDialogProps) {
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    selectRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isWorking) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isWorking, onCancel]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="w-full max-w-md rounded-[26px] bg-white p-7 shadow-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-question-title"
        aria-describedby="duplicate-question-description"
      >
        <div className="mb-5 flex items-start justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet/10 text-violet">
            <Copy aria-hidden="true" />
          </span>
          <button
            type="button"
            onClick={onCancel}
            disabled={isWorking}
            className="rounded-full p-2 text-ink/45 hover:bg-canvas hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
            aria-label="ביטול"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <h2
          id="duplicate-question-title"
          className="font-display text-2xl font-black"
        >
          שכפול שאלה
        </h2>
        <p
          id="duplicate-question-description"
          className="mt-2 line-clamp-2 leading-7 text-ink/60"
        >
          לאיזה מתמודד להעתיק את „{question.question_text}”?
        </p>
        <label
          htmlFor="duplicate-question-contestant"
          className="mt-5 block text-sm font-bold text-ink/65"
        >
          מתמודד יעד
        </label>
        <select
          ref={selectRef}
          id="duplicate-question-contestant"
          value={targetContestantId}
          onChange={(event) => onTargetChange(Number(event.target.value))}
          disabled={isWorking}
          className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3.5 font-bold text-ink outline-none focus:border-violet focus:ring-4 focus:ring-violet/10 disabled:opacity-60"
        >
          {contestants.map((contestant) => (
            <option key={contestant.id} value={contestant.id}>
              {contestant.name}
              {contestant.id === question.contestant_id
                ? ' (המתמודד הנוכחי)'
                : ''}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs leading-5 text-ink/45">
          העותק יתווסף בסוף רשימת השאלות של המתמודד שנבחר.
        </p>
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isWorking}
            className="rounded-xl px-5 py-3 font-bold text-ink/65 hover:bg-canvas hover:text-ink"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isWorking || !targetContestantId}
            className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-violet px-5 py-3 font-bold text-white hover:brightness-95 disabled:opacity-60"
          >
            {isWorking ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <Copy size={18} />
            )}
            {isWorking ? 'משכפלים…' : 'יצירת עותק'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
