import type { QuestionWithRelations } from '../../../types';

export interface LiveQuestionTypeProps {
  question: QuestionWithRelations;
  revealedHints: number;
  revealedOptions: number;
  timeoutExpired: boolean;
  onSubmit: (isCorrect: boolean, pointsAwarded: number) => void;
  disabled?: boolean;
}
