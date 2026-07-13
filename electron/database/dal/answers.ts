import type { Answer } from '../../../src/types';

export type AnswerRecord = Answer;
export type CreateAnswerInput = Omit<Answer, 'id'>;
