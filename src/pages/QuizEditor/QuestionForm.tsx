import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  Save,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { AssociationHintsFields } from '../../components/quiz/QuestionTypeFields/AssociationHintsFields';
import { CompleteSentenceFields } from '../../components/quiz/QuestionTypeFields/CompleteSentenceFields';
import { MultipleChoiceFields } from '../../components/quiz/QuestionTypeFields/MultipleChoiceFields';
import { MultipleOptionsFields } from '../../components/quiz/QuestionTypeFields/MultipleOptionsFields';
import { OpenAnswerFields } from '../../components/quiz/QuestionTypeFields/OpenAnswerFields';
import { TrueFalseFields } from '../../components/quiz/QuestionTypeFields/TrueFalseFields';
import {
  createAnswerDraft,
  createHintDraft,
  type AnswerDraft,
  type FieldErrors,
  type HintDraft,
} from '../../components/quiz/QuestionTypeFields/types';
import { QuestionImagePicker } from '../../components/quiz/QuestionImagePicker';
import {
  QUESTION_TYPE_META,
  QUESTION_TYPE_ORDER,
} from '../../components/quiz/questionTypes';
import { useImageUrl } from '../../hooks/useImageUrl';
import type {
  Contestant,
  QuestionMutationInput,
  QuestionType,
  QuestionWithRelations,
  Quiz,
} from '../../types';

interface FormErrors extends FieldErrors {
  contestantId?: string;
  points?: string;
  timeLimit?: string;
  form?: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'לא הצלחנו לשמור את השאלה.';
}

function defaultAnswers(): AnswerDraft[] {
  return [createAnswerDraft(), createAnswerDraft()];
}

