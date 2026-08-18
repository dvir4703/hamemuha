import type Database from 'better-sqlite3';

import type {
  Answer,
  Contestant,
  ContestantCreateInput,
  ContestantUpdateInput,
  Hint,
  Question,
} from '../../../src/types';
import { getDatabase } from '../connection';

export type ContestantRecord = Contestant;
export type CreateContestantInput = ContestantCreateInput;

type QuestionRow = Omit<Question, 'shuffle_answers'> & {
  shuffle_answers: number;
};

type AnswerRow = Omit<Answer, 'is_correct'> & {
  is_correct: number;
};

function requireContestantName(name: string): string {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('יש להזין שם למתמודד.');
  }

  return trimmedName;
}

function getNextCopyName(
  database: Database.Database,
  quizId: number,
  sourceName: string,
): string {
  const copyMatch = sourceName.match(
    /^(.*)\s+(?:\u2014|-)\s+עותק(?:\s+(\d+))?$/,
  );
  const baseName = copyMatch?.[1]?.trim() || sourceName;
  let copyNumber = copyMatch ? Number(copyMatch[2] ?? 1) + 1 : 1;

  while (true) {
    const candidate =
      copyNumber === 1
        ? `${baseName} - עותק`
        : `${baseName} - עותק ${copyNumber}`;
    const existing = database
      .prepare(
        'SELECT id FROM contestants WHERE quiz_id = ? AND name = ? LIMIT 1',
      )
      .get(quizId, candidate);

    if (!existing) {
      return candidate;
    }

    copyNumber += 1;
  }
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

export function duplicateContestant(id: number): Contestant {
  const database = getDatabase();
  const duplicateTransaction = database.transaction(() => {
    const source = database
      .prepare('SELECT * FROM contestants WHERE id = ?')
      .get(id) as Contestant | undefined;

    if (!source) {
      throw new Error('המתמודד שביקשתם לשכפל לא נמצא.');
    }

    const questions = database
      .prepare(
        `
          SELECT * FROM questions
          WHERE contestant_id = ?
          ORDER BY display_order, id
        `,
      )
      .all(id) as QuestionRow[];
    const answers = database
      .prepare(
        `
          SELECT answers.*
          FROM answers
          INNER JOIN questions ON questions.id = answers.question_id
          WHERE questions.contestant_id = ?
          ORDER BY answers.question_id, answers.display_order, answers.id
        `,
      )
      .all(id) as AnswerRow[];
    const hints = database
      .prepare(
        `
          SELECT hints.*
          FROM hints
          INNER JOIN questions ON questions.id = hints.question_id
          WHERE questions.contestant_id = ?
          ORDER BY hints.question_id, hints.hint_order, hints.id
        `,
      )
      .all(id) as Hint[];
    const nextOrder = database
      .prepare(
        `
          SELECT COALESCE(MAX(display_order), 0) + 1 AS value
          FROM contestants
          WHERE quiz_id = ?
        `,
      )
      .get(source.quiz_id) as { value: number };
    const contestantResult = database
      .prepare(
        `
          INSERT INTO contestants (quiz_id, name, display_order)
          VALUES (?, ?, ?)
        `,
      )
      .run(
        source.quiz_id,
        getNextCopyName(database, source.quiz_id, source.name),
        nextOrder.value,
      );
    const newContestantId = Number(contestantResult.lastInsertRowid);
    const answersByQuestion = new Map<number, AnswerRow[]>();
    const hintsByQuestion = new Map<number, Hint[]>();
    const questionIdMap = new Map<number, number>();

    for (const answer of answers) {
      const questionAnswers = answersByQuestion.get(answer.question_id) ?? [];
      questionAnswers.push(answer);
      answersByQuestion.set(answer.question_id, questionAnswers);
    }

    for (const hint of hints) {
      const questionHints = hintsByQuestion.get(hint.question_id) ?? [];
      questionHints.push(hint);
      hintsByQuestion.set(hint.question_id, questionHints);
    }

    const insertQuestion = database.prepare(
      `
        INSERT INTO questions (
          quiz_id,
          contestant_id,
          question_type,
          question_text,
          image_path,
          explanation,
          correct_answer_text,
          points,
          time_limit,
          display_order,
          shuffle_answers
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    );
    const insertAnswer = database.prepare(
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
    const insertHint = database.prepare(
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

    for (const question of questions) {
      const questionResult = insertQuestion.run(
        source.quiz_id,
        newContestantId,
        question.question_type,
        question.question_text,
        question.image_path,
        question.explanation,
        question.correct_answer_text,
        question.points,
        question.time_limit,
        question.display_order,
        question.shuffle_answers,
      );
      const newQuestionId = Number(questionResult.lastInsertRowid);
      questionIdMap.set(question.id, newQuestionId);

      for (const answer of answersByQuestion.get(question.id) ?? []) {
        insertAnswer.run(
          newQuestionId,
          answer.answer_text,
          answer.image_path,
          answer.is_correct,
          answer.display_order,
        );
      }

      for (const hint of hintsByQuestion.get(question.id) ?? []) {
        insertHint.run(
          newQuestionId,
          hint.hint_type,
          hint.hint_text,
          hint.hint_order,
          hint.points_penalty,
        );
      }
    }

    if (questionIdMap.size !== questions.length) {
      throw new Error('העתקת שאלות המתמודד נכשלה.');
    }

    database
      .prepare('UPDATE quizzes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(source.quiz_id);

    return newContestantId;
  });
  const duplicatedId = duplicateTransaction();
  const duplicated = database
    .prepare('SELECT * FROM contestants WHERE id = ?')
    .get(duplicatedId) as Contestant | undefined;

  if (!duplicated) {
    throw new Error('שכפול המתמודד נכשל.');
  }

  return duplicated;
}
