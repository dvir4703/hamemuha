import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  AlertCircle,
  ArrowRight,
  Check,
  FileQuestion,
  LoaderCircle,
  Pencil,
  Play,
  Plus,
  Save,
  Trash2,
  UserRoundPlus,
  UsersRound,
  X,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

import {
  QUESTION_TYPE_META,
  QUESTION_TYPE_ORDER,
} from '../../components/quiz/questionTypes';
import { SortableQuestionItem } from '../../components/quiz/SortableQuestionItem';
import { ActionConfirmDialog } from '../../components/ui/ActionConfirmDialog';
import { Toast } from '../../components/ui/Toast';
import type {
  Contestant,
  QuestionSummary,
  QuestionType,
  Quiz,
} from '../../types';

type DeleteTarget =
  | { kind: 'question'; question: QuestionSummary }
  | { kind: 'contestant'; contestant: Contestant };

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'משהו השתבש. נסו שוב.';
}

export default function QuizEditor() {
  const navigate = useNavigate();
  const { quizId: quizIdParam } = useParams();
  const quizId = Number(quizIdParam);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [selectedContestantId, setSelectedContestantId] = useState<
    number | null
  >(null);
  const [filter, setFilter] = useState<QuestionType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isAddingContestant, setIsAddingContestant] = useState(false);
  const [newContestantName, setNewContestantName] = useState('');
  const [editingContestantId, setEditingContestantId] = useState<number | null>(
    null,
  );
  const [contestantNameDraft, setContestantNameDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const loadEditor = useCallback(async () => {
    if (!Number.isInteger(quizId) || quizId <= 0) {
      setError('מזהה החידון אינו תקין.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [loadedQuiz, loadedContestants, loadedQuestions] =
        await Promise.all([
          window.api.quiz.getById(quizId),
          window.api.contestant.getByQuizId(quizId),
          window.api.question.getByQuizId(quizId),
        ]);
      if (!loadedQuiz) throw new Error('החידון לא נמצא.');
      setQuiz(loadedQuiz);
      setTitleDraft(loadedQuiz.name);
      setContestants(loadedContestants);
      setQuestions(loadedQuestions);
      setSelectedContestantId((current) =>
        current && loadedContestants.some((item) => item.id === current)
          ? current
          : (loadedContestants[0]?.id ?? null),
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadEditor(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadEditor]);

  const selectedContestant = contestants.find(
    (contestant) => contestant.id === selectedContestantId,
  );
  const selectedQuestions = useMemo(
    () =>
      questions
        .filter((question) => question.contestant_id === selectedContestantId)
        .sort((a, b) => a.display_order - b.display_order || a.id - b.id),
    [questions, selectedContestantId],
  );
  const visibleQuestions = useMemo(
    () =>
      filter === 'all'
        ? selectedQuestions
        : selectedQuestions.filter(
            (question) => question.question_type === filter,
          ),
    [filter, selectedQuestions],
  );
  const questionCountByContestant = useMemo(() => {
    const counts = new Map<number, number>();
    questions.forEach((question) => {
      counts.set(
        question.contestant_id,
        (counts.get(question.contestant_id) ?? 0) + 1,
      );
    });
    return counts;
  }, [questions]);

  const saveTitle = async () => {
    const name = titleDraft.trim();
    if (!quiz || !name) return;
    setIsSavingTitle(true);
    try {
      const updated = await window.api.quiz.update(quiz.id, {
        name,
        logoPath: quiz.logo_path,
      });
      if (updated) {
        setQuiz(updated);
        setTitleDraft(updated.name);
        setIsEditingTitle(false);
        setToast('שם החידון עודכן');
      }
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSavingTitle(false);
    }
  };

  const addContestant = async () => {
    const name = newContestantName.trim();
    if (!name) return;
    try {
      const created = await window.api.contestant.create({
        quizId,
        name,
        displayOrder:
          Math.max(
            0,
            ...contestants.map((contestant) => contestant.display_order),
          ) + 1,
      });
      setContestants((current) => [...current, created]);
      setSelectedContestantId(created.id);
      setNewContestantName('');
      setIsAddingContestant(false);
      setToast('המתמודד נוסף');
    } catch (createError) {
      setError(getErrorMessage(createError));
    }
  };

  const saveContestant = async (contestant: Contestant) => {
    const name = contestantNameDraft.trim();
    if (!name) return;
    try {
      const updated = await window.api.contestant.update(contestant.id, {
        name,
        displayOrder: contestant.display_order,
      });
      if (updated) {
        setContestants((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        setEditingContestantId(null);
        setToast('שם המתמודד עודכן');
      }
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.kind === 'question') {
        await window.api.question.delete(deleteTarget.question.id);
        setQuestions((current) =>
          current.filter(
            (question) => question.id !== deleteTarget.question.id,
          ),
        );
        setToast('השאלה נמחקה');
      } else {
        await window.api.contestant.delete(deleteTarget.contestant.id);
        const remaining = contestants.filter(
          (contestant) => contestant.id !== deleteTarget.contestant.id,
        );
        setContestants(remaining);
        setQuestions((current) =>
          current.filter(
            (question) => question.contestant_id !== deleteTarget.contestant.id,
          ),
        );
        setSelectedContestantId(remaining[0]?.id ?? null);
        setToast('המתמודד והשאלות שלו נמחקו');
      }
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
    }
  };

  const duplicateQuestion = async (question: QuestionSummary) => {
    setDuplicatingId(question.id);
    try {
      await window.api.question.duplicate(question.id);
      const refreshed = await window.api.question.getByQuizId(quizId);
      setQuestions(refreshed);
      setToast('נוצר עותק חדש של השאלה');
    } catch (duplicateError) {
      setError(getErrorMessage(duplicateError));
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (
      !over ||
      active.id === over.id ||
      !selectedContestantId ||
      filter !== 'all'
    ) {
      return;
    }
    const oldIndex = selectedQuestions.findIndex(
      (question) => question.id === active.id,
    );
    const newIndex = selectedQuestions.findIndex(
      (question) => question.id === over.id,
    );
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(selectedQuestions, oldIndex, newIndex).map(
      (question, index) => ({ ...question, display_order: index + 1 }),
    );
    const previous = questions;
    setQuestions((current) => [
      ...current.filter(
        (question) => question.contestant_id !== selectedContestantId,
      ),
      ...reordered,
    ]);
    setIsReordering(true);
    try {
      await window.api.question.reorder(
        selectedContestantId,
        reordered.map((question) => question.id),
      );
      setToast('סדר השאלות נשמר');
    } catch (reorderError) {
      setQuestions(previous);
      setError(getErrorMessage(reorderError));
    } finally {
      setIsReordering(false);
    }
  };

  const openNewQuestion = () => {
    if (selectedContestantId) {
      navigate(
        `/quizzes/${quizId}/questions/new?contestantId=${selectedContestantId}`,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas text-ink">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-teal" size={34} />
          <p className="mt-3 font-bold text-ink/55">טוענים את החידון…</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-6 text-center">
        <div>
          <AlertCircle className="mx-auto text-coral" size={40} />
          <h1 className="mt-4 font-display text-2xl font-black">
            לא הצלחנו לפתוח את החידון
          </h1>
          <p className="mt-2 text-ink/55">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 rounded-xl bg-teal px-5 py-3 font-bold text-white"
          >
            חזרה לרשימה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center gap-4 px-6 py-4 lg:px-10">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-ink/55 hover:bg-canvas hover:text-ink"
          >
            <ArrowRight size={19} aria-hidden="true" />
            חזרה
          </button>
          <span className="h-7 w-px bg-ink/10" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <div className="flex max-w-xl items-center gap-2">
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void saveTitle();
                    if (event.key === 'Escape') {
                      setTitleDraft(quiz.name);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="min-w-0 flex-1 rounded-xl border border-teal bg-white px-3 py-2 font-display text-xl font-black outline-none ring-4 ring-teal/10"
                  aria-label="שם החידון"
                />
                <button
                  onClick={() => void saveTitle()}
                  disabled={isSavingTitle || !titleDraft.trim()}
                  className="rounded-xl bg-teal p-2.5 text-white disabled:opacity-40"
                  aria-label="שמירת שם"
                >
                  {isSavingTitle ? (
                    <LoaderCircle className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                </button>
                <button
                  onClick={() => {
                    setTitleDraft(quiz.name);
                    setIsEditingTitle(false);
                  }}
                  className="rounded-xl p-2.5 text-ink/45 hover:bg-canvas"
                  aria-label="ביטול עריכה"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="group flex max-w-full items-center gap-2 text-right"
              >
                <h1 className="truncate font-display text-xl font-black sm:text-2xl">
                  {quiz.name}
                </h1>
                <Pencil
                  className="shrink-0 text-ink/25 group-hover:text-teal"
                  size={16}
                  aria-hidden="true"
                />
              </button>
            )}
            <p className="mt-0.5 text-xs font-bold text-ink/40">
              ניהול שאלות ומתמודדים
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/quiz/${quizId}/live`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber px-4 py-3 font-bold text-ink shadow-sm hover:bg-yellow-400"
            >
              <Play size={19} fill="currentColor" aria-hidden="true" />
              הפעל
            </button>
            {selectedContestant ? (
              <button
                type="button"
                onClick={openNewQuestion}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal px-5 py-3 font-bold text-white shadow-button hover:bg-teal-dark"
              >
                <Plus size={20} aria-hidden="true" />
                שאלה חדשה
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-6 pb-14 pt-8 lg:px-10">
        {error ? (
          <div
            className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-coral/20 bg-red-50 px-4 py-3 text-red-900"
            role="alert"
          >
            <span className="inline-flex items-center gap-2 font-semibold">
              <AlertCircle size={19} />
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="rounded-lg p-1.5 hover:bg-red-100"
              aria-label="סגירה"
            >
              <X size={18} />
            </button>
          </div>
        ) : null}

        <section
          className="mb-6 overflow-hidden rounded-[26px] border border-ink/[0.06] bg-white shadow-card"
          aria-labelledby="contestants-heading"
        >
          <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet/10 text-violet">
                <UsersRound size={20} />
              </span>
              <div>
                <h2
                  id="contestants-heading"
                  className="font-display text-lg font-black"
                >
                  מתמודדים
                </h2>
                <p className="text-xs text-ink/45">
                  בחרו מתמודד כדי לראות ולסדר את השאלות שלו
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingContestant(true)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-teal hover:bg-teal/10"
            >
              <UserRoundPlus size={18} /> הוספת מתמודד
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto px-5 py-4">
            {contestants.map((contestant) => {
              const count = questionCountByContestant.get(contestant.id) ?? 0;
              const isSelected = contestant.id === selectedContestantId;
              return editingContestantId === contestant.id ? (
                <div
                  key={contestant.id}
                  className="flex shrink-0 items-center gap-1 rounded-2xl border border-teal bg-white p-1 ring-4 ring-teal/10"
                >
                  <input
                    autoFocus
                    value={contestantNameDraft}
                    onChange={(event) =>
                      setContestantNameDraft(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter')
                        void saveContestant(contestant);
                      if (event.key === 'Escape') setEditingContestantId(null);
                    }}
                    className="w-36 bg-transparent px-2 py-1.5 font-bold outline-none"
                    aria-label="שם המתמודד"
                  />
                  <button
                    onClick={() => void saveContestant(contestant)}
                    className="rounded-lg bg-teal p-1.5 text-white"
                    aria-label="שמירה"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingContestantId(null)}
                    className="rounded-lg p-1.5 text-ink/40 hover:bg-canvas"
                    aria-label="ביטול"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  key={contestant.id}
                  type="button"
                  onClick={() => {
                    setSelectedContestantId(contestant.id);
                    setFilter('all');
                  }}
                  className={`shrink-0 rounded-2xl px-4 py-2.5 text-right transition ${isSelected ? 'bg-ink text-white shadow-md' : 'bg-canvas text-ink/65 hover:bg-canvas-dark hover:text-ink'}`}
                >
                  <span className="block font-display font-bold">
                    {contestant.name}
                  </span>
                  <span
                    className={`text-xs ${isSelected ? 'text-white/55' : 'text-ink/40'}`}
                  >
                    {count} שאלות
                  </span>
                </button>
              );
            })}

            {isAddingContestant ? (
              <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-teal bg-white p-1 ring-4 ring-teal/10">
                <input
                  autoFocus
                  value={newContestantName}
                  onChange={(event) => setNewContestantName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void addContestant();
                    if (event.key === 'Escape') setIsAddingContestant(false);
                  }}
                  placeholder="שם המתמודד"
                  className="w-40 bg-transparent px-2 py-1.5 font-bold outline-none placeholder:text-ink/30"
                />
                <button
                  onClick={() => void addContestant()}
                  disabled={!newContestantName.trim()}
                  className="rounded-lg bg-teal p-1.5 text-white disabled:opacity-35"
                  aria-label="הוספה"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => {
                    setIsAddingContestant(false);
                    setNewContestantName('');
                  }}
                  className="rounded-lg p-1.5 text-ink/40 hover:bg-canvas"
                  aria-label="ביטול"
                >
                  <X size={16} />
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {!selectedContestant ? (
          <section className="grid min-h-80 place-items-center rounded-[28px] border border-dashed border-ink/15 bg-white/60 px-6 text-center">
            <div className="max-w-md">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-violet/10 text-violet">
                <UsersRound size={38} />
              </span>
              <h2 className="mt-5 font-display text-2xl font-black">
                מתחילים מהמתמודד הראשון
              </h2>
              <p className="mt-2 leading-7 text-ink/55">
                כל שאלה משויכת למתמודד. הוסיפו שם ואז יהיה אפשר להתחיל לכתוב.
              </p>
              <button
                onClick={() => setIsAddingContestant(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-3 font-bold text-white"
              >
                <Plus size={19} /> הוספת מתמודד
              </button>
            </div>
          </section>
        ) : (
          <section aria-labelledby="questions-heading">
            <div className="mb-5 flex flex-col gap-4 rounded-[24px] bg-hero px-5 py-5 text-white shadow-hero sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2
                    id="questions-heading"
                    className="truncate font-display text-2xl font-black"
                  >
                    השאלות של {selectedContestant.name}
                  </h2>
                  {isReordering ? (
                    <LoaderCircle
                      className="animate-spin text-mint"
                      size={18}
                      aria-label="שומר סדר"
                    />
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-white/60">
                  {selectedQuestions.length} שאלות · הסדר כאן הוא הסדר במשחק
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setContestantNameDraft(selectedContestant.name);
                    setEditingContestantId(selectedContestant.id);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/15"
                >
                  <Pencil size={16} /> שינוי שם
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDeleteTarget({
                      kind: 'contestant',
                      contestant: selectedContestant,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-red-100 hover:bg-coral/50"
                >
                  <Trash2 size={16} /> מחיקה
                </button>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm font-bold text-ink/60">
                סינון לפי סוג
                <select
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value as QuestionType | 'all')
                  }
                  className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-ink outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
                >
                  <option value="all">כל הסוגים</option>
                  {QUESTION_TYPE_ORDER.map((type) => (
                    <option key={type} value={type}>
                      {QUESTION_TYPE_META[type].shortLabel}
                    </option>
                  ))}
                </select>
              </label>
              {filter !== 'all' ? (
                <p className="text-xs font-semibold text-amber-dark">
                  כדי לשנות סדר, הציגו את כל הסוגים
                </p>
              ) : null}
            </div>

            {visibleQuestions.length === 0 ? (
              <div className="grid min-h-72 place-items-center rounded-[26px] border border-dashed border-ink/15 bg-white/65 px-6 text-center">
                <div className="max-w-md">
                  <FileQuestion
                    className="mx-auto text-teal"
                    size={38}
                    strokeWidth={1.7}
                  />
                  <h3 className="mt-4 font-display text-xl font-black">
                    {filter === 'all'
                      ? 'עוד אין כאן שאלות'
                      : 'אין שאלות מהסוג הזה'}
                  </h3>
                  <p className="mt-2 text-ink/50">
                    {filter === 'all'
                      ? 'צרו את השאלה הראשונה ובחרו אחד מששת הסוגים.'
                      : 'אפשר לבחור סינון אחר או ליצור שאלה חדשה.'}
                  </p>
                  <button
                    onClick={openNewQuestion}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-3 font-bold text-white"
                  >
                    <Plus size={19} /> שאלה חדשה
                  </button>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => void handleDragEnd(event)}
              >
                <SortableContext
                  items={visibleQuestions.map((question) => question.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="max-h-[calc(100vh-25rem)] min-h-64 space-y-3 overflow-y-auto overscroll-contain pb-3 pl-1">
                    {visibleQuestions.map((question) => (
                      <SortableQuestionItem
                        key={question.id}
                        question={question}
                        dragDisabled={filter !== 'all' || isReordering}
                        isDuplicating={duplicatingId === question.id}
                        onEdit={() =>
                          navigate(
                            `/quizzes/${quizId}/questions/${question.id}/edit`,
                          )
                        }
                        onDuplicate={() => void duplicateQuestion(question)}
                        onDelete={() =>
                          setDeleteTarget({ kind: 'question', question })
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </section>
        )}
      </main>

      <AnimatePresence>
        {deleteTarget ? (
          <ActionConfirmDialog
            title={
              deleteTarget.kind === 'question'
                ? 'למחוק את השאלה?'
                : 'למחוק את המתמודד?'
            }
            description={
              deleteTarget.kind === 'question'
                ? `השאלה „${deleteTarget.question.question_text}” תימחק לצמיתות, כולל התשובות והרמזים שלה.`
                : `המתמודד „${deleteTarget.contestant.name}” וכל השאלות שלו יימחקו לצמיתות.`
            }
            isWorking={isDeleting}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => void confirmDelete()}
          />
        ) : null}
        {toast ? (
          <Toast key={toast} message={toast} onClose={() => setToast(null)} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