export default function QuestionForm() {
  const navigate = useNavigate();
  const { quizId: quizIdParam, questionId: questionIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const quizId = Number(quizIdParam);
  const questionId = questionIdParam ? Number(questionIdParam) : null;
  const isEditing = questionId !== null;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [questionType, setQuestionType] =
    useState<QuestionType>('multiple_choice');
  const [contestantId, setContestantId] = useState(0);
  const [questionText, setQuestionText] = useState('');
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [points, setPoints] = useState(10);
  const [isUnlimitedTime, setIsUnlimitedTime] = useState(true);
  const [timeLimit, setTimeLimit] = useState(30);
  const [explanation, setExplanation] = useState('');
  const [correctAnswerText, setCorrectAnswerText] = useState('');
  const [answers, setAnswers] = useState<AnswerDraft[]>(defaultAnswers);
  const [hints, setHints] = useState<HintDraft[]>([]);
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  const [trueFalseCorrect, setTrueFalseCorrect] = useState<'true' | 'false'>(
    'true',
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectingImage, setIsSelectingImage] = useState(false);
  const imageUrl = useImageUrl(imagePath);
  const typeMeta = QUESTION_TYPE_META[questionType];
  const TypeIcon = typeMeta.icon;

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [loadedQuiz, loadedContestants, loadedQuestion] =
          await Promise.all([
            window.api.quiz.getById(quizId),
            window.api.contestant.getByQuizId(quizId),
            questionId
              ? window.api.question.getById(questionId)
              : Promise.resolve(null),
          ]);
        if (!active) return;
        if (!loadedQuiz) throw new Error('החידון לא נמצא.');
        if (loadedQuestion && loadedQuestion.quiz_id !== quizId) {
          throw new Error('השאלה אינה שייכת לחידון הזה.');
        }
        setQuiz(loadedQuiz);
        setContestants(loadedContestants);

        if (loadedQuestion) {
          hydrateQuestion(loadedQuestion);
        } else {
          const requestedContestantId = Number(
            searchParams.get('contestantId'),
          );
          const initialContestant = loadedContestants.some(
            (contestant) => contestant.id === requestedContestantId,
          )
            ? requestedContestantId
            : (loadedContestants[0]?.id ?? 0);
          setContestantId(initialContestant);
        }
      } catch (loadError) {
        if (active) setErrors({ form: getErrorMessage(loadError) });
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const hydrateQuestion = (question: QuestionWithRelations) => {
      setQuestionType(question.question_type);
      setContestantId(question.contestant_id);
      setQuestionText(question.question_text);
      setImagePath(question.image_path);
      setPoints(question.points);
      setIsUnlimitedTime(question.time_limit === null);
      setTimeLimit(question.time_limit ?? 30);
      setExplanation(question.explanation ?? '');
      setCorrectAnswerText(question.correct_answer_text ?? '');
      setShuffleAnswers(question.shuffle_answers);
      setAnswers(
        question.answers.length
          ? question.answers.map((answer) => ({
              key: crypto.randomUUID(),
              answerText: answer.answer_text,
              isCorrect: answer.is_correct,
            }))
          : defaultAnswers(),
      );
      setHints(
        question.hints.map((hint) => ({
          key: crypto.randomUUID(),
          hintType: hint.hint_type,
          hintText: hint.hint_text ?? '',
          pointsPenalty: hint.points_penalty,
        })),
      );
      const trueAnswer = question.answers.find(
        (answer) => answer.answer_text === 'נכון',
      );
      setTrueFalseCorrect(trueAnswer?.is_correct ? 'true' : 'false');
    };

    void load();
    return () => {
      active = false;
    };
  }, [questionId, quizId, searchParams]);

  const resetTypeSpecificFields = (type: QuestionType) => {
    setQuestionType(type);
    setCorrectAnswerText('');
    setShuffleAnswers(false);
    setTrueFalseCorrect('true');
    setAnswers(defaultAnswers());
    setHints(type === 'association_hints' ? [createHintDraft('text')] : []);
    setErrors({});
  };

  const selectImage = async () => {
    setIsSelectingImage(true);
    try {
      const path = await window.api.file.selectAndSaveImage('question-images');
      if (path) setImagePath(path);
    } catch (imageError) {
      setErrors((current) => ({
        ...current,
        form: getErrorMessage(imageError),
      }));
    } finally {
      setIsSelectingImage(false);
    }
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!contestantId) next.contestantId = 'יש לבחור מתמודד.';
    if (!questionText.trim())
      next.questionText =
        questionType === 'multiple_options'
          ? 'יש להזין את טקסט האלמנט המרכזי.'
          : 'יש להזין טקסט לשאלה.';
    if (!Number.isInteger(points) || points < 0)
      next.points = 'הניקוד חייב להיות מספר שלם שאינו שלילי.';
    if (!isUnlimitedTime && (!Number.isInteger(timeLimit) || timeLimit <= 0))
      next.timeLimit = 'יש להזין מספר שניות גדול מאפס.';

    if (
      questionType === 'complete_sentence' ||
      questionType === 'open_answer'
    ) {
      if (!correctAnswerText.trim())
        next.correctAnswerText = 'יש להזין תשובה נכונה.';
    }
    if (
      ['multiple_choice', 'multiple_options', 'association_hints'].includes(
        questionType,
      )
    ) {
      if (answers.length < 2) next.answers = 'יש להוסיף לפחות שתי אפשרויות.';
      else if (answers.some((answer) => !answer.answerText.trim()))
        next.answers = 'יש למלא טקסט בכל האפשרויות.';
      else if (!answers.some((answer) => answer.isCorrect))
        next.answers = 'יש לסמן לפחות תשובה נכונה אחת.';
    }
    if (
      questionType === 'complete_sentence' ||
      questionType === 'association_hints'
    ) {
      if (questionType === 'association_hints' && hints.length === 0)
        next.hints = 'יש להוסיף לפחות רמז אחד.';
      else if (
        hints.some((hint) => hint.hintType === 'text' && !hint.hintText.trim())
      )
        next.hints = 'יש למלא טקסט בכל הרמזים הטקסטואליים.';
      else if (
        hints.some(
          (hint) =>
            !Number.isInteger(hint.pointsPenalty) || hint.pointsPenalty < 0,
        )
      )
        next.hints = 'הפחתת הניקוד חייבת להיות מספר שלם שאינו שלילי.';
    }
    return next;
  };

  const buildPayload = (): QuestionMutationInput => {
    const usesAnswers = [
      'multiple_choice',
      'multiple_options',
      'association_hints',
    ].includes(questionType);
    const trueFalseAnswers = [
      {
        answerText: 'נכון',
        isCorrect: trueFalseCorrect === 'true',
        displayOrder: 1,
      },
      {
        answerText: 'לא נכון',
        isCorrect: trueFalseCorrect === 'false',
        displayOrder: 2,
      },
    ];
    return {
      quizId,
      contestantId,
      questionType,
      questionText: questionText.trim(),
      imagePath,
      explanation: explanation.trim() || null,
      correctAnswerText:
        questionType === 'complete_sentence' || questionType === 'open_answer'
          ? correctAnswerText.trim()
          : null,
      points,
      timeLimit: isUnlimitedTime ? null : timeLimit,
      shuffleAnswers: questionType === 'multiple_choice' && shuffleAnswers,
      answers:
        questionType === 'true_false'
          ? trueFalseAnswers
          : usesAnswers
            ? answers.map((answer, index) => ({
                answerText: answer.answerText.trim(),
                isCorrect: answer.isCorrect,
                displayOrder: index + 1,
              }))
            : [],
      hints:
        questionType === 'complete_sentence' ||
        questionType === 'association_hints'
          ? hints.map((hint, index) => ({
              hintType:
                questionType === 'association_hints' ? 'text' : hint.hintType,
              hintText: hint.hintType === 'text' ? hint.hintText.trim() : null,
              hintOrder: index + 1,
              pointsPenalty: hint.pointsPenalty,
            }))
          : [],
    };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      document
        .querySelector('[aria-invalid="true"]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setIsSaving(true);
    try {
      const payload = buildPayload();
      if (questionId) await window.api.question.update(questionId, payload);
      else await window.api.question.create(payload);
      navigate(`/quizzes/${quizId}/edit`, { replace: true });
    } catch (saveError) {
      setErrors((current) => ({
        ...current,
        form: getErrorMessage(saveError),
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderedTypeFields = useMemo(() => {
    switch (questionType) {
      case 'multiple_choice':
        return (
          <MultipleChoiceFields
            answers={answers}
            shuffleAnswers={shuffleAnswers}
            errors={errors}
            onAnswersChange={setAnswers}
            onShuffleChange={setShuffleAnswers}
          />
        );
      case 'true_false':
        return (
          <TrueFalseFields
            correctValue={trueFalseCorrect}
            onChange={setTrueFalseCorrect}
          />
        );
      case 'complete_sentence':
        return (
          <CompleteSentenceFields
            correctAnswerText={correctAnswerText}
            hints={hints}
            errors={errors}
            onCorrectAnswerChange={setCorrectAnswerText}
            onHintsChange={setHints}
          />
        );
      case 'open_answer':
        return (
          <OpenAnswerFields
            value={correctAnswerText}
            errors={errors}
            onChange={setCorrectAnswerText}
          />
        );
      case 'multiple_options':
        return (
          <MultipleOptionsFields
            centralText={questionText}
            imageUrl={imageUrl}
            isSelectingImage={isSelectingImage}
            answers={answers}
            errors={errors}
            onCentralTextChange={setQuestionText}
            onSelectImage={() => void selectImage()}
            onRemoveImage={() => setImagePath(null)}
            onAnswersChange={setAnswers}
          />
        );
      case 'association_hints':
        return (
          <AssociationHintsFields
            hints={hints}
            answers={answers}
            errors={errors}
            onHintsChange={setHints}
            onAnswersChange={setAnswers}
          />
        );
    }
  }, [
    answers,
    correctAnswerText,
    errors,
    hints,
    imageUrl,
    isSelectingImage,
    questionText,
    questionType,
    shuffleAnswers,
    trueFalseCorrect,
  ]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-teal" size={34} />
          <p className="mt-3 font-bold text-ink/50">פותחים את עורך השאלה…</p>
        </div>
      </div>
    );
  }

  if (!quiz || contestants.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-6 text-center">
        <div>
          <AlertCircle className="mx-auto text-coral" size={40} />
          <h1 className="mt-4 font-display text-2xl font-black">
            אי אפשר לפתוח את העורך
          </h1>
          <p className="mt-2 max-w-md text-ink/55">
            {errors.form ?? 'יש להוסיף לפחות מתמודד אחד לפני שיוצרים שאלה.'}
          </p>
          <button
            onClick={() => navigate(`/quizzes/${quizId}/edit`)}
            className="mt-6 rounded-xl bg-teal px-5 py-3 font-bold text-white"
          >
            חזרה לחידון
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="app-shell min-h-screen bg-canvas text-ink"
    >
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center gap-4 px-6 py-4 lg:px-10">
          <button
            type="button"
            onClick={() => navigate(`/quizzes/${quizId}/edit`)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-ink/55 hover:bg-canvas hover:text-ink"
          >
            <ArrowRight size={19} /> חזרה
          </button>
          <span className="h-7 w-px bg-ink/10" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-black sm:text-2xl">
              {isEditing ? 'עריכת שאלה' : 'שאלה חדשה'}
            </h1>
            <p className="mt-0.5 truncate text-xs font-bold text-ink/40">
              {quiz.name}
            </p>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-w-36 items-center justify-center gap-2 rounded-2xl bg-teal px-5 py-3 font-bold text-white shadow-button hover:bg-teal-dark disabled:cursor-wait disabled:opacity-60"
          >
            {isSaving ? (
              <LoaderCircle className="animate-spin" size={19} />
            ) : (
              <Save size={19} />
            )}
            {isSaving ? 'שומרים…' : 'שמירת שאלה'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-6 pb-20 pt-8 lg:px-10">
        {errors.form ? (
          <div
            className="mb-5 flex items-center gap-2 rounded-2xl border border-coral/20 bg-red-50 px-4 py-3 font-semibold text-red-900"
            role="alert"
          >
            <AlertCircle size={19} />
            {errors.form}
          </div>
        ) : null}

        <section className="mb-6 overflow-hidden rounded-[28px] bg-hero p-5 text-white shadow-hero lg:p-6">
          <div className="grid items-end gap-5 lg:grid-cols-[minmax(0,24rem)_1fr]">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/70">
                סוג השאלה{' '}
                {isEditing ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-mint">
                    <LockKeyhole size={12} /> נעול בעריכה
                  </span>
                ) : null}
              </span>
              <select
                value={questionType}
                disabled={isEditing}
                onChange={(event) =>
                  resetTypeSpecificFields(event.target.value as QuestionType)
                }
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3.5 font-display text-base font-black text-ink outline-none focus:ring-4 focus:ring-mint/20 disabled:cursor-not-allowed disabled:bg-white/90"
              >
                {QUESTION_TYPE_ORDER.map((type) => (
                  <option key={type} value={type}>
                    {QUESTION_TYPE_META[type].label}
                  </option>
                ))}
              </select>
            </label>
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              aria-label="מפת סוגי השאלות"
            >
              {QUESTION_TYPE_ORDER.map((type) => {
                const meta = QUESTION_TYPE_META[type];
                const Icon = meta.icon;
                const active = type === questionType;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={isEditing}
                    onClick={() => resetTypeSpecificFields(type)}
                    className={`flex min-w-28 flex-1 flex-col items-center gap-2 rounded-2xl px-3 py-3 text-center transition ${active ? 'bg-white text-ink shadow-lg' : 'bg-white/[0.07] text-white/55 hover:bg-white/10 hover:text-white'} disabled:cursor-default`}
                    aria-pressed={active}
                  >
                    <Icon
                      className={active ? meta.accentClass : ''}
                      size={21}
                    />
                    <span className="text-xs font-bold leading-4">
                      {meta.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            {questionType !== 'multiple_options' ? (
              <section className="rounded-[26px] border border-ink/[0.06] bg-white p-5 shadow-card sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-2xl ${typeMeta.surfaceClass} ${typeMeta.accentClass}`}
                  >
                    <TypeIcon size={22} />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-black">
                      תוכן השאלה
                    </h2>
                    <p className="text-xs text-ink/45">
                      מה שהמתמודד והקהל יראו על המסך
                    </p>
                  </div>
                </div>
                <label
                  htmlFor="question-text"
                  className="mb-2 block text-sm font-bold text-ink/65"
                >
                  טקסט השאלה
                </label>
                <textarea
                  id="question-text"
                  value={questionText}
                  onChange={(event) => setQuestionText(event.target.value)}
                  rows={4}
                  aria-invalid={Boolean(errors.questionText)}
                  className={`w-full resize-y rounded-2xl border bg-white px-4 py-3.5 text-base font-semibold leading-7 outline-none focus:ring-4 ${errors.questionText ? 'border-coral focus:ring-coral/10' : 'border-ink/10 focus:border-teal focus:ring-teal/10'}`}
                  placeholder="כתבו כאן את השאלה…"
                />
                {errors.questionText ? (
                  <p className="mt-2 text-sm font-bold text-red-700">
                    {errors.questionText}
                  </p>
                ) : null}
                <div className="mt-6">
                  <QuestionImagePicker
                    imageUrl={imageUrl}
                    isSelecting={isSelectingImage}
                    onSelect={() => void selectImage()}
                    onRemove={() => setImagePath(null)}
                  />
                </div>
              </section>
            ) : null}

            <section className="rounded-[26px] border border-ink/[0.06] bg-white p-5 shadow-card sm:p-6">
              <div className="mb-5">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${typeMeta.surfaceClass} ${typeMeta.accentClass}`}
                >
                  <TypeIcon size={15} />
                  {typeMeta.label}
                </span>
                <h2 className="mt-3 font-display text-lg font-black">
                  {questionType === 'multiple_options'
                    ? 'האלמנט והאופציות'
                    : 'מבנה התשובה'}
                </h2>
                <p className="mt-1 text-sm text-ink/45">
                  {typeMeta.description}
                </p>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={questionType}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderedTypeFields}
                </motion.div>
              </AnimatePresence>
            </section>

            <section className="rounded-[26px] border border-ink/[0.06] bg-white p-5 shadow-card sm:p-6">
              <label
                htmlFor="explanation"
                className="flex items-center gap-2 font-display text-lg font-black"
              >
                <Sparkles className="text-amber-dark" size={20} /> הסבר לתשובה
              </label>
              <p className="mt-1 text-sm text-ink/45">
                יוצג גם בחגיגת תשובה נכונה וגם לאחר תשובה שגויה
              </p>
              <textarea
                id="explanation"
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
                rows={4}
                className="mt-4 w-full resize-y rounded-2xl border border-ink/10 bg-white px-4 py-3.5 leading-7 outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
                placeholder="למה זו התשובה הנכונה? (אופציונלי)"
              />
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28">
            <section className="rounded-[24px] border border-ink/[0.06] bg-white p-5 shadow-card">
              <h2 className="font-display text-base font-black">
                הגדרות השאלה
              </h2>
              <div className="mt-5 space-y-5">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-bold text-ink/60">
                    <UserRound size={16} /> מתמודד
                  </span>
                  <select
                    value={contestantId}
                    onChange={(event) =>
                      setContestantId(Number(event.target.value))
                    }
                    aria-invalid={Boolean(errors.contestantId)}
                    className={`w-full rounded-xl border bg-white px-3 py-3 font-bold outline-none focus:ring-4 ${errors.contestantId ? 'border-coral focus:ring-coral/10' : 'border-ink/10 focus:border-teal focus:ring-teal/10'}`}
                  >
                    {contestants.map((contestant) => (
                      <option key={contestant.id} value={contestant.id}>
                        {contestant.name}
                      </option>
                    ))}
                  </select>
                  {errors.contestantId ? (
                    <p className="mt-1.5 text-xs font-bold text-red-700">
                      {errors.contestantId}
                    </p>
                  ) : null}
                </label>
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-bold text-ink/60">
                    <CheckCircle2 size={16} /> ניקוד
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={points}
                      onChange={(event) =>
                        setPoints(Number(event.target.value))
                      }
                      aria-invalid={Boolean(errors.points)}
                      className={`w-full rounded-xl border bg-white px-3 py-3 pl-14 font-bold outline-none focus:ring-4 ${errors.points ? 'border-coral focus:ring-coral/10' : 'border-ink/10 focus:border-teal focus:ring-teal/10'}`}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink/35">
                      נק׳
                    </span>
                  </div>
                  {errors.points ? (
                    <p className="mt-1.5 text-xs font-bold text-red-700">
                      {errors.points}
                    </p>
                  ) : null}
                </label>
              </div>
            </section>

            <section className="rounded-[24px] border border-ink/[0.06] bg-white p-5 shadow-card">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-display font-black">
                  <Clock3 className="text-violet" size={19} /> זמן מענה
                </span>
                <input
                  type="checkbox"
                  checked={isUnlimitedTime}
                  onChange={(event) => setIsUnlimitedTime(event.target.checked)}
                  className="h-5 w-5 accent-teal"
                />
              </label>
              <p className="mt-1 text-xs text-ink/45">
                הסימון מגדיר ללא הגבלת זמן
              </p>
              {!isUnlimitedTime ? (
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-xs font-bold text-ink/50">
                    מספר שניות
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={timeLimit}
                    onChange={(event) =>
                      setTimeLimit(Number(event.target.value))
                    }
                    aria-invalid={Boolean(errors.timeLimit)}
                    className={`w-full rounded-xl border bg-white px-3 py-3 font-bold outline-none focus:ring-4 ${errors.timeLimit ? 'border-coral focus:ring-coral/10' : 'border-ink/10 focus:border-teal focus:ring-teal/10'}`}
                  />
                  {errors.timeLimit ? (
                    <p className="mt-1.5 text-xs font-bold text-red-700">
                      {errors.timeLimit}
                    </p>
                  ) : null}
                </label>
              ) : null}
            </section>

            <div className="rounded-[22px] bg-teal/10 p-4 text-sm leading-6 text-teal-dark">
              <strong className="block">הכול נשמר מקומית</strong>
              <span className="text-ink/55">
                התשובות, הרמזים והתמונה יישמרו יחד עם השאלה במסד הנתונים המקומי.
              </span>
            </div>
          </aside>
        </div>
      </main>
    </form>
  );
}
