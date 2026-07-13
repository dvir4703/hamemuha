import { useEffect, useRef, useState } from 'react';
import {
  Copy,
  FileQuestion,
  ListChecks,
  MoreVertical,
  Pencil,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { useImageUrl } from '../../hooks/useImageUrl';
import type { QuizSummary } from '../../types';
import { formatRelativeDate } from '../../utils/date';

interface QuizCardProps {
  quiz: QuizSummary;
  onDelete: (quiz: QuizSummary) => void;
  onDuplicate: (quiz: QuizSummary) => Promise<void>;
}

const accentClasses = ['bg-teal', 'bg-amber', 'bg-coral', 'bg-violet'] as const;

export function QuizCard({ quiz, onDelete, onDuplicate }: QuizCardProps) {
  const navigate = useNavigate();
  const logoUrl = useImageUrl(quiz.logo_path);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const editPath = `/quizzes/${quiz.id}/edit`;
  const questionLabel = quiz.questionCount === 1 ? 'שאלה' : 'שאלות';
  const contestantLabel = quiz.contestantCount === 1 ? 'מתמודד' : 'מתמודדים';

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMenuOpen]);

  const handleDuplicate = async () => {
    setIsMenuOpen(false);
    setIsDuplicating(true);

    try {
      await onDuplicate(quiz);
    } catch {
      // The store exposes the user-facing error banner.
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group relative overflow-visible rounded-[24px] bg-white shadow-card ring-1 ring-ink/[0.06] transition-shadow hover:shadow-card-hover"
    >
      <div
        className={`h-1.5 rounded-t-[24px] ${accentClasses[quiz.id % accentClasses.length]}`}
      />

      <div ref={menuRef} className="absolute left-4 top-5 z-20">
        <button
          type="button"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          disabled={isDuplicating}
          className="rounded-full p-2 text-ink/45 transition hover:bg-canvas hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          aria-label={`פעולות עבור ${quiz.name}`}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
        >
          <MoreVertical aria-hidden="true" size={20} />
        </button>

        {isMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute left-0 top-11 w-44 overflow-hidden rounded-2xl border border-ink/10 bg-white p-1.5 shadow-menu"
            role="menu"
          >
            <button
              type="button"
              onClick={() => navigate(editPath)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas focus:bg-canvas focus:outline-none"
              role="menuitem"
            >
              <Pencil size={17} aria-hidden="true" />
              עריכת החידון
            </button>
            <button
              type="button"
              onClick={() => void handleDuplicate()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas focus:bg-canvas focus:outline-none"
              role="menuitem"
            >
              <Copy size={17} aria-hidden="true" />
              שכפול
            </button>
            <div className="my-1 border-t border-ink/10" />
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onDelete(quiz);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:bg-red-50 focus:outline-none"
              role="menuitem"
            >
              <Trash2 size={17} aria-hidden="true" />
              מחיקה
            </button>
          </motion.div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => navigate(editPath)}
        disabled={isDuplicating}
        className="block w-full rounded-b-[24px] px-5 pb-5 pt-6 text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
        aria-label={`פתיחת החידון ${quiz.name}`}
      >
        <div className="mb-5 flex items-start gap-4 pl-9">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[20px] bg-canvas text-teal ring-1 ring-ink/[0.06]">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`הלוגו של ${quiz.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <FileQuestion size={30} strokeWidth={1.8} aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 pt-1">
            <h2 className="line-clamp-2 font-display text-xl font-bold leading-7 text-ink">
              {quiz.name}
            </h2>
            <p className="mt-1.5 text-sm text-ink/50">
              {formatRelativeDate(quiz.updated_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 rounded-2xl bg-canvas/80 px-4 py-3 text-sm text-ink/65">
          <span className="inline-flex items-center gap-2">
            <ListChecks className="text-teal" size={18} aria-hidden="true" />
            <strong className="font-bold text-ink">
              {quiz.questionCount}
            </strong>{' '}
            {questionLabel}
          </span>
          <span className="h-5 w-px bg-ink/10" aria-hidden="true" />
          <span className="inline-flex items-center gap-2">
            <UsersRound className="text-violet" size={18} aria-hidden="true" />
            <strong className="font-bold text-ink">
              {quiz.contestantCount}
            </strong>{' '}
            {contestantLabel}
          </span>
        </div>
      </button>

      {isDuplicating ? (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-[24px] bg-white/85 backdrop-blur-[2px]">
          <span className="inline-flex items-center gap-2 font-bold text-teal">
            <Copy className="animate-pulse" aria-hidden="true" size={19} />
            משכפלים…
          </span>
        </div>
      ) : null}
    </motion.article>
  );
}
