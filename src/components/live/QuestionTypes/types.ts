import type { QuestionWithRelations } from '../../../types';

export interface LiveQuestionTypeProps {
  question: QuestionWithRelations;
  revealedHints: number;
  revealedOptions: number;
  timeoutExpired: boolean;
  onSubmit: (
    isCorrect: boolean,
    pointsAwarded: number,
    wasTimeout?: boolean,
  ) => void;
  disabled?: boolean;
}
