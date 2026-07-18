import type { Hint, QuestionWithRelations } from '../types';

export function getOrderedHints(question: QuestionWithRelations): Hint[] {
  return [...question.hints].sort(
    (a, b) => a.hint_order - b.hint_order || a.id - b.id,
  );
}

export function getRevealableHints(question: QuestionWithRelations): Hint[] {
  const hints = getOrderedHints(question);
  return question.question_type === 'association_hints'
    ? hints.slice(1)
    : hints;
}

export function calculatePotentialPoints(
  question: QuestionWithRelations,
  revealedHints: number,
): number {
  const penalty = getRevealableHints(question)
    .slice(0, Math.max(0, revealedHints))
    .reduce((total, hint) => total + hint.points_penalty, 0);

  return Math.max(0, question.points - penalty);
}
