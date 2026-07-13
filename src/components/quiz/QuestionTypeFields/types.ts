import type { HintType } from '../../../types';

export interface AnswerDraft {
  key: string;
  answerText: string;
  isCorrect: boolean;
}

export interface HintDraft {
  key: string;
  hintType: HintType;
  hintText: string;
  pointsPenalty: number;
}

export interface FieldErrors {
  answers?: string;
  hints?: string;
  correctAnswerText?: string;
  questionText?: string;
}

export function createAnswerDraft(
  answerText = '',
  isCorrect = false,
): AnswerDraft {
  return { key: crypto.randomUUID(), answerText, isCorrect };
}

export function createHintDraft(hintType: HintType = 'text'): HintDraft {
  return {
    key: crypto.randomUUID(),
    hintType,
    hintText: '',
    pointsPenalty: 1,
  };
}
