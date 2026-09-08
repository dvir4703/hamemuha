import type { Hint, QuestionType, QuestionWithRelations } from '../types';

export function getOrderedHints(question: QuestionWithRelations): Hint[] {
  return [...question.hints].sort(
    (a, b) => a.hint_order - b.hint_order || a.id - b.id,
  );
}

export function getRevealableHints(question: QuestionWithRelations): Hint[] {
  return question.question_type === 'complete_sentence'
    ? getOrderedHints(question)
    : [];
}

export function isSelectionQuestion(type: QuestionType): boolean {
  return [
    'multiple_choice',
    'true_false',
    'multiple_options',
    'association_hints',
  ].includes(type);
}

export function chooseFiftyFiftyHiddenIds(
  question: QuestionWithRelations,
): number[] {
  const correctCount = question.answers.filter(
    (answer) => answer.is_correct,
  ).length;
  const wrongIds = question.answers
    .filter((answer) => !answer.is_correct)
    .map((answer) => answer.id);
  const hiddenCount = wrongIds.length - correctCount;
  if (hiddenCount <= 0) return [];

  for (let index = wrongIds.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [wrongIds[index], wrongIds[target]] = [wrongIds[target], wrongIds[index]];
  }
  return wrongIds.slice(0, hiddenCount);
}

export function calculatePotentialPoints(
  question: QuestionWithRelations,
  revealedHints: number,
  fiftyFiftyUsed = false,
): number {
  if (question.question_type === 'multiple_choice' && fiftyFiftyUsed) {
    return Math.floor(question.points / 2);
  }

  const penalty = getRevealableHints(question)
    .slice(0, Math.max(0, revealedHints))
    .reduce((total, hint) => total + hint.points_penalty, 0);

  return Math.max(0, question.points - penalty);
}
