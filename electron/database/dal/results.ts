import type {
  ContestantResult,
  GameResult,
  GameResultWithContestants,
  SaveGameResultInput,
} from '../../../src/types';
import { getDatabase } from '../connection';

export type GameResultRecord = GameResult;
export type ContestantResultRecord = ContestantResult;
export type CreateGameResultInput = SaveGameResultInput;

function requireNonNegativeInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} חייב להיות מספר שלם שאינו שלילי.`);
  }
  return value;
}

export function getGameResultById(
  id: number,
): GameResultWithContestants | null {
  const database = getDatabase();
  const gameResult = database
    .prepare('SELECT * FROM game_results WHERE id = ?')
    .get(id) as GameResult | undefined;

  if (!gameResult) return null;

  const contestantResults = database
    .prepare(
      `
        SELECT * FROM contestant_results
        WHERE game_result_id = ?
        ORDER BY id ASC
      `,
    )
    .all(id) as ContestantResult[];

  return { ...gameResult, contestantResults };
}

export function saveGameResult({
  quizId,
  totalTime,
  contestantResults,
}: SaveGameResultInput): GameResultWithContestants {
  if (!Number.isInteger(quizId) || quizId <= 0) {
    throw new Error('מזהה החידון אינו תקין.');
  }
  requireNonNegativeInteger(totalTime, 'הזמן הכולל');

  const database = getDatabase();
  const resultId = database.transaction(() => {
    const quiz = database
      .prepare('SELECT id FROM quizzes WHERE id = ?')
      .get(quizId);
    if (!quiz) throw new Error('החידון לא נמצא.');

    const expectedContestants = database
      .prepare('SELECT id FROM contestants WHERE quiz_id = ? ORDER BY id')
      .all(quizId) as Array<{ id: number }>;
    const expectedIds = expectedContestants
      .map(({ id }) => id)
      .sort((a, b) => a - b);
    const submittedIds = contestantResults
      .map(({ contestantId }) => contestantId)
      .sort((a, b) => a - b);

    if (
      expectedIds.length !== submittedIds.length ||
      expectedIds.some((id, index) => id !== submittedIds[index])
    ) {
      throw new Error('תוצאות המתמודדים אינן תואמות למתמודדי החידון.');
    }

    const gameResult = database
      .prepare('INSERT INTO game_results (quiz_id, total_time) VALUES (?, ?)')
      .run(quizId, totalTime);
    const gameResultId = Number(gameResult.lastInsertRowid);
    const insertContestantResult = database.prepare(
      `
        INSERT INTO contestant_results (
          game_result_id,
          contestant_id,
          total_score,
          correct_count,
          wrong_count,
          hints_used
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
    );

    for (const result of contestantResults) {
      insertContestantResult.run(
        gameResultId,
        result.contestantId,
        requireNonNegativeInteger(result.totalScore, 'הניקוד'),
        requireNonNegativeInteger(result.correctCount, 'מספר התשובות הנכונות'),
        requireNonNegativeInteger(result.wrongCount, 'מספר התשובות השגויות'),
        requireNonNegativeInteger(result.hintsUsed, 'מספר הרמזים'),
      );
    }

    return gameResultId;
  })();

  const savedResult = getGameResultById(resultId);
  if (!savedResult) throw new Error('שמירת תוצאות המשחק נכשלה.');
  return savedResult;
}
