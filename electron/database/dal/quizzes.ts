import type {
  Answer,
  Contestant,
  Hint,
  Question,
  Quiz,
  QuizMutationInput,
  QuizSummary,
} from '../../../src/types';
import { getDatabase } from '../connection';

export type QuizRecord = Quiz;
export type CreateQuizInput = QuizMutationInput;
export type UpdateQuizInput = QuizMutationInput;

type QuestionRow = Omit<Question, 'shuffle_answers'> & {
  shuffle_answers: number;
};

type AnswerRow = Omit<Answer, 'is_correct'> & {
  is_correct: number;
};

const QUIZ_SUMMARY_SELECT = `
  SELECT
    q.id,
    q.name,
    q.logo_path,
    q.created_at,
    q.updated_at,
    (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS questionCount,
    (SELECT COUNT(*) FROM contestants WHERE quiz_id = q.id) AS contestantCount
  FROM quizzes AS q
`;

function requireQuizName(name: string): string {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('יש להזין שם לחידון.');
  }

  return trimmedName;
}

function escapeLikeValue(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

function getNextCopyName(sourceName: string): string {
  const database = getDatabase();
  const copyMatch = sourceName.match(/^(.*)\s+—\s+עותק(?:\s+(\d+))?$/);
  const baseName = copyMatch?.[1]?.trim() || sourceName;
  let copyNumber = copyMatch ? Number(copyMatch[2] ?? 1) + 1 : 1;

  while (true) {
    const candidate =
      copyNumber === 1
        ? `${baseName} — עותק`
        : `${baseName} — עותק ${copyNumber}`;
    const existing = database
      .prepare('SELECT id FROM quizzes WHERE name = ? LIMIT 1')
      .get(candidate);

    if (!existing) {
      return candidate;
    }

    copyNumber += 1;
  }
}

export function getAllQuizzes(): QuizSummary[] {
  return getDatabase()
    .prepare(`${QUIZ_SUMMARY_SELECT} ORDER BY q.updated_at DESC, q.id DESC`)
    .all() as QuizSummary[];
}

export function getQuizById(id: number): Quiz | null {
  return (
    (getDatabase().prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as
      Quiz | undefined) ?? null
  );
}

export function createQuiz({ name, logoPath }: CreateQuizInput): Quiz {
  const database = getDatabase();
  const result = database
    .prepare('INSERT INTO quizzes (name, logo_path) VALUES (?, ?)')
    .run(requireQuizName(name), logoPath ?? null);
  const quiz = getQuizById(Number(result.lastInsertRowid));

  if (!quiz) {
    throw new Error('יצירת החידון נכשלה.');
  }

  return quiz;
}

export function updateQuiz(
  id: number,
  { name, logoPath }: UpdateQuizInput,
): Quiz | null {
  const database = getDatabase();
  const result = database
    .prepare(
      `
        UPDATE quizzes
        SET name = ?, logo_path = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
    )
    .run(requireQuizName(name), logoPath ?? null, id);

  return result.changes > 0 ? getQuizById(id) : null;
}

export function deleteQuiz(id: number): boolean {
  const result = getDatabase()
    .prepare('DELETE FROM quizzes WHERE id = ?')
    .run(id);

  return result.changes > 0;
}

export function duplicateQuiz(id: number): Quiz {
  const database = getDatabase();

  const duplicateTransaction = database.transaction(() => {
    const sourceQuiz = database
      .prepare('SELECT * FROM quizzes WHERE id = ?')
      .get(id) as Quiz | undefined;

    if (!sourceQuiz) {
      throw new Error('החידון שביקשתם לשכפל לא נמצא.');
    }

    const contestants = database
      .prepare(
        'SELECT * FROM contestants WHERE quiz_id = ? ORDER BY display_order, id',
      )
      .all(id) as Contestant[];
    const questions = database
      .prepare(
        'SELECT * FROM questions WHERE quiz_id = ? ORDER BY display_order, id',
      )
      .all(id) as QuestionRow[];
    const answers = database
      .prepare(
        `
          SELECT answers.*
          FROM answers
          INNER JOIN questions ON questions.id = answers.question_id
          WHERE questions.quiz_id = ?
          ORDER BY answers.display_order, answers.id
        `,
      )
      .all(id) as AnswerRow[];
    const hints = database
      .prepare(
        `
          SELECT hints.*
          FROM hints
          INNER JOIN questions ON questions.id = hints.question_id
          WHERE questions.quiz_id = ?
          ORDER BY hints.hint_order, hints.id
        `,
      )
      .all(id) as Hint[];

    const quizResult = database
      .prepare('INSERT INTO quizzes (name, logo_path) VALUES (?, ?)')
      .run(getNextCopyName(sourceQuiz.name), sourceQuiz.logo_path);
    const newQuizId = Number(quizResult.lastInsertRowid);
    const contestantIdMap = new Map<number, number>();
    const answersByQuestion = new Map<number, AnswerRow[]>();
    const hintsByQuestion = new Map<number, Hint[]>();

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

    const insertContestant = database.prepare(
      `
        INSERT INTO contestants (quiz_id, name, display_order)
        VALUES (?, ?, ?)
      `,
    );

    for (const contestant of contestants) {
      const result = insertContestant.run(
        newQuizId,
        contestant.name,
        contestant.display_order,
      );
      contestantIdMap.set(contestant.id, Number(result.lastInsertRowid));
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
      const newContestantId = contestantIdMap.get(question.contestant_id);

      if (!newContestantId) {
        throw new Error('נמצאה שאלה ללא מתמודד תקין; השכפול בוטל.');
      }

      const questionResult = insertQuestion.run(
        newQuizId,
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

    return newQuizId;
  });

  const duplicatedQuiz = getQuizById(duplicateTransaction());

  if (!duplicatedQuiz) {
    throw new Error('שכפול החידון נכשל.');
  }

  return duplicatedQuiz;
}

export function searchQuizzes(query: string): QuizSummary[] {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return getAllQuizzes();
  }

  return getDatabase()
    .prepare(
      `
        ${QUIZ_SUMMARY_SELECT}
        WHERE q.name LIKE ? ESCAPE '\\' COLLATE NOCASE
        ORDER BY q.updated_at DESC, q.id DESC
      `,
    )
    .all(`%${escapeLikeValue(trimmedQuery)}%`) as QuizSummary[];
}
