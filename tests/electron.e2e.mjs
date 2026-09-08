import assert from 'node:assert/strict';
import {
  mkdtempSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  rmSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { _electron, expect } from '@playwright/test';

const temporary = mkdtempSync(join(tmpdir(), 'hamemuha-live-test-'));
const artifactDir = resolve('test-results/live');
mkdirSync(artifactDir, { recursive: true });
const databasePath = join(temporary, 'hamemuha.sqlite3');
const db = new DatabaseSync(databasePath);
db.exec(readFileSync('electron/database/migrations/001_initial.sql', 'utf8'));
db.prepare('INSERT INTO quizzes (id, name) VALUES (1, ?)').run('בדיקת לייב');
db.prepare(
  'INSERT INTO contestants (id, quiz_id, name, display_order) VALUES (1, 1, ?, 1)',
).run('מתמודד בדיקה');
const types = [
  'multiple_choice',
  'true_false',
  'complete_sentence',
  'open_answer',
  'multiple_options',
  'association_hints',
];
for (const [index, type] of types.entries()) {
  const id = index + 1;
  db.prepare(
    'INSERT INTO questions (id, quiz_id, contestant_id, question_type, question_text, correct_answer_text, points, time_limit, display_order) VALUES (?, 1, 1, ?, ?, ?, 10, ?, ?)',
  ).run(
    id,
    type,
    `שאלה ${id} — ${type}`,
    'אב גד',
    type === 'true_false' ? 30 : null,
    id,
  );
  if (![3, 4].includes(id)) {
    const count = id === 2 ? 2 : 6;
    for (let option = 0; option < count; option++) {
      const text =
        id === 2 ? ['נכון', 'לא נכון'][option] : `אפשרות ${option + 1}`;
      db.prepare(
        'INSERT INTO answers (question_id, answer_text, is_correct, display_order) VALUES (?, ?, ?, ?)',
      ).run(
        id,
        text,
        option === 0 || (id !== 2 && option === 1) ? 1 : 0,
        option + 1,
      );
    }
  }
}
const legacyImageDirectory = join(temporary, 'images', 'question-images');
mkdirSync(legacyImageDirectory, { recursive: true });
copyFileSync(
  resolve('src/assets/images/company-logo.png'),
  join(legacyImageDirectory, 'existing.png'),
);
db.prepare(
  "UPDATE questions SET image_path = 'images/question-images/existing.png' WHERE id IN (1, 6)",
).run();
db.prepare(
  "INSERT INTO hints (question_id, hint_type, hint_text, hint_order, points_penalty) VALUES (3, 'letter_reveal', '1', 1, 2)",
).run();
db.prepare(
  "INSERT INTO hints (question_id, hint_type, hint_text, hint_order, points_penalty) VALUES (6, 'text', 'רמז מדורג ישן', 1, 8)",
).run();
db.close();
const launcher = join(temporary, 'launcher.cjs');
writeFileSync(
  launcher,
  `const electron = require('electron');\nconst mediaSelections = ${JSON.stringify(
    [
      resolve('src/assets/videos/intro.mp4'),
      resolve('src/assets/sounds/timer-countdown.mp3'),
    ],
  )};\nelectron.dialog.showOpenDialog = async (options) => {\n  if (options.title !== 'בחירת מדיה לשאלה') throw new Error('Unexpected file dialog');\n  const filePath = mediaSelections.shift();\n  return filePath ? { canceled: false, filePaths: [filePath] } : { canceled: true, filePaths: [] };\n};\nelectron.app.setPath('userData', ${JSON.stringify(temporary)});\nrequire(${JSON.stringify(resolve('dist-electron/main.js'))});\n`,
);
let app;
const errors = [];
try {
  app = await _electron.launch({
    args: [launcher],
    timeout: 20000,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '' },
  });
  const page = await app.firstWindow();
  page.setDefaultTimeout(10000);
  const screenshot = async (name) => {
    await page.waitForTimeout(1200);
    const png = await app.evaluate(async ({ BrowserWindow }) => {
      const image = await BrowserWindow.getAllWindows()[0].capturePage();
      return image.toPNG().toString('base64');
    });
    writeFileSync(join(artifactDir, name), Buffer.from(png, 'base64'));
  };
  page.on('pageerror', (error) => errors.push(error.message));
  await page.waitForFunction(() => Boolean(window.api));
  await expect(
    page.getByRole('button', { name: 'הפעלת החידון בדיקת לייב' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'הפעלת החידון בדיקת לייב' }).click();
  await page.waitForURL('**#/quiz/1/live');
  await expect(page.locator('.live-opening')).toBeVisible();
  await expect(page.getByRole('img', { name: /החידון והחוויה/ })).toBeVisible();
  await expect(page.getByText('התחל!', { exact: true })).toBeVisible();
  await screenshot('opening-branding.png');
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-intro-video__media')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-question__media img')).toBeVisible();
  await page.waitForFunction(
    () => document.querySelector('.live-question__media img')?.naturalWidth > 0,
  );
  await page.evaluate(() => {
    location.hash = '/';
  });
  await page.getByRole('button', { name: 'פתיחת החידון בדיקת לייב' }).click();
  await page.waitForURL('**#/quizzes/1/edit');
  await screenshot('quiz-editor-numbers.png');
  console.log(
    'PASS: direct play, card edit navigation, opening copy/logo, Enter intro skip and legacy image media',
  );

  const migrated = await page.evaluate(() => window.api.question.getById(3));
  assert.equal(migrated.prerevealed_positions, '[]');
  assert.equal(
    (await page.evaluate(() => window.api.question.getById(6))).hints.length,
    1,
  );
  console.log(
    'PASS: legacy database migrated without deleting association hints',
  );

  const firstQuestion = page
    .locator('article')
    .filter({ hasText: 'שאלה 1 — multiple_choice' });
  await expect(firstQuestion.getByLabel('שאלה מספר 1')).toBeVisible();
  await page.evaluate(() => window.api.question.reorder(1, [2, 1, 3, 4, 5, 6]));
  await page.reload();
  await page.waitForFunction(() => Boolean(window.api));
  await expect(firstQuestion.getByLabel('שאלה מספר 2')).toBeVisible();
  await page.evaluate(() => window.api.question.reorder(1, [1, 2, 3, 4, 5, 6]));
  console.log('PASS: question numbering updates after persisted reorder');

  const targetContestant = await page.evaluate(() =>
    window.api.contestant.create({
      quizId: 1,
      name: 'מתמודד יעד',
      displayOrder: 2,
    }),
  );
  await page.reload();
  await page.waitForFunction(() => Boolean(window.api));
  await expect(
    page.getByRole('heading', { name: 'השאלות של מתמודד בדיקה' }),
  ).toBeVisible();
  await page
    .getByRole('button', {
      name: /שכפול שאלה 6 — association_hints/,
    })
    .click();
  await screenshot('duplicate-question-dialog.png');
  await page.getByLabel('מתמודד יעד').selectOption(String(targetContestant.id));
  await page.getByRole('button', { name: 'יצירת עותק' }).click();
  await expect(
    page.getByRole('heading', { name: 'השאלות של מתמודד יעד' }),
  ).toBeVisible();
  const copiedToTarget = await page.evaluate(
    async (contestantId) =>
      (await window.api.question.getByQuizId(1)).find(
        (question) => question.contestant_id === contestantId,
      ),
    targetContestant.id,
  );
  assert.equal(copiedToTarget.display_order, 1);
  assert.equal(copiedToTarget.answers.length, 6);
  assert.equal(copiedToTarget.hints.length, 1);
  assert.equal(
    copiedToTarget.image_path,
    'images/question-images/existing.png',
  );
  await page.evaluate(
    (contestantId) => window.api.contestant.delete(contestantId),
    targetContestant.id,
  );
  console.log('PASS: target contestant dialog and full deep-copy');

  // Exercise the real editor -> preload IPC -> SQLite -> edit hydration boundary.
  await page.evaluate(() => {
    location.hash = '/quizzes/1/questions/3/edit';
  });
  await expect(page.getByLabel('המילה או הביטוי החסרים')).toHaveValue('אב גד');
  await page
    .getByRole('group', { name: 'בחירת אותיות גלויות מראש' })
    .getByRole('button', { name: 'א, מיקום 1', exact: true })
    .click();
  await page
    .getByRole('group', { name: 'בחירת מיקומי אותיות לרמז 1' })
    .getByRole('button', { name: 'ג, מיקום 4', exact: true })
    .click();
  await page.getByRole('button', { name: 'שמירת שאלה' }).click();
  await page.waitForURL('**#/quizzes/1/edit');
  const saved = await page.evaluate(() => window.api.question.getById(3));
  assert.equal(saved.prerevealed_positions, '[0]');
  assert.equal(saved.hints[0].hint_text, '[1,3]');
  await page.evaluate(() => {
    location.hash = '/quizzes/1/questions/3/edit';
  });
  await expect(
    page
      .getByRole('group', { name: 'בחירת אותיות גלויות מראש' })
      .getByRole('button', { name: 'א, מיקום 1', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  console.log('PASS: editor multi-letter hint/prerevealed save and hydration');

  const typeChangeCopy = await page.evaluate(() =>
    window.api.question.duplicate(3),
  );
  await page.evaluate((id) => {
    location.hash = `/quizzes/1/questions/${id}/edit`;
  }, typeChangeCopy.id);
  await page.getByRole('combobox').first().selectOption('open_answer');
  await expect(page.getByLabel('התשובה הנכונה')).toHaveValue('');
  await page.getByLabel('התשובה הנכונה').fill('תשובה אחרי שינוי סוג');
  await page.getByRole('button', { name: 'שמירת שאלה' }).click();
  await page.waitForURL('**#/quizzes/1/edit');
  const changedType = await page.evaluate(
    (id) => window.api.question.getById(id),
    typeChangeCopy.id,
  );
  assert.equal(changedType.question_type, 'open_answer');
  assert.equal(changedType.correct_answer_text, 'תשובה אחרי שינוי סוג');
  assert.equal(changedType.answers.length, 0);
  assert.equal(changedType.hints.length, 0);
  assert.equal(changedType.prerevealed_positions, '[]');
  await page.evaluate(
    (id) => window.api.question.delete(id),
    typeChangeCopy.id,
  );
  console.log('PASS: changing type resets old type-specific data');

  // All three copy paths must carry the new field.
  const copies = await page.evaluate(async () => {
    const q = await window.api.question.duplicate(3);
    await window.api.question.delete(q.id);
    const contestant = await window.api.contestant.duplicate(1);
    const contestantQuestions = await window.api.question.getByQuizId(1);
    const cq = contestantQuestions.find(
      (item) =>
        item.contestant_id === contestant.id &&
        item.question_type === 'complete_sentence',
    );
    await window.api.contestant.delete(contestant.id);
    const quiz = await window.api.quiz.duplicate(1);
    const quizQuestions = await window.api.question.getByQuizId(quiz.id);
    const qq = quizQuestions.find(
      (item) => item.question_type === 'complete_sentence',
    );
    await window.api.quiz.delete(quiz.id);
    return [
      q.prerevealed_positions,
      cq?.prerevealed_positions,
      qq?.prerevealed_positions,
    ];
  });
  assert.deepEqual(copies, ['[0]', '[0]', '[0]']);
  await page.evaluate(() => {
    location.hash = '/quizzes/1/questions/6/edit';
  });
  await expect(page.getByRole('button', { name: 'שמירת שאלה' })).toBeVisible();
  await expect(page.getByRole('combobox').first()).toHaveValue(
    'association_hints',
  );
  await expect(page.getByText('הוספת רמז', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'שמירת שאלה' }).click();
  await page.waitForURL('**#/quizzes/1/edit');
  assert.equal(
    (await page.evaluate(() => window.api.question.getById(6))).hints.length,
    1,
  );
  console.log(
    'PASS: question/contestant/quiz duplication and legacy type-6 edit',
  );

  await page.evaluate(() => {
    location.hash = '/quizzes/1/questions/1/edit';
  });
  await expect(page.locator('img[alt="תצוגה מקדימה"]')).toBeVisible();
  await page.getByRole('button', { name: 'החלפת מדיה' }).click();
  await expect(page.getByLabel('תצוגה מקדימה של הווידאו')).toBeVisible();
  await page.getByRole('button', { name: 'שמירת שאלה' }).click();
  await page.waitForURL('**#/quizzes/1/edit');
  assert.match(
    (await page.evaluate(() => window.api.question.getById(1))).image_path,
    /^media\/question-media\/.+\.mp4$/,
  );
  await page.evaluate(() => {
    location.hash = '/quiz/1/live';
  });
  await expect(page.locator('.live-opening')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-intro-video__media')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('וידאו מצורף לשאלה')).toBeVisible();
  await page.waitForTimeout(1200);
  const videoState = await page
    .getByLabel('וידאו מצורף לשאלה')
    .evaluate((media) => ({
      currentSrc: media.currentSrc,
      errorCode: media.error?.code ?? null,
      errorMessage: media.error?.message ?? null,
      networkState: media.networkState,
      readyState: media.readyState,
    }));
  assert.ok(videoState.readyState >= 1, JSON.stringify(videoState));
  await screenshot('question-video.png');

  await page.evaluate(() => {
    location.hash = '/quizzes/1/questions/1/edit';
  });
  await page.getByRole('button', { name: 'החלפת מדיה' }).click();
  await expect(page.getByLabel('תצוגה מקדימה של האודיו')).toBeVisible();
  await page.getByRole('button', { name: 'שמירת שאלה' }).click();
  await page.waitForURL('**#/quizzes/1/edit');
  assert.match(
    (await page.evaluate(() => window.api.question.getById(1))).image_path,
    /^media\/question-media\/.+\.mp3$/,
  );
  await page.evaluate(() => {
    location.hash = '/quiz/1/live';
  });
  await expect(page.locator('.live-opening')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-intro-video__media')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('אודיו מצורף לשאלה')).toBeVisible();
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="אודיו מצורף לשאלה"]')?.readyState >=
      1,
  );
  await screenshot('question-audio.png');
  await page.evaluate(() => {
    location.hash = '/quizzes/1/questions/1/edit';
  });
  await page.getByRole('button', { name: 'הסרת מדיה' }).click();
  await page.getByRole('button', { name: 'שמירת שאלה' }).click();
  await page.waitForURL('**#/quizzes/1/edit');
  assert.equal(
    (await page.evaluate(() => window.api.question.getById(1))).image_path,
    null,
  );
  console.log('PASS: image, MP4 and MP3 editor/live media flow');

  await page.evaluate(() => {
    window.__audioStarts = [];
    const original = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.__audioStarts.push({
        args,
        loopEnd: this.loopEnd,
        bufferDuration: this.buffer?.duration,
      });
      return original.apply(this, args);
    };
    location.hash = '/quiz/1/live';
  });
  await expect(page.locator('.live-opening')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-intro-video__media')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-answer-tile')).toHaveCount(6, {
    timeout: 2000,
  });
  await page.waitForFunction(
    () =>
      window.__audioStarts.some(
        (sound) => sound.loopEnd > 50 && sound.loopEnd < 60,
      ),
    undefined,
    { timeout: 3000 },
  );
  await page.keyboard.press('F1');
  await page.keyboard.press('F2');
  await expect(page.locator('.live-answer-tile')).toHaveCount(6);
  await page.keyboard.press('F4');
  await expect(page.locator('.live-answer-tile')).toHaveCount(4);
  await expect(page.getByText('5 נקודות', { exact: true })).toBeVisible();
  await page.keyboard.press('F4');
  await expect(page.locator('.live-answer-tile')).toHaveCount(4);
  await screenshot('type-1-fifty-fifty.png');
  for (const name of ['אפשרות 1', 'אפשרות 2'])
    await page.getByRole('button', { name: new RegExp(name) }).click();
  assert.equal(await page.getByRole('button', { name: /הגש|הגשת/ }).count(), 0);
  await page.keyboard.press('Enter');
  await expect(page.getByText('תשובה נכונה!', { exact: true })).toBeVisible();
  await page.waitForTimeout(6200);
  await expect(page.getByText('תשובה נכונה!', { exact: true })).toBeVisible();
  assert.equal(await page.locator('.live-feedback__progress').count(), 0);
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-answer-tile')).toHaveCount(2, {
    timeout: 2000,
  });
  await page.waitForFunction(
    () => window.__audioStarts.some((sound) => sound.loopEnd === 10),
    undefined,
    { timeout: 3000 },
  );
  await page.getByRole('button', { name: 'נכון', exact: true }).click();
  await page.keyboard.press('Enter');
  await expect(page.getByText('תשובה נכונה!', { exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  console.log(
    'PASS: types 1/2, real function keys, manual feedback and immediate background/countdown Web Audio',
  );

  await expect(
    page.getByRole('group', { name: 'תיבות התשובה — מענה בעל פה' }),
  ).toBeInViewport();
  await expect(page.locator('[data-revealed="true"]')).toHaveCount(1);
  assert.equal(await page.locator('input').count(), 0);
  await page.keyboard.press('Enter');
  await page.keyboard.type('abc');
  await expect(page.locator('[data-revealed="true"]')).toHaveCount(1);
  await page.keyboard.press('F4');
  await expect(page.locator('[data-revealed="true"]')).toHaveCount(3);
  await screenshot('type-3-hint.png');
  await page.keyboard.press('F1');
  await expect(page.getByText('תשובה נכונה!', { exact: true })).toBeVisible();
  await expect(page.locator('[data-revealed="true"]')).toHaveCount(4);
  await screenshot('type-3-correct.png');
  // Revisit via the contestant shortcut, which is intentionally retained.
  await page.keyboard.press('1');
  await expect(page.locator('.live-letter-board')).toBeVisible();
  await page.keyboard.press('F2');
  await expect(page.getByText('אב גד', { exact: true })).toBeVisible();
  await page.waitForTimeout(6200);
  await expect(page.getByText('אב גד', { exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-question--open-answer')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-question--open-answer')).toBeVisible();
  await page.keyboard.press('F2');
  await expect(page.getByText('אב גד', { exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  console.log(
    'PASS: types 3/4 oral judging, multi-letter hint, filled celebration and full wrong answer',
  );

  for (const type of ['multiple-options', 'association']) {
    await expect(page.locator(`.live-question--${type}`)).toBeVisible();
    await expect(page.locator('.live-answer-tile')).toHaveCount(6);
    await page.keyboard.press('F4');
    await page.keyboard.press('F1');
    await page.keyboard.press('F2');
    await expect(page.locator('.live-answer-tile')).toHaveCount(6);
    await expect(page.getByText('10 נקודות', { exact: true })).toBeVisible();
    assert.equal(await page.getByText('רמז מדורג ישן').count(), 0);
    if (type === 'association') await screenshot('type-6-association.png');
    for (const name of ['אפשרות 1', 'אפשרות 2'])
      await page.getByRole('button', { name: new RegExp(name) }).click();
    await page.keyboard.press('Enter');
    await expect(page.getByText('תשובה נכונה!', { exact: true })).toBeVisible();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('.live-scoreboard')).toBeVisible();
  await expect(page.getByRole('img', { name: /החידון והחוויה/ })).toBeVisible();
  await screenshot('scoreboard-branding.png');
  const results = new DatabaseSync(databasePath);
  const savedStats = results
    .prepare('SELECT * FROM contestant_results ORDER BY id DESC LIMIT 1')
    .get();
  assert.equal(savedStats.total_score, 35);
  assert.equal(savedStats.correct_count, 4);
  assert.equal(savedStats.wrong_count, 2);
  results.close();
  assert.deepEqual(errors, []);
  console.log(
    'PASS: types 5/6, scoreboard and persisted results; no renderer errors',
  );
  await app.close();
  app = undefined;
  // Opening the same migrated database again must not ALTER it a second time.
  app = await _electron.launch({
    args: [launcher],
    timeout: 20000,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '' },
  });
  const reopened = await app.firstWindow();
  assert.equal(
    (await reopened.evaluate(() => window.api.question.getById(3)))
      .prerevealed_positions,
    '[0]',
  );
  console.log('PASS: migration is idempotent on restart');
} finally {
  if (app) await app.close();
  rmSync(temporary, { recursive: true, force: true });
}
