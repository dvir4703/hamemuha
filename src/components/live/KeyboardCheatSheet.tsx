import { useEffect, useRef } from 'react';
import { HelpCircle, Printer, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import type { QuestionType } from '../../types';

interface KeyboardCheatSheetProps {
  open: boolean;
  questionType?: QuestionType;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutRow {
  keys: string[];
  action: string;
  context: string;
  types?: QuestionType[];
}

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: 'אמריקאית',
  true_false: 'נכון / לא נכון',
  complete_sentence: 'השלם משפט',
  open_answer: 'תשובה פתוחה',
  multiple_options: 'אופציות מרובה',
  association_hints: 'אסוציאציה ורמזים',
};

const shortcuts: ShortcutRow[] = [
  { keys: ['1–9'], action: 'קפיצה למתמודד', context: 'במהלך המשחק' },
  { keys: ['→'], action: 'השאלה הבאה', context: 'גם בזמן משוב' },
  { keys: ['←'], action: 'השאלה הקודמת', context: 'במהלך המשחק' },
  { keys: ['Space'], action: 'השהיה / המשך', context: 'במהלך המשחק' },
  {
    keys: ['H', 'י'],
    action: 'חשיפת רמז נוסף',
    context: 'סוגים 3 ו־6',
    types: ['complete_sentence', 'association_hints'],
  },
  {
    keys: ['כ', 'F', 'V'],
    action: 'סימון תשובה נכונה',
    context: 'תשובה פתוחה',
    types: ['open_answer'],
  },
  {
    keys: ['ל', 'K', 'L'],
    action: 'סימון תשובה שגויה',
    context: 'תשובה פתוחה',
    types: ['open_answer'],
  },
  { keys: ['Esc'], action: 'בקשת יציאה / סגירת חלון', context: 'בכל מסך' },
  { keys: ['Enter'], action: 'התחלת החידון', context: 'מסך הפתיחה' },
];

export function KeyboardCheatSheet({
  open,
  questionType,
  onOpenChange,
}: KeyboardCheatSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onOpenChange(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange, open]);

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="keyboard-help-trigger fixed bottom-5 left-5 z-40 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-ink/75 text-white/65 shadow-menu backdrop-blur transition hover:scale-105 hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/25"
        aria-label="פתיחת מדריך קיצורי המקלדת"
      >
        <HelpCircle size={23} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="keyboard-cheat-sheet-overlay fixed inset-0 z-50 grid place-items-center bg-ink/65 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="keyboard-cheat-sheet-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) onOpenChange(false);
            }}
          >
            <motion.section
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="keyboard-cheat-sheet-print-root max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white p-6 text-ink shadow-dialog sm:p-8"
            >
              <header className="flex items-start justify-between gap-4 border-b border-ink/10 pb-5">
                <div>
                  <p className="text-sm font-black text-teal">דף עזר למנחה</p>
                  <h2
                    id="keyboard-cheat-sheet-title"
                    className="mt-1 font-display text-3xl font-black"
                  >
                    קיצורי מקלדת בלייב
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-ink/50">
                    {questionType
                      ? `השאלה הנוכחית: ${questionTypeLabels[questionType]}`
                      : 'כל הקיצורים החשובים להפעלת החידון'}
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="keyboard-cheat-sheet-actions rounded-xl p-2 text-ink/45 hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/20"
                  aria-label="סגירת מדריך המקשים"
                >
                  <X size={22} />
                </button>
              </header>

              <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10">
                <table className="w-full border-collapse text-right">
                  <thead className="bg-hero text-white">
                    <tr>
                      <th className="px-4 py-3 font-display text-sm">מקשים</th>
                      <th className="px-4 py-3 font-display text-sm">פעולה</th>
                      <th className="px-4 py-3 font-display text-sm">מתי</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortcuts.map((shortcut) => {
                      const relevant =
                        !shortcut.types ||
                        !questionType ||
                        shortcut.types.includes(questionType);
                      return (
                        <tr
                          key={`${shortcut.keys.join('-')}-${shortcut.action}`}
                          className={`border-t border-ink/[0.07] ${relevant ? 'bg-white' : 'bg-canvas/55 text-ink/40'}`}
                        >
                          <td className="px-4 py-3">
                            <span className="flex flex-wrap gap-1.5" dir="ltr">
                              {shortcut.keys.map((key) => (
                                <kbd
                                  key={key}
                                  className="min-w-9 rounded-lg border border-ink/15 bg-canvas px-2.5 py-1.5 text-center font-mono text-sm font-bold text-ink shadow-sm"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold">
                            {shortcut.action}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">
                            {shortcut.context}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <footer className="keyboard-cheat-sheet-actions mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink/45">
                  טיפ: הדפיסו את הדף והניחו אותו ליד המקלדת באירוע.
                </p>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-3 font-bold text-white shadow-button hover:bg-teal-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/20"
                >
                  <Printer size={19} /> הדפסה / שמירה כ־PDF
                </button>
              </footer>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
