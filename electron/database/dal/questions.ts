import type Database from 'better-sqlite3';

import type {
  AnswerInput,
  HintInput,
  Question,
  QuestionMutationInput,
  QuestionSummaryWithRelations,
  QuestionWithRelations,
} from '../../../src/types';
import { getDatabase } from '../connection';
import {
  getAnswersByQuestionId,
  getAnswersByQuizId,
  replaceAnswers,
} from './answers';
import { getHintsByQuestionId, getHintsByQuizId, replaceHints } from './hints';

export type QuestionRecord = Question;
export type CreateQuestionInput = QuestionMutationInput;
export type UpdateQuestionInput = QuestionMutationInput;

type QuestionRow = Omit<Question, 'shuffle_answers'> & {
  shuffle_answers: number;
};

type QuestionSummaryRow = QuestionRow & {
  contestant_name: string;
  answerCount: number;
  hintCount: number;
};

function mapQuestion<T extends QuestionRow>(
  row: T,
): Omit<T, 'shuffle_answers'> & { shuffle_answers: boolean } {
  return { ...row, shuffle_answers: Boolean(row.shuffle_answers) };
}

function requireNonEmpty(value: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(message);
  return trimmed;
}

function validateAnswers(answers: AnswerInput[]): void {
  if (answers.length < 2) {
    throw new Error('יש להזין לפחות שתי אפשרויות תשובה.');
  }
  if (answers.some((answer) => !answer.answerText.trim())) {
    throw new Error('יש למלא טקסט בכל אפשרויות התשובה.');
  }
  if (!answers.some((answer) => answer.isCorrect)) {
    throw new Error('יש לסמן לפחות תשובה נכונה אחת.');
  }
}

function validateHints(hints: HintInput[], requireOne: boolean): void {
  if (requireOne && hints.length === 0) {
    throw new Error('יש להוסיף לפחות רמז אחד.');
  }
  for (const hint of hints) {
    if (hint.hintType === 'text' && !hint.hintText?.trim()) {
      throw new Error('יש למלא טקסט בכל הרמזים הטקסטואליים.');
    }
    if (!Number.isInteger(hint.pointsPenalty) || hint.pointsPenalty < 0) {
      throw new Error('הפחתת הניקוד ברמז חייבת להיות מספר שלם שאינו שלילי.');
    }
  }
}

function validateQuestionInput(data: QuestionMutationInput): void {
  requireNonEmpty(data.questionText, 'יש להזין טקסט לשאלה.');
  if (!Number.isInteger(data.quizId) || data.quizId <= 0) {
    throw new Error('החידון שנבחר אינו תקין.');
  }
  if (!Number.isInteger(data.contestantId) || data.contestantId <= 0) {
    throw new Error('המתמודד שנבחר אינו תקין.');
  }
  if (!Number.isInteger(data.points) || data.points < 0) {
    throw new Error('הניקוד חייב להיות מספר שלם וחיובי.');
  }
  if (
    data.timeLimit != null &&
    (!Number.isInteger(data.timeLimit) || data.timeLimit <= 0)
  ) {
    throw new Error('זמן המענה חייב להיות מספר שלם הגדול מאפס.');
  }

  switch (data.questionType) {
    case 'multiple_choice':
    case 'multiple_options':
      validateAnswers(data.answers);
      break;
    case 'true_false':
      validateAnswers(data.answers);
      if (
        data.answers.length !== 2 ||
        !data.answers.some((answer) => answer.answerText.trim() === 'נכון') ||
        !data.answers.some(
          (answer) => answer.answerText.trim() === 'לא נכון',
        ) ||
        data.answers.filter((answer) => answer.isCorrect).length !== 1
      ) {
        throw new Error(
          'בשאלת נכון/לא נכון נדרשות האפשרויות הקבועות ותשובה נכונה אחת.',
        );
      }
      break;
    case 'complete_sentence':
      requireNonEmpty(data.correctAnswerText ?? '', 'יש להזין תשובה נכונה.');
      validateHints(data.hints, false);
      break;
    case 'open_answer':
      requireNonEmpty(data.correctAnswerText ?? '', 'יש להזין תשובה נכונה.');
      break;
    case 'association_hints':
      validateAnswers(data.answers);
      validateHints(data.hints, true);
      if (data.hints.some((hint) => hint.hintType !== 'text')) {
        throw new Error('בשאלת אסוציאציה ניתן להשתמש ברמז טקסטואלי בלבד.');
      }
      break;
  }
}

function verifyContestantBelongsToQuiz(
  database: Database.Database,
  quizId: number,
  contestantId: number,
): void {
  const contestant = database
    .prepare('SELECT id FROM contestants WHERE id = ? AND quiz_id = ?')
    .get(contestantId, quizId);

  if (!contestant) {
    throw new Error('המתמודד אינו שייך לחידון שנבחר.');
  }
}

