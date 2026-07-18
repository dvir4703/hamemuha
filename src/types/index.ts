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

export interface QuizSummary extends Quiz {
  questionCount: number;
  contestantCount: number;
}

export interface QuestionSummary extends Question {
  contestant_name: string;
  answerCount: number;
  hintCount: number;
}

export interface QuestionWithRelations extends Question {
  answers: Answer[];
  hints: Hint[];
}

export interface QuestionSummaryWithRelations extends QuestionSummary {
  answers: Answer[];
  hints: Hint[];
}

export interface ContestantGameResultInput {
  contestantId: number;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  hintsUsed: number;
}

export interface SaveGameResultInput {
  quizId: number;
  totalTime: number;
  contestantResults: ContestantGameResultInput[];
}

export interface GameResultWithContestants extends GameResult {
  contestantResults: ContestantResult[];
}

export interface SaveScoreboardImageInput {
  dataUrl: string;
  defaultFileName: string;
}

export interface SaveScoreboardImageResult {
  saved: boolean;
  filePath: string | null;
}

export interface QuizMutationInput {
  name: string;
  logoPath?: string | null;
}

export interface ContestantCreateInput {
  quizId: number;
  name: string;
  displayOrder: number;
}

export interface ContestantUpdateInput {
  name: string;
  displayOrder: number;
}

export interface AnswerInput {
  answerText: string;
  imagePath?: string | null;
  isCorrect: boolean;
  displayOrder: number;
}

export interface HintInput {
  hintType: HintType;
  hintText?: string | null;
  hintOrder: number;
  pointsPenalty: number;
}

export interface QuestionMutationInput {
  quizId: number;
  contestantId: number;
  questionType: QuestionType;
  questionText: string;
  imagePath?: string | null;
  explanation?: string | null;
  correctAnswerText?: string | null;
  points: number;
  timeLimit?: number | null;
  displayOrder?: number;
  shuffleAnswers: boolean;
  answers: AnswerInput[];
  hints: HintInput[];
}

export interface ElectronApi {
  quiz: {
    getAll: () => Promise<QuizSummary[]>;
    getById: (id: number) => Promise<Quiz | null>;
    create: (data: QuizMutationInput) => Promise<Quiz>;
    update: (id: number, data: QuizMutationInput) => Promise<Quiz | null>;
    delete: (id: number) => Promise<boolean>;
    duplicate: (id: number) => Promise<Quiz>;
    search: (query: string) => Promise<QuizSummary[]>;
  };
  contestant: {
    getByQuizId: (quizId: number) => Promise<Contestant[]>;
    create: (data: ContestantCreateInput) => Promise<Contestant>;
    update: (
      id: number,
      data: ContestantUpdateInput,
    ) => Promise<Contestant | null>;
    delete: (id: number) => Promise<boolean>;
  };
  question: {
    getByQuizId: (quizId: number) => Promise<QuestionSummaryWithRelations[]>;
    getById: (id: number) => Promise<QuestionWithRelations | null>;
    create: (data: QuestionMutationInput) => Promise<QuestionWithRelations>;
    update: (
      id: number,
      data: QuestionMutationInput,
    ) => Promise<QuestionWithRelations | null>;
    delete: (id: number) => Promise<boolean>;
    reorder: (contestantId: number, orderedIds: number[]) => Promise<boolean>;
    duplicate: (id: number) => Promise<QuestionWithRelations>;
  };
  result: {
    saveGameResult: (
      data: SaveGameResultInput,
    ) => Promise<GameResultWithContestants>;
    getById: (id: number) => Promise<GameResultWithContestants | null>;
  };
  export: {
    saveScoreboardImage: (
      data: SaveScoreboardImageInput,
    ) => Promise<SaveScoreboardImageResult>;
  };
  file: {
    selectAndSaveImage: (category: string) => Promise<string | null>;
    getImageUrl: (relativePath: string) => Promise<string>;
    getImageDataUrl: (relativePath: string) => Promise<string>;
  };
  system: {
    platform: NodeJS.Platform;
  };
}
