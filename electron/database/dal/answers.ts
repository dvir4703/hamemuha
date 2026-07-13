import type Database from 'better-sqlite3';

import type { Answer, AnswerInput } from '../../../src/types';

export type AnswerRecord = Answer;
export type CreateAnswerInput = AnswerInput;

type AnswerRow = Omit<Answer, 'is_correct'> & { is_correct: number };

function mapAnswer(row: AnswerRow): Answer {
  return { ...row, is_correct: Boolean(row.is_correct) };
}

export function getAnswersByQuestionId(
  database: Database.Database,
  questionId: number,
): Answer[] {
  const rows = database
    .prepare(
      `
        SELECT * FROM answers
        WHERE question_id = ?
        ORDER BY display_order ASC, id ASC
      `,
    )
    .all(questionId) as AnswerRow[];

  return rows.map(mapAnswer);
}

export function replaceAnswers(
  database: Database.Database,
  questionId: number,
  answers: AnswerInput[],
): void {
  database.prepare('DELETE FROM answers WHERE question_id = ?').run(questionId);

  const insert = database.prepare(
    `
      INSERT INTO answers (
        question_id,
        answer_text,
        image_path,
        is_correct,
        display_order
      ) VALUES (?, ?, ?, ?, ?)
    `,
  );

  for (const answer of answers) {
    insert.run(
      questionId,
      answer.answerText.trim(),
      answer.imagePath ?? null,
      answer.isCorrect ? 1 : 0,
      answer.displayOrder,
    );
  }
}
