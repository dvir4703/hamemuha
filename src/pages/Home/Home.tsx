import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  FileQuestion,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { QuizCard } from '../../components/quiz/QuizCard';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CreateQuizModal } from '../../components/ui/CreateQuizModal';
import { Toast } from '../../components/ui/Toast';
import { useQuizStore } from '../../store/quizStore';
import type { QuizMutationInput, QuizSummary } from '../../types';

const answerChips = [
  { label: 'א', className: 'bg-teal text-white' },
  { label: 'ב', className: 'bg-amber text-ink' },
  { label: 'ג', className: 'bg-coral text-white' },
  { label: 'ד', className: 'bg-violet text-white' },
] as const;

function QuizGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
      aria-label="טוען חידונים"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-[238px] animate-pulse rounded-[24px] bg-white shadow-card ring-1 ring-ink/[0.04]"
        >
          <div className="h-1.5 rounded-t-[24px] bg-ink/10" />
          <div className="space-y-5 p-5 pt-7">
            <div className="flex gap-4">
              <div className="h-16 w-16 rounded-[20px] bg-canvas-dark" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-5 w-3/4 rounded-full bg-canvas-dark" />
                <div className="h-3 w-1/3 rounded-full bg-canvas-dark" />
              </div>
            </div>
            <div className="h-14 rounded-2xl bg-canvas-dark" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const quizzes = useQuizStore((state) => state.quizzes);
  const isLoading = useQuizStore((state) => state.isLoading);
  const searchTerm = useQuizStore((state) => state.searchTerm);
  const error = useQuizStore((state) => state.error);
  const setSearchTerm = useQuizStore((state) => state.setSearchTerm);
  const clearError = useQuizStore((state) => state.clearError);
  const refresh = useQuizStore((state) => state.refresh);
  const createQuiz = useQuizStore((state) => state.createQuiz);
  const deleteQuiz = useQuizStore((state) => state.deleteQuiz);
  const duplicateQuiz = useQuizStore((state) => state.duplicateQuiz);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<QuizSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const debounce = window.setTimeout(
      () => void refresh(searchTerm),
      searchTerm ? 280 : 0,
    );

    return () => window.clearTimeout(debounce);
  }, [refresh, searchTerm]);

  const closeToast = useCallback(() => setToastMessage(null), []);

  const handleCreate = async (data: QuizMutationInput) => {
    setSearchTerm('');
    await createQuiz(data);
    setIsCreateOpen(false);
    setToastMessage('החידון נוצר ונוסף לרשימה');
  };

  const handleDuplicate = async (quiz: QuizSummary) => {
    await duplicateQuiz(quiz.id);
    setToastMessage(`„${quiz.name}” שוכפל בהצלחה`);
  };

  const handleDelete = async () => {
    if (!quizToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const deleted = await deleteQuiz(quizToDelete.id);

      if (deleted) {
        setToastMessage(`„${quizToDelete.name}” נמחק`);
      }

      setQuizToDelete(null);
    } catch {
      // The store exposes the user-facing error banner.
    } finally {
      setIsDeleting(false);
    }
  };

  const hasSearch = Boolean(searchTerm.trim());
  const showEmptyState = !isLoading && quizzes.length === 0 && !error;

  return (
    <div className="app-shell min-h-screen bg-canvas text-ink">
      <header className="border-b border-white/10 bg-ink text-white">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber font-display text-2xl font-black text-ink shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)]">
              ?
            </span>
            <div>
              <p className="font-display text-lg font-bold">החידון והחוויה</p>
              <p className="text-xs font-semibold tracking-wide text-white/55">
                מערכת ניהול חידונים
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex" aria-hidden="true">
            {answerChips.map((chip) => (
              <span
                key={chip.label}
                className={`grid h-8 w-8 place-items-center rounded-xl font-display text-sm font-black ${chip.className}`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-6 pb-14 pt-9 lg:px-10 lg:pt-12">
        <section className="relative mb-9 overflow-hidden rounded-[30px] bg-hero px-7 py-8 text-white shadow-hero lg:px-10 lg:py-10">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-mint ring-1 ring-white/10">
              <Sparkles size={16} aria-hidden="true" />
              ספריית החידונים
            </div>
            <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl">
              כל החידונים, מוכנים לרגע האמת
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              מכאן יוצרים, מעדכנים ומארגנים את החידונים לפני שעולים מול הקהל.
            </p>
          </div>
          <div
            className="absolute -bottom-10 left-8 hidden rotate-[-7deg] gap-3 opacity-80 lg:flex"
            aria-hidden="true"
          >
            {answerChips.map((chip, index) => (
              <span
                key={chip.label}
                className={`grid h-20 w-20 place-items-center rounded-[24px] font-display text-3xl font-black shadow-lg ${chip.className}`}
                style={{ transform: `translateY(${index % 2 ? 12 : 0}px)` }}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </section>

        <section aria-labelledby="quiz-list-heading" aria-busy={isLoading}>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="quiz-list-heading"
                className="font-display text-2xl font-black text-ink"
              >
                החידונים שלי
              </h2>
              <p className="mt-1 text-sm text-ink/55">
                {isLoading
                  ? 'מעדכנים את הרשימה…'
                  : quizzes.length === 1
                    ? 'חידון אחד מוצג'
                    : `${quizzes.length} חידונים מוצגים`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal px-5 py-3.5 font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-teal-dark hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              <Plus size={21} aria-hidden="true" />
              חידון חדש
            </button>
          </div>

          <div className="relative mb-7 max-w-xl">
            <Search
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/40"
              size={20}
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl border border-ink/10 bg-white py-3.5 pl-12 pr-12 text-base text-ink shadow-sm outline-none transition placeholder:text-ink/35 focus:border-teal focus:ring-4 focus:ring-teal/10"
              placeholder="חיפוש חידון לפי שם…"
              aria-label="חיפוש חידון לפי שם"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink/40 transition hover:bg-canvas hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
                aria-label="ניקוי החיפוש"
              >
                <X size={17} aria-hidden="true" />
              </button>
            ) : null}
          </div>

          {error ? (
            <div
              className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-coral/20 bg-red-50 px-4 py-3.5 text-red-900"
              role="alert"
            >
              <span className="inline-flex items-center gap-3 font-semibold">
                <AlertCircle size={20} aria-hidden="true" />
                {error}
              </span>
              <button
                type="button"
                onClick={clearError}
                className="rounded-lg px-3 py-1.5 text-sm font-bold hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-700"
              >
                סגירה
              </button>
            </div>
          ) : null}

          {isLoading && quizzes.length === 0 ? <QuizGridSkeleton /> : null}

          {showEmptyState ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid min-h-80 place-items-center rounded-[28px] border border-dashed border-ink/15 bg-white/60 px-6 py-12 text-center"
            >
              <div className="max-w-md">
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-amber/20 text-amber-dark">
                  <FileQuestion
                    size={38}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                </span>
                <h3 className="mt-6 font-display text-2xl font-black text-ink">
                  {hasSearch
                    ? 'לא מצאנו חידון בשם הזה'
                    : 'החידון הראשון מתחיל כאן'}
                </h3>
                <p className="mt-2 leading-7 text-ink/55">
                  {hasSearch
                    ? 'אפשר לנסות שם אחר או לנקות את שדה החיפוש.'
                    : 'נותנים לו שם, מוסיפים לוגו אם רוצים — ומתחילים לבנות את החוויה.'}
                </p>
                {hasSearch ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="mt-6 rounded-xl bg-white px-5 py-3 font-bold text-teal shadow-sm ring-1 ring-teal/20 transition hover:bg-teal/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                  >
                    ניקוי החיפוש
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-3 font-bold text-white shadow-button transition hover:bg-teal-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                  >
                    <Plus size={19} aria-hidden="true" />
                    יצירת חידון ראשון
                  </button>
                )}
              </div>
            </motion.div>
          ) : null}

          {!isLoading && quizzes.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
              <AnimatePresence>
                {quizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    onDelete={setQuizToDelete}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </section>
      </main>

      {isCreateOpen ? (
        <CreateQuizModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreate}
        />
      ) : null}
      {quizToDelete ? (
        <ConfirmDialog
          quizName={quizToDelete.name}
          isDeleting={isDeleting}
          onCancel={() => setQuizToDelete(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
      <AnimatePresence>
        {toastMessage ? (
          <Toast key="toast" message={toastMessage} onClose={closeToast} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
