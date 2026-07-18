import type { QuestionWithRelations } from '../../../types';

export interface LiveQuestionTypeProps {
  question: QuestionWithRelations;
  revealedHints: number;
  onSubmit: (isCorrect: boolean, pointsAwarded: number) => void;
  disabled?: boolean;
}
