import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import {
  Clock3,
  Copy,
  GripVertical,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react';

import type { QuestionSummary } from '../../types';
import { QUESTION_TYPE_META } from './questionTypes';

interface SortableQuestionItemProps {
  question: QuestionSummary;
  dragDisabled: boolean;
  isDuplicating: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function SortableQuestionItem({
  question,
  dragDisabled,
  isDuplicating,
  onEdit,
  onDuplicate,
  onDelete,
}: SortableQuestionItemProps) {
  const meta = QUESTION_TYPE_META[question.question_type];
  const Icon = meta.icon;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id, disabled: dragDisabled });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-4 rounded-[22px] border bg-white px-4 py-4 shadow-sm transition-shadow ${
        isDragging
          ? 'z-20 border-teal/30 shadow-card-hover'
          : 'border-ink/[0.07] hover:shadow-card'
      }`}
    >
      <button
        type="button"
        className={`touch-none rounded-xl p-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal ${
          dragDisabled
            ? 'cursor-not-allowed text-ink/15'
            : 'cursor-grab text-ink/30 hover:bg-canvas hover:text-ink/65 active:cursor-grabbing'
        }`}
        aria-label={`שינוי סדר: ${question.question_text}`}
        title={
          dragDisabled
            ? 'אפשר לגרור כשמוצגים כל סוגי השאלות'
            : 'גרירה לשינוי סדר'
        }
        disabled={dragDisabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={21} aria-hidden="true" />
      </button>

      <span
        className={`grid h-12 w-12 place-items-center rounded-2xl ${meta.surfaceClass} ${meta.accentClass}`}
      >
        <Icon size={23} strokeWidth={2.1} aria-hidden="true" />
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-extrabold ${meta.accentClass}`}>
            {meta.shortLabel}
          </span>
          <span className="text-xs text-ink/25">•</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-ink/45">
            <Sparkles size={13} aria-hidden="true" />
            {question.points} נק׳
          </span>
          {question.time_limit ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-ink/45">
              <Clock3 size={13} aria-hidden="true" />
              {question.time_limit} שנ׳
            </span>
          ) : (
            <span className="text-xs font-bold text-ink/35">ללא הגבלת זמן</span>
          )}
        </div>
        <h3 className="mt-1 truncate font-display text-base font-bold text-ink">
          {question.question_text}
        </h3>
        <p className="mt-1 text-xs text-ink/40">
          {question.answerCount > 0
            ? `${question.answerCount} תשובות`
            : 'ללא תשובות'}
          {question.hintCount > 0 ? ` · ${question.hintCount} רמזים` : ''}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl p-2.5 text-ink/45 hover:bg-teal/10 hover:text-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
          aria-label={`עריכת ${question.question_text}`}
          title="עריכה"
        >
          <Pencil size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          disabled={isDuplicating}
          className="rounded-xl p-2.5 text-ink/45 hover:bg-violet/10 hover:text-violet focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet disabled:opacity-40"
          aria-label={`שכפול ${question.question_text}`}
          title="שכפול"
        >
          <Copy size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl p-2.5 text-ink/40 hover:bg-coral/10 hover:text-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"
          aria-label={`מחיקת ${question.question_text}`}
          title="מחיקה"
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
