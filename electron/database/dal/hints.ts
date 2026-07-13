import type Database from 'better-sqlite3';

import type { Hint, HintInput } from '../../../src/types';

export type HintRecord = Hint;
export type CreateHintInput = HintInput;

export function getHintsByQuestionId(
  database: Database.Database,
  questionId: number,
): Hint[] {
  return database
    .prepare(
      `
        SELECT * FROM hints
        WHERE question_id = ?
        ORDER BY hint_order ASC, id ASC
      `,
    )
    .all(questionId) as Hint[];
}

export function replaceHints(
  database: Database.Database,
  questionId: number,
  hints: HintInput[],
): void {
  database.prepare('DELETE FROM hints WHERE question_id = ?').run(questionId);

  const insert = database.prepare(
    `
      INSERT INTO hints (
        question_id,
        hint_type,
        hint_text,
        hint_order,
        points_penalty
      ) VALUES (?, ?, ?, ?, ?)
    `,
  );

  for (const hint of hints) {
    insert.run(
      questionId,
      hint.hintType,
      hint.hintType === 'letter_reveal'
        ? null
        : (hint.hintText?.trim() ?? null),
      hint.hintOrder,
      hint.pointsPenalty,
    );
  }
}
