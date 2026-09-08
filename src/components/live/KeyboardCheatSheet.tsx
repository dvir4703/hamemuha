import { useEffect, useRef } from 'react';
import { Keyboard, Printer, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

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
  {
    keys: ['Enter'],
    action: 'הגשת התשובה שנבחרה',
    context:
      'שאלות עם אפשרויות: אמריקאית, נכון / לא נכון, אופציות מרובה ואסוציאציה — בוחרים בעכבר ואז Enter',
    types: [
      'multiple_choice',
      'true_false',
      'multiple_options',
      'association_hints',
    ],
  },
  {
    keys: ['Enter'],
    action: 'מעבר למסך הבא',
    context: 'ממסך "תשובה נכונה" או "תשובה שגויה"',
  },
  {
    keys: ['Enter'],
    action: 'התחלת המשחק / דילוג על סרטון הפתיחה',
    context: 'ממסך הפתיחה ובמהלך סרטון הפתיחה',
  },
  {
    keys: ['F1'],
    action: 'סימון תשובה כ"נכונה"',
    context: 'רק ב"השלם משפט" וב"תשובה פתוחה"',
    types: ['complete_sentence', 'open_answer'],
  },
  {
    keys: ['F2'],
    action: 'סימון תשובה כ"שגויה"',
    context: 'רק ב"השלם משפט" וב"תשובה פתוחה"',
    types: ['complete_sentence', 'open_answer'],
  },
  {
    keys: ['F4'],
    action:
      'חשיפת רמז ("השלם משפט") / רמז 50-50 שמסתיר חצי מהתשובות השגויות (אמריקאית)',
    context: 'בסוגי השאלות המתאימים',
    types: ['complete_sentence', 'multiple_choice'],
  },
  { keys: ['→'], action: 'מעבר לשאלה הבאה', context: 'במהלך המשחק' },
  { keys: ['←'], action: 'חזרה לשאלה הקודמת', context: 'במהלך המשחק' },
  {
    keys: ['1-9'],
    action: 'קפיצה ישירה למתמודד לפי מספרו',
    context: 'במהלך המשחק',
  },
  { keys: ['Space'], action: 'השהיית המשחק / המשך', context: 'במהלך המשחק' },
  { keys: ['Esc'], action: 'יציאה מהמשחק (עם אישור)', context: 'במהלך המשחק' },
  {
    keys: ['עכבר'],
    action: 'בחירת תשובה מהאפשרויות על המסך',
    context: 'לאחר הבחירה לוחצים Enter להגשה',
    types: [
      'multiple_choice',
      'true_false',
      'multiple_options',
      'association_hints',
    ],
  },
];

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

export function KeyboardCheatSheet({
  open,
  questionType,
  onOpenChange,
}: KeyboardCheatSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      if (event.key === '?') {
        event.preventDefault();
        onOpenChange(!open);
        return;
      }

      if (open && event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="keyboard-cheat-sheet-overlay live-keyboard fixed inset-0 z-[65] grid place-items-center bg-[#02030b]/85 p-4 text-white backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="keyboard-cheat-sheet-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onOpenChange(false);
          }}
        >
          <motion.section
            initial={
              shouldReduceMotion ? false : { opacity: 0, y: 28, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 0.82, 0.24, 1] }}
            className="keyboard-cheat-sheet-print-root live-keyboard__panel max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] p-5 sm:p-8"
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-start gap-4">
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#ffe08a]/25 bg-[#f4b942]/10 text-[#ffe08a]"
                  aria-hidden="true"
                >
                  <Keyboard size={29} />
                </span>
                <div>
                  <p className="live-keyboard__eyebrow">דף עזר למנחה</p>
                  <h2
                    id="keyboard-cheat-sheet-title"
                    className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl"
                  >
                    קיצורי מקלדת בלייב
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-white/48">
                    {questionType
                      ? `השאלה הנוכחית: ${questionTypeLabels[questionType]}`
                      : 'כל הקיצורים החשובים להפעלת החידון'}
                  </p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => onOpenChange(false)}
                className="keyboard-cheat-sheet-actions rounded-xl border border-white/10 p-2 text-white/48 transition hover:border-[#ffe08a]/30 hover:bg-[#f4b942]/10 hover:text-[#ffe08a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f4b942]/20"
                aria-label="סגירת מדריך המקשים"
              >
                <X size={22} />
              </button>
            </header>

            <div className="live-keyboard__table mt-6 overflow-hidden rounded-2xl">
              <table className="w-full border-collapse text-right">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-display text-sm text-[#ffe08a]">
                      מקשים
                    </th>
                    <th className="px-4 py-3 font-display text-sm text-[#ffe08a]">
                      פעולה
                    </th>
                    <th className="px-4 py-3 font-display text-sm text-[#ffe08a]">
                      מתי
                    </th>
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
                        className="live-keyboard__row"
                        data-relevant={relevant}
                      >
                        <td className="px-4 py-3">
                          <span className="flex flex-wrap gap-1.5" dir="ltr">
                            {shortcut.keys.map((key) => (
                              <kbd
                                key={key}
                                className="min-w-9 rounded-lg px-2.5 py-1.5 text-center font-mono text-sm font-bold"
                              >
                                {key}
                              </kbd>
                            ))}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold">
                          {shortcut.action}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-white/52">
                          {shortcut.context}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white/42">
                ב"השלם משפט" המנחה לא מקליד — הוא שופט בעל־פה באמצעות F1/F2,
                והמערכת ממלאת את התשובה הנכונה אוטומטית.
              </p>
              <button
                type="button"
                onClick={() => window.print()}
                className="keyboard-cheat-sheet-actions live-keyboard__action inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold transition hover:bg-[#f4b942]/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f4b942]/20"
              >
                <Printer size={19} /> הדפסה / שמירה כ־PDF
              </button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
