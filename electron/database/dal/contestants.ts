import type {
  Contestant,
  ContestantCreateInput,
  ContestantUpdateInput,
} from '../../../src/types';
import { getDatabase } from '../connection';

export type ContestantRecord = Contestant;
export type CreateContestantInput = ContestantCreateInput;

function requireContestantName(name: string): string {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('יש להזין שם למתמודד.');
  }

  return trimmedName;
}

export function getContestantsByQuizId(quizId: number): Contestant[] {
  return getDatabase()
    .prepare(
      `
        SELECT * FROM contestants
        WHERE quiz_id = ?
        ORDER BY display_order ASC, id ASC
      `,
    )
    .all(quizId) as Contestant[];
}

export function createContestant({
  quizId,
  name,
  displayOrder,
}: ContestantCreateInput): Contestant {
  const database = getDatabase();
  const result = database
    .prepare(
      `
        INSERT INTO contestants (quiz_id, name, display_order)
        VALUES (?, ?, ?)
      `,
    )
    .run(quizId, requireContestantName(name), displayOrder);
  const contestant = database
    .prepare('SELECT * FROM contestants WHERE id = ?')
    .get(result.lastInsertRowid) as Contestant | undefined;

  if (!contestant) {
    throw new Error('יצירת המתמודד נכשלה.');
  }

  return contestant;
}

export function updateContestant(
  id: number,
  { name, displayOrder }: ContestantUpdateInput,
): Contestant | null {
  const database = getDatabase();
  const result = database
    .prepare(
      `
        UPDATE contestants
        SET name = ?, display_order = ?
        WHERE id = ?
      `,
    )
    .run(requireContestantName(name), displayOrder, id);

  if (result.changes === 0) {
    return null;
  }

  return database
    .prepare('SELECT * FROM contestants WHERE id = ?')
    .get(id) as Contestant;
}

export function deleteContestant(id: number): boolean {
  const result = getDatabase()
    .prepare('DELETE FROM contestants WHERE id = ?')
    .run(id);

  return result.changes > 0;
}
