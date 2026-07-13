export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'complete_sentence'
  | 'open_answer'
  | 'multiple_options'
  | 'association_hints';

export type HintType = 'letter_reveal' | 'text';

export interface Quiz {
  id: number;
  name: string;
  logo_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contestant {
  id: number;
  quiz_id: number;
  name: string;
  display_order: number;
}

export interface Question {
  id: number;
  quiz_id: number;
  contestant_id: number;
  question_type: QuestionType;
  question_text: string;
  image_path: string | null;
  explanation: string | null;
  correct_answer_text: string | null;
  points: number;
  time_limit: number | null;
  display_order: number;
  shuffle_answers: boolean;
}

export interface Answer {
  id: number;
  question_id: number;
  answer_text: string;
  image_path: string | null;
  is_correct: boolean;
  display_order: number;
}

export interface Hint {
  id: number;
  question_id: number;
  hint_type: HintType;
  hint_text: string | null;
  hint_order: number;
  points_penalty: number;
}

export interface GameResult {
  id: number;
  quiz_id: number;
  played_at: string;
  total_time: number | null;
}

export interface ContestantResult {
  id: number;
  game_result_id: number;
  contestant_id: number;
  total_score: number;
  correct_count: number;
  wrong_count: number;
  hints_used: number;
}
