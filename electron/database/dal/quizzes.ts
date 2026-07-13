import type { Quiz } from '../../../src/types';

export type QuizRecord = Quiz;
export type CreateQuizInput = Pick<Quiz, 'name'> &
  Partial<Pick<Quiz, 'logo_path'>>;
export type UpdateQuizInput = Partial<CreateQuizInput>;
