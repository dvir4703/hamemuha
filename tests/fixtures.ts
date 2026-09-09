import { useLiveStore } from '../src/store/liveStore';
import type { QuestionType, QuestionWithRelations } from '../src/types';

export const types: QuestionType[] = [
  'multiple_choice',
  'true_false',
  'complete_sentence',
  'open_answer',
  'multiple_options',
  'association_hints',
];
export function question(type: QuestionType, id = 1): QuestionWithRelations {
  return {
    id,
    quiz_id: 1,
    contestant_id: 1,
    question_type: type,
    question_text: `שאלה ${id}`,
    image_path: null,
    explanation: 'הסבר',
    correct_answer_text: 'אב גד',
    prerevealed_positions: '[0]',
    points: 10,
    time_limit: null,
    display_order: id,
    shuffle_answers: false,
    answers: Array.from(
      { length: type === 'true_false' ? 2 : 6 },
      (_, index) => ({
        id: id * 10 + index,
        question_id: id,
        answer_text: `אפשרות ${index + 1}`,
        image_path: null,
        is_correct: index === 0 || (type !== 'true_false' && index === 1),
        display_order: index + 1,
      }),
    ),
    hints: [
      {
        id: 1,
        question_id: id,
        hint_type: 'letter_reveal',
        hint_text: '[1,3]',
        hint_order: 1,
        points_penalty: 2,
      },
      {
        id: 2,
        question_id: id,
        hint_type: 'text',
        hint_text: 'רמז טקסט',
        hint_order: 2,
        points_penalty: 1,
      },
    ],
  };
}
export function seed(
  questions = types.map((type, i) => question(type, i + 1)),
) {
  useLiveStore.getState().resetGame();
  useLiveStore.setState({
    quizId: 1,
    currentContestantId: 1,
    gamePhase: 'playing',
    contestants: [
      {
        id: 1,
        quiz_id: 1,
        name: 'א',
        display_order: 1,
        total_time_limit: null,
      },
      {
        id: 2,
        quiz_id: 1,
        name: 'ב',
        display_order: 2,
        total_time_limit: null,
      },
    ],
    questionsByContestant: new Map([
      [1, questions],
      [2, [question('multiple_choice', 100)]],
    ]),
    returnQueueByContestant: new Map([
      [1, []],
      [2, []],
    ]),
    currentQuestionIndexByContestant: new Map([
      [1, 0],
      [2, 0],
    ]),
    scoresByContestant: new Map([
      [1, 0],
      [2, 0],
    ]),
    potentialPointsForCurrentQuestion: questions[0].points,
  });
  return questions[0];
}