function nextDisplayOrder(
  database: Database.Database,
  contestantId: number,
): number {
  const row = database
    .prepare(
      'SELECT COALESCE(MAX(display_order), 0) + 1 AS nextOrder FROM questions WHERE contestant_id = ?',
    )
    .get(contestantId) as { nextOrder: number };
  return row.nextOrder;
}

function touchQuiz(database: Database.Database, quizId: number): void {
  database
    .prepare('UPDATE quizzes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(quizId);
}

function insertQuestion(
  database: Database.Database,
  data: QuestionMutationInput,
  displayOrder: number,
): number {
  const result = database
    .prepare(
      `
        INSERT INTO questions (
          quiz_id, contestant_id, question_type, question_text, image_path,
          explanation, correct_answer_text, points, time_limit, display_order,
          shuffle_answers
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      data.quizId,
      data.contestantId,
      data.questionType,
      data.questionText.trim(),
      data.imagePath ?? null,
      data.explanation?.trim() || null,
      data.correctAnswerText?.trim() || null,
      data.points,
      data.timeLimit ?? null,
      displayOrder,
      data.shuffleAnswers ? 1 : 0,
    );
  const questionId = Number(result.lastInsertRowid);
  const usesAnswers = [
    'multiple_choice',
    'true_false',
    'multiple_options',
    'association_hints',
  ].includes(data.questionType);
  const usesHints = ['complete_sentence', 'association_hints'].includes(
    data.questionType,
  );
  replaceAnswers(database, questionId, usesAnswers ? data.answers : []);
  replaceHints(database, questionId, usesHints ? data.hints : []);
  return questionId;
}

export function getQuestionsByQuizId(
  quizId: number,
): QuestionSummaryWithRelations[] {
  const database = getDatabase();
  const rows = database
    .prepare(
      `
        SELECT
          q.*,
          c.name AS contestant_name,
          (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id) AS answerCount,
          (SELECT COUNT(*) FROM hints h WHERE h.question_id = q.id) AS hintCount
        FROM questions q
        INNER JOIN contestants c ON c.id = q.contestant_id
        WHERE q.quiz_id = ?
        ORDER BY q.contestant_id ASC, q.display_order ASC, q.id ASC
      `,
    )
    .all(quizId) as QuestionSummaryRow[];

  const answersByQuestion = new Map<
    number,
    QuestionSummaryWithRelations['answers']
  >();
  const hintsByQuestion = new Map<
    number,
    QuestionSummaryWithRelations['hints']
  >();

  for (const answer of getAnswersByQuizId(database, quizId)) {
    const questionAnswers = answersByQuestion.get(answer.question_id) ?? [];
    questionAnswers.push(answer);
    answersByQuestion.set(answer.question_id, questionAnswers);
  }

  for (const hint of getHintsByQuizId(database, quizId)) {
    const questionHints = hintsByQuestion.get(hint.question_id) ?? [];
    questionHints.push(hint);
    hintsByQuestion.set(hint.question_id, questionHints);
  }

  return rows.map((row) => ({
    ...mapQuestion(row),
    answers: answersByQuestion.get(row.id) ?? [],
    hints: hintsByQuestion.get(row.id) ?? [],
  }));
}

export function getQuestionById(id: number): QuestionWithRelations | null {
  const database = getDatabase();
  const row = database
    .prepare('SELECT * FROM questions WHERE id = ?')
    .get(id) as QuestionRow | undefined;

  if (!row) return null;

  return {
    ...mapQuestion(row),
    answers: getAnswersByQuestionId(database, id),
    hints: getHintsByQuestionId(database, id),
  };
}

export function createQuestion(
  data: QuestionMutationInput,
): QuestionWithRelations {
  validateQuestionInput(data);
  const database = getDatabase();
  const questionId = database.transaction(() => {
    verifyContestantBelongsToQuiz(database, data.quizId, data.contestantId);
    const order =
      data.displayOrder ?? nextDisplayOrder(database, data.contestantId);
    const id = insertQuestion(database, data, order);
    touchQuiz(database, data.quizId);
    return id;
  })();
  const question = getQuestionById(questionId);
  if (!question) throw new Error('יצירת השאלה נכשלה.');
  return question;
}

export function updateQuestion(
  id: number,
  data: QuestionMutationInput,
): QuestionWithRelations | null {
  validateQuestionInput(data);
  const database = getDatabase();
  const updated = database.transaction(() => {
    const existing = database
      .prepare('SELECT * FROM questions WHERE id = ?')
      .get(id) as QuestionRow | undefined;
    if (!existing) return false;

    if (existing.question_type !== data.questionType) {
      throw new Error('לא ניתן לשנות סוג של שאלה קיימת.');
    }

    verifyContestantBelongsToQuiz(database, data.quizId, data.contestantId);
    const displayOrder =
      existing.contestant_id === data.contestantId
        ? existing.display_order
        : nextDisplayOrder(database, data.contestantId);

    database
      .prepare(
        `
          UPDATE questions SET
            quiz_id = ?, contestant_id = ?, question_type = ?, question_text = ?,
            image_path = ?, explanation = ?, correct_answer_text = ?, points = ?,
            time_limit = ?, display_order = ?, shuffle_answers = ?
          WHERE id = ?
        `,
      )
      .run(
        data.quizId,
        data.contestantId,
        data.questionType,
        data.questionText.trim(),
        data.imagePath ?? null,
        data.explanation?.trim() || null,
        data.correctAnswerText?.trim() || null,
        data.points,
        data.timeLimit ?? null,
        displayOrder,
        data.shuffleAnswers ? 1 : 0,
        id,
      );
    const usesAnswers = [
      'multiple_choice',
      'true_false',
      'multiple_options',
      'association_hints',
    ].includes(data.questionType);
    const usesHints = ['complete_sentence', 'association_hints'].includes(
      data.questionType,
    );
    replaceAnswers(database, id, usesAnswers ? data.answers : []);
    replaceHints(database, id, usesHints ? data.hints : []);
    touchQuiz(database, existing.quiz_id);
    if (existing.quiz_id !== data.quizId) touchQuiz(database, data.quizId);
    return true;
  })();

  return updated ? getQuestionById(id) : null;
}

export function deleteQuestion(id: number): boolean {
  const database = getDatabase();
  return database.transaction(() => {
    const question = database
      .prepare('SELECT quiz_id FROM questions WHERE id = ?')
      .get(id) as { quiz_id: number } | undefined;
    if (!question) return false;
    database.prepare('DELETE FROM questions WHERE id = ?').run(id);
    touchQuiz(database, question.quiz_id);
    return true;
  })();
}

export function reorderQuestions(
  contestantId: number,
  orderedIds: number[],
): boolean {
  const database = getDatabase();
  return database.transaction(() => {
    const rows = database
      .prepare(
        'SELECT id, quiz_id FROM questions WHERE contestant_id = ? ORDER BY display_order, id',
      )
      .all(contestantId) as Array<{ id: number; quiz_id: number }>;
    const currentIds = rows.map((row) => row.id).sort((a, b) => a - b);
    const requestedIds = [...orderedIds].sort((a, b) => a - b);

    if (
      currentIds.length !== requestedIds.length ||
      currentIds.some((id, index) => id !== requestedIds[index])
    ) {
      throw new Error('סדר השאלות שנשלח אינו תואם לרשימה הנוכחית.');
    }

    const update = database.prepare(
      'UPDATE questions SET display_order = ? WHERE id = ? AND contestant_id = ?',
    );
    orderedIds.forEach((id, index) => update.run(index + 1, id, contestantId));
    if (rows[0]) touchQuiz(database, rows[0].quiz_id);
    return true;
  })();
}

export function duplicateQuestion(id: number): QuestionWithRelations {
  const database = getDatabase();
  const newId = database.transaction(() => {
    const row = database
      .prepare('SELECT * FROM questions WHERE id = ?')
      .get(id) as QuestionRow | undefined;
    if (!row) throw new Error('השאלה שביקשתם לשכפל לא נמצאה.');
    const source = {
      ...mapQuestion(row),
      answers: getAnswersByQuestionId(database, id),
      hints: getHintsByQuestionId(database, id),
    };
    const data: QuestionMutationInput = {
      quizId: source.quiz_id,
      contestantId: source.contestant_id,
      questionType: source.question_type,
      questionText: source.question_text,
      imagePath: source.image_path,
      explanation: source.explanation,
      correctAnswerText: source.correct_answer_text,
      points: source.points,
      timeLimit: source.time_limit,
      shuffleAnswers: source.shuffle_answers,
      answers: source.answers.map((answer, index) => ({
        answerText: answer.answer_text,
        imagePath: answer.image_path,
        isCorrect: answer.is_correct,
        displayOrder: index + 1,
      })),
      hints: source.hints.map((hint, index) => ({
        hintType: hint.hint_type,
        hintText: hint.hint_text,
        hintOrder: index + 1,
        pointsPenalty: hint.points_penalty,
      })),
    };
    const duplicatedId = insertQuestion(
      database,
      data,
      nextDisplayOrder(database, source.contestant_id),
    );
    touchQuiz(database, source.quiz_id);
    return duplicatedId;
  })();
  const duplicated = getQuestionById(newId);
  if (!duplicated) throw new Error('שכפול השאלה נכשל.');
  return duplicated;
}
