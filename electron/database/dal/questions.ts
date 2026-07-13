import type { Hint, Question } from '../../../src/types';

export type QuestionRecord = Question;
export type HintRecord = Hint;
export type CreateQuestionInput = Omit<Question, 'id'>;
export type CreateHintInput = Omit<Hint, 'id'>;
